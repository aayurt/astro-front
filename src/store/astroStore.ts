import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authClient } from '../lib/auth-client';
import apiClient from '../lib/api-client';
import { cacheDB } from '../lib/cache';
import { ChartData, MahaDasha, YoginiDasha, User } from '../types/api';

const CACHE_TTL = {
  PLANETS: 60 * 60 * 1000,
  D9: 60 * 60 * 1000,
  MAHA_DASHAS: 60 * 60 * 1000,
  YOGINI_DASHAS: 60 * 60 * 1000,
  TRANSIT: 60 * 60 * 1000,
  MY_TRANSIT: 60 * 60 * 1000,
  GOCHAR: 60 * 60 * 1000,
  AI_PERSONA: 24 * 60 * 60 * 1000,
  COINS: 5 * 60 * 1000,
};

async function cacheFetch<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<{ data: T; fromCache: boolean }> {
  const cached = await cacheDB.get<T>(key);
  const valid = cached !== null && (typeof cached !== 'object' || Object.keys(cached as object).length > 0);
  if (!valid) {
    await cacheDB.delete(key);
  }
  if (valid) {
    fetchFn().then(fresh => cacheDB.set(key, fresh, ttl)).catch(() => {});
    return { data: cached, fromCache: true };
  }
  const fresh = await fetchFn();
  await cacheDB.set(key, fresh, ttl);
  return { data: fresh, fromCache: false };
}

interface AstroState {
  user: User | null;
  planets: ChartData | null;
  d9Chart: ChartData | null;
  specialPlanets: any | null;
  mahaDashas: MahaDasha[];
  yoginiDashas: YoginiDasha[];
  transitData: ChartData | null;
  myTransitData: ChartData | null;
  lagnaGochar: ChartData | null;
  chandraGochar: ChartData | null;
  aiPersona: string | null;
  coins: number;
  canClaim: boolean;
  loading: boolean;
  backgroundRefreshing: boolean;
  loadingAiPersona: boolean;
  hydrated: boolean;
  error: string | null;
  lastTransitFetch: number | null;
  fetchAstroData: (force?: boolean, token?: string) => Promise<void>;
  fetchCoinStatus: () => Promise<void>;
  claimDailyCoins: () => Promise<void>;
  fetchTransitData: (force?: boolean) => Promise<void>;
  fetchMyTransitData: (force?: boolean) => Promise<void>;
  fetchLagnaGochar: (force?: boolean) => Promise<void>;
  fetchChandraGochar: (force?: boolean) => Promise<void>;
  fetchAllTransitData: (force?: boolean) => Promise<void>;
  fetchVimsottariDashas: (force?: boolean) => Promise<void>;
  fetchYoginiDashas: (force?: boolean) => Promise<void>;
  fetchAiPersona: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateUserAndRefresh: (userData: Partial<User>) => Promise<void>;
  clearAstroData: () => void;
  logout: () => Promise<void>;
  setHydrated: (val: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAstroStore = create<AstroState>()(
  persist(
    (set, get) => ({
      user: null,
      planets: null,
      d9Chart: null,
      specialPlanets: null,
      mahaDashas: [],
      yoginiDashas: [],
      transitData: null,
      myTransitData: null,
      lagnaGochar: null,
      chandraGochar: null,
      aiPersona: null,
      coins: 0,
      canClaim: false,
      loading: false,
      backgroundRefreshing: false,
      loadingAiPersona: false,
      hydrated: false,
      error: null,
      lastTransitFetch: null,

      setHydrated: (val: boolean) => set({ hydrated: val }),

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      refreshData: async () => {
        await get().fetchAstroData(true);
        await get().fetchCoinStatus();
      },

      updateUserAndRefresh: async (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
        await cacheDB.delete('astro-planets');
        await cacheDB.delete('astro-d9');
        await cacheDB.delete('astro-maha-dashas');
        await cacheDB.delete('astro-yogini-dashas');
        await get().fetchAstroData(true);
      },

      clearAstroData: () => {
        set({
          user: null,
          planets: null,
          d9Chart: null,
          specialPlanets: null,
          mahaDashas: [],
          yoginiDashas: [],
          transitData: null,
          myTransitData: null,
          lagnaGochar: null,
          chandraGochar: null,
          aiPersona: null,
          coins: 0,
          canClaim: false,
          loading: false,
          backgroundRefreshing: false,
          loadingAiPersona: false,
          hydrated: false,
          error: null,
          lastTransitFetch: null,
        });
        cacheDB.clear();
      },

      logout: async () => {
        try {
          await authClient.signOut();
        } catch (e) {
          console.error('Sign out error', e);
        }
        get().clearAstroData();
        window.location.href = '/login';
      },

      fetchCoinStatus: async () => {
        try {
          const res = await apiClient.get('/api/user/coins');
          set({ coins: res.data.coins, canClaim: res.data.canClaim });
          cacheDB.set('astro-coins', { coins: res.data.coins, canClaim: res.data.canClaim }, CACHE_TTL.COINS);
        } catch (err: any) {
          const cached = await cacheDB.get<{ coins: number; canClaim: boolean }>('astro-coins');
          if (cached) {
            set({ coins: cached.coins, canClaim: cached.canClaim });
          }
          set({ error: err.message || 'Failed to fetch coin status' });
        }
      },

      claimDailyCoins: async () => {
        if (!get().canClaim) return;

        set({ loading: true });
        try {
          const res = await apiClient.post('/api/user/claim-coins', {});
          await cacheDB.set('astro-coins', { coins: res.data.coins, canClaim: false }, CACHE_TTL.COINS);
          set({ coins: res.data.coins, canClaim: false, loading: false });
        } catch (err: any) {
          console.error('Error claiming coins', err);
          set({ error: err.message || 'Failed to claim coins', loading: false });
        }
      },

      fetchAstroData: async (force = false, token?: string) => {
        if (!force && !get().hydrated) {
          console.log('Waiting for hydration...');
          return;
        }

        if (!force && get().planets && Object.keys(get().planets!).length > 0 && get().d9Chart) {
          const lastTransitFetch = get().lastTransitFetch;
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (!lastTransitFetch || now - lastTransitFetch > oneHour) {
            get().fetchTransitData(true);
          }
          get().fetchCoinStatus();
          return;
        }

        let sessionToken = token;
        let userData = null;

        if (!sessionToken) {
          const session = await authClient.getSession();
          sessionToken = session?.data?.session?.token;
          userData = session?.data?.user;
        }

        if (!sessionToken) {
          set({ loading: false, error: 'Not authenticated' });
          return;
        }

        const cachedPlanets = await cacheDB.get<ChartData>('astro-planets');
        const cachedD9 = await cacheDB.get<ChartData>('astro-d9');
        const cachedMaha = await cacheDB.get<MahaDasha[]>('astro-maha-dashas');
        const cachedYogini = await cacheDB.get<YoginiDasha[]>('astro-yogini-dashas');

        const allCached = cachedPlanets && cachedD9 && cachedMaha && cachedYogini;

        if (allCached && !force) {
          const specialPlanets = calculateSpecialPlanets(cachedPlanets!);
          set({
            user: { ...(get().user || {}), ...(userData || {}) },
            planets: cachedPlanets,
            d9Chart: cachedD9,
            specialPlanets,
            mahaDashas: cachedMaha!,
            yoginiDashas: cachedYogini!,
            backgroundRefreshing: true,
          });
          get().fetchCoinStatus();
        } else {
          set({ loading: !allCached, backgroundRefreshing: false, error: null });
        }

        try {
          const results = await Promise.allSettled([
            apiClient.get('/api/astrology/planets-extended'),
            apiClient.get('/api/astrology/d9-chart'),
            apiClient.get('/api/astrology/maha-dashas'),
            apiClient.get('/api/astrology/yogini-dasha'),
            apiClient.get('/api/astrology/transit'),
          ]);

          const errors: string[] = [];
          const planetsRes = results[0].status === 'fulfilled' ? results[0].value : null;
          const d9Res = results[1].status === 'fulfilled' ? results[1].value : null;
          const mahaDashasRes = results[2].status === 'fulfilled' ? results[2].value : null;
          const yoginiDashasRes = results[3].status === 'fulfilled' ? results[3].value : null;
          const transitRes = results[4].status === 'fulfilled' ? results[4].value : null;

          if (!planetsRes) {
            results.forEach((r, i) => {
              if (r.status === 'rejected') {
                errors.push(`Request ${i + 1}: ${r.reason?.message || r.reason || 'unknown'}`);
              }
            });
            if (!allCached) {
              set({ loading: false, error: errors.join('; ') || 'Failed to fetch planets data' });
            }
            return;
          }

          const natal = planetsRes.data;
          const specialPlanets = calculateSpecialPlanets(natal);

          await Promise.all([
            cacheDB.set('astro-planets', natal, CACHE_TTL.PLANETS),
            cacheDB.set('astro-d9', d9Res?.data, CACHE_TTL.D9),
            cacheDB.set('astro-maha-dashas', mahaDashasRes?.data || [], CACHE_TTL.MAHA_DASHAS),
            cacheDB.set('astro-yogini-dashas', yoginiDashasRes?.data || [], CACHE_TTL.YOGINI_DASHAS),
          ]);

          set({
            user: { ...(get().user || {}), ...(userData || {}) },
            planets: natal,
            d9Chart: d9Res?.data ?? get().d9Chart,
            specialPlanets,
            mahaDashas: mahaDashasRes?.data ?? get().mahaDashas,
            yoginiDashas: yoginiDashasRes?.data ?? get().yoginiDashas,
            transitData: transitRes?.data ?? get().transitData,
            loading: false,
            backgroundRefreshing: false,
          });

          if (errors.length > 0) {
            console.warn('Partial fetch — some requests failed:', errors);
          }
          get().fetchCoinStatus();
        } catch (err: any) {
          console.error('Error fetching astro data', err);
          if (!allCached) {
            set({ error: err.message || 'Failed to fetch astrology data', loading: false, backgroundRefreshing: false });
          }
        }
      },

      fetchTransitData: async (force = false) => {
        await get().fetchAllTransitData(force);
      },

      fetchMyTransitData: async (force = false) => {
        await get().fetchAllTransitData(force);
      },

      fetchLagnaGochar: async (force = false) => {
        await get().fetchAllTransitData(force);
      },

      fetchChandraGochar: async (force = false) => {
        await get().fetchAllTransitData(force);
      },

      fetchAllTransitData: async (force = false) => {
        const cached = await cacheDB.get<any>('astro-all-transit');
        const cacheValid = cached && Object.keys(cached).length > 0 && cached.transit && Object.keys(cached.transit).length > 0;
        if (!cacheValid) {
          await cacheDB.delete('astro-all-transit');
        }
        if (cacheValid && !force) {
          set({
            transitData: cached.transit,
            myTransitData: cached.myTransit,
            lagnaGochar: cached.lagnaGochar,
            chandraGochar: cached.chandraGochar,
            lastTransitFetch: Date.now(),
          });
          return;
        }

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/api/astrology/all-transit');
          await cacheDB.set('astro-all-transit', res.data, CACHE_TTL.TRANSIT);
          set({
            transitData: res.data.transit,
            myTransitData: res.data.myTransit,
            lagnaGochar: res.data.lagnaGochar,
            chandraGochar: res.data.chandraGochar,
            loading: false,
            lastTransitFetch: Date.now(),
          });
        } catch (err: any) {
          if (!cacheValid) {
            set({ error: err.message || 'Failed to fetch transit data', loading: false });
          } else {
            set({ loading: false });
          }
        }
      },

      fetchVimsottariDashas: async (force = false) => {
        if (!force && get().mahaDashas.length > 0) return;

        const cached = await cacheDB.get<MahaDasha[]>('astro-maha-dashas');
        if (cached && !force) {
          set({ mahaDashas: cached });
        } else {
          set({ loading: true, error: null });
        }

        try {
          const res = await apiClient.get('/api/astrology/maha-dashas');
          await cacheDB.set('astro-maha-dashas', res.data, CACHE_TTL.MAHA_DASHAS);
          set({ mahaDashas: res.data, loading: false });
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch Vimsottari dashas', loading: false });
          }
        }
      },

      fetchYoginiDashas: async (force = false) => {
        if (!force && get().yoginiDashas.length > 0) return;

        const cached = await cacheDB.get<YoginiDasha[]>('astro-yogini-dashas');
        if (cached && !force) {
          set({ yoginiDashas: cached });
        } else {
          set({ loading: true, error: null });
        }

        try {
          const res = await apiClient.get('/api/astrology/yogini-dasha');
          await cacheDB.set('astro-yogini-dashas', res.data, CACHE_TTL.YOGINI_DASHAS);
          set({ yoginiDashas: res.data, loading: false });
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch Yogini dashas', loading: false });
          }
        }
      },

      fetchAiPersona: async () => {
        if (get().loadingAiPersona) return;

        const cached = await cacheDB.get<string>('astro-ai-persona');
        if (cached) {
          set({ aiPersona: cached });
        }

        set({ loadingAiPersona: true, error: null });
        try {
          const res = await apiClient.get('/api/ai/persona');
          const persona = res.data.persona;
          await cacheDB.set('astro-ai-persona', persona, CACHE_TTL.AI_PERSONA);
          set({ aiPersona: persona, loadingAiPersona: false });
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch AI persona', loadingAiPersona: false });
          } else {
            set({ loadingAiPersona: false });
          }
        }
      },
    }),
    {
      name: 'astro-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        cacheDB.delete('astro-transit');
        cacheDB.delete('astro-my-transit');
        cacheDB.delete('astro-lagna-gochar');
        cacheDB.delete('astro-chandra-gochar');
        cacheDB.delete('astro-all-transit');
      },
      partialize: (state) => ({
        user: state.user,
        planets: state.planets,
        d9Chart: state.d9Chart,
        specialPlanets: state.specialPlanets,
        mahaDashas: state.mahaDashas,
        yoginiDashas: state.yoginiDashas,
        aiPersona: state.aiPersona,
        coins: state.coins,
        canClaim: state.canClaim,
      }),
    },
  ),
);

function calculateSpecialPlanets(natal: ChartData) {
  const majorPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
    .map((name) => ({ name, degree: (natal[name]?.normDegree || 0) % 30 }))
    .sort((a, b) => b.degree - a.degree);

  const atmakarakaName = majorPlanets[0].name;
  const darakarakaName = majorPlanets[6].name;
  const ascSign = natal?.Ascendant?.sign_number || natal?.Ascendant?.current_sign;

  const yogakarakaMap: Record<number, { name: string; houses: string }> = {
    2: { name: 'Saturn', houses: '9th & 10th' },
    4: { name: 'Mars', houses: '5th & 10th' },
    5: { name: 'Mars', houses: '4th & 9th' },
    7: { name: 'Saturn', houses: '4th & 5th' },
    10: { name: 'Venus', houses: '5th & 10th' },
    11: { name: 'Venus', houses: '4th & 9th' },
  };

  const ykInfo = yogakarakaMap[ascSign];

  return {
    atmakaraka: { name: atmakarakaName, details: natal[atmakarakaName] },
    darakaraka: { name: darakarakaName, details: natal[darakarakaName] },
    yogakaraka: ykInfo ? { name: ykInfo.name, houses: ykInfo.houses, details: natal[ykInfo.name] } : null,
  };
}
