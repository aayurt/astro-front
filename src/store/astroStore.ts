import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authClient } from '../lib/auth-client';
import apiClient from '../lib/api-client';
import { cacheDB } from '../lib/cache';
import { ChartData, MahaDasha, YoginiDasha, User, PanchangData, Profile } from '../types/api';

// Cached session token so fetchAstroData doesn't call getSession() on every
// invocation — each call updates better-auth's session atom, which re-renders
// ProtectedRoute → updateUser → new user ref → Dashboard effect → fetchAstroData → loop.
let cachedSessionToken: string | null = null;

function shallowEqual<T extends Record<string, any>>(a: T, b: T): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

function withProfile(url: string, getActiveProfileId: () => string | null): string {
  const pId = getActiveProfileId();
  return pId ? `${url}${url.includes('?') ? '&' : '?'}profileId=${pId}` : url;
}

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
  PANCHANG: 60 * 60 * 1000,
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
  panchang: PanchangData | null;
  coins: number;
  canClaim: boolean;
  loading: boolean;
  backgroundRefreshing: boolean;
  loadingAiPersona: boolean;
  hydrated: boolean;
  error: string | null;
  lastTransitFetch: number | null;
  lastCoinFetch: number | null;
  profiles: Profile[];
  activeProfileId: string | null;
  fetchAstroData: (force?: boolean, token?: string, profileId?: string) => Promise<void>;
  fetchProfiles: () => Promise<void>;
  setActiveProfile: (id: string) => void;
  addProfile: (data: Partial<Profile> & { name: string }) => Promise<void>;
  updateProfile: (id: string, data: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  fetchCoinStatus: () => Promise<void>;
  claimDailyCoins: () => Promise<void>;
  redeemCoupon: (code: string) => Promise<number>;
  fetchTransitData: (force?: boolean) => Promise<void>;
  fetchMyTransitData: (force?: boolean) => Promise<void>;
  fetchLagnaGochar: (force?: boolean) => Promise<void>;
  fetchChandraGochar: (force?: boolean) => Promise<void>;
  fetchAllTransitData: (force?: boolean) => Promise<void>;
  fetchVimsottariDashas: (force?: boolean) => Promise<void>;
  fetchYoginiDashas: (force?: boolean) => Promise<void>;
  fetchAiPersona: () => Promise<void>;
  fetchPanchang: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateUserAndRefresh: (userData: Partial<User>) => Promise<void>;
  recalculateChart: () => Promise<void>;
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
      panchang: null,
      coins: 0,
      canClaim: false,
      loading: false,
      backgroundRefreshing: false,
      loadingAiPersona: false,
      hydrated: false,
      error: null,
      lastTransitFetch: null,
      lastCoinFetch: null,
      profiles: [],
      activeProfileId: null,

      setHydrated: (val: boolean) => set({ hydrated: val }),

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const merged = { ...currentUser, ...userData };
          if (shallowEqual(currentUser, merged)) return;
          set({ user: merged });
        }
      },

      fetchProfiles: async () => {
        try {
          const res = await apiClient.get('/api/user/profiles');
          const profiles = res.data;
          set({ profiles });
          if (!get().activeProfileId && profiles.length > 0) {
            set({ activeProfileId: profiles[0].id });
          }
        } catch (err: any) {
          console.error('Failed to fetch profiles', err);
        }
      },

      setActiveProfile: (id: string) => {
        set({ activeProfileId: id });
        const p = get().profiles.find(p => p.id === id);
        document.documentElement.dataset.primary = p?.color || 'indigo';
        set({
          planets: null,
          d9Chart: null,
          specialPlanets: null,
          mahaDashas: [],
          yoginiDashas: [],
          transitData: null,
          myTransitData: null,
          lagnaGochar: null,
          chandraGochar: null,
          panchang: null,
          error: null,
        });
        cacheDB.clear();
        get().fetchAstroData(true);
      },

      addProfile: async (data) => {
        try {
          const res = await apiClient.post('/api/user/profiles', data);
          set({ profiles: [...get().profiles, res.data] });
        } catch (err: any) {
          console.error('Failed to add profile', err);
        }
      },

      updateProfile: async (id, data) => {
        try {
          const res = await apiClient.put(`/api/user/profiles/${id}`, data);
          set({
            profiles: get().profiles.map((p) => (p.id === id ? res.data : p)),
          });
        } catch (err: any) {
          console.error('Failed to update profile', err);
        }
      },

      deleteProfile: async (id) => {
        try {
          await apiClient.delete(`/api/user/profiles/${id}`);
          set({ profiles: get().profiles.filter((p) => p.id !== id) });
        } catch (err: any) {
          console.error('Failed to delete profile', err);
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
        await cacheDB.delete('astro-all-transit');
        await get().fetchAstroData(true);
      },

      recalculateChart: async () => {
        set({
          planets: null,
          d9Chart: null,
          specialPlanets: null,
          mahaDashas: [],
          yoginiDashas: [],
          transitData: null,
          myTransitData: null,
          lagnaGochar: null,
          chandraGochar: null,
          panchang: null,
          error: null,
        });
        await Promise.all([
          cacheDB.delete('astro-planets'),
          cacheDB.delete('astro-d9'),
          cacheDB.delete('astro-maha-dashas'),
          cacheDB.delete('astro-yogini-dashas'),
          cacheDB.delete('astro-all-transit'),
        ]);
        await get().fetchAstroData(true);
      },

      clearAstroData: () => {
        cachedSessionToken = null;
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
          panchang: null,
          coins: 0,
          canClaim: false,
          loading: false,
          backgroundRefreshing: false,
          loadingAiPersona: false,
          error: null,
          lastTransitFetch: null,
          lastCoinFetch: null,
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
        const now = Date.now();
        const lastFetch = get().lastCoinFetch;
        if (lastFetch && now - lastFetch < CACHE_TTL.COINS) return;

        const cached = await cacheDB.get<{ coins: number; canClaim: boolean }>('astro-coins');
        if (cached) {
          set({ coins: cached.coins, canClaim: cached.canClaim });
        }

        try {
          const res = await apiClient.get('/api/user/coins');
          set({ coins: res.data.coins, canClaim: res.data.canClaim, lastCoinFetch: now });
          cacheDB.set('astro-coins', { coins: res.data.coins, canClaim: res.data.canClaim }, CACHE_TTL.COINS);
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch coin status' });
          }
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

      redeemCoupon: async (code: string) => {
        const res = await apiClient.post('/api/user/redeem-coupon', { code });
        const coins = res.data.coins;
        await cacheDB.set('astro-coins', { coins, canClaim: get().canClaim }, CACHE_TTL.COINS);
        set({ coins, lastCoinFetch: Date.now() });
        return coins;
      },

      fetchAstroData: async (force = false, token?: string) => {
        if (!force && !get().hydrated) {
          return;
        }

        if (!force && get().planets && Object.keys(get().planets!).length > 0 && get().d9Chart) {
          const lastTransitFetch = get().lastTransitFetch;
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (!lastTransitFetch || now - lastTransitFetch > oneHour) {
            apiClient.get(withProfile('/api/astrology/all-transit', () => get().activeProfileId)).then(r => {
              cacheDB.set('astro-all-transit', r.data, CACHE_TTL.TRANSIT);
              set({
                transitData: r.data.transit,
                myTransitData: r.data.myTransit,
                lagnaGochar: r.data.lagnaGochar,
                chandraGochar: r.data.chandraGochar,
                lastTransitFetch: Date.now(),
              });
            }).catch(() => {});
          }
          return;
        }

        let sessionToken = token || cachedSessionToken;

        if (!sessionToken) {
          const session = await authClient.getSession();
          sessionToken = session?.data?.session?.token ?? null;
          if (sessionToken) cachedSessionToken = sessionToken;
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
            planets: cachedPlanets,
            d9Chart: cachedD9,
            specialPlanets,
            mahaDashas: cachedMaha!,
            yoginiDashas: cachedYogini!,
            backgroundRefreshing: false,
          });
          return;
        }

        set({ loading: true, backgroundRefreshing: false, error: null });

        try {
          // Phase 1: Planets only — critical for first paint
          const planetsRes = await apiClient.get(withProfile('/api/astrology/planets-extended', () => get().activeProfileId));
          const natal = planetsRes.data;
          const special = calculateSpecialPlanets(natal);
          set({ planets: natal, specialPlanets: special, loading: false });
          await cacheDB.set('astro-planets', natal, CACHE_TTL.PLANETS);

          // Phase 2: Secondary data — d9, maha, yogini (stream as they arrive)
          Promise.allSettled([
            apiClient.get(withProfile('/api/astrology/d9-chart', () => get().activeProfileId)).then(async r => {
              await cacheDB.set('astro-d9', r.data, CACHE_TTL.D9);
              set({ d9Chart: r.data });
            }),
            apiClient.get(withProfile('/api/astrology/maha-dashas', () => get().activeProfileId)).then(async r => {
              const data = r.data || [];
              await cacheDB.set('astro-maha-dashas', data, CACHE_TTL.MAHA_DASHAS);
              set({ mahaDashas: data });
            }),
            apiClient.get(withProfile('/api/astrology/yogini-dasha', () => get().activeProfileId)).then(async r => {
              const data = r.data || [];
              await cacheDB.set('astro-yogini-dashas', data, CACHE_TTL.YOGINI_DASHAS);
              set({ yoginiDashas: data });
            }),
          ]).then(() => set({ backgroundRefreshing: false }));

          // Phase 3: Fire-and-forget (transit cache)
          apiClient.get(withProfile('/api/astrology/all-transit', () => get().activeProfileId)).then(r => {
            cacheDB.set('astro-all-transit', r.data, CACHE_TTL.TRANSIT);
            set({
              transitData: r.data.transit,
              myTransitData: r.data.myTransit,
              lagnaGochar: r.data.lagnaGochar,
              chandraGochar: r.data.chandraGochar,
              lastTransitFetch: Date.now(),
            });
          }).catch(() => {});
        } catch (err: any) {
          console.error('Error fetching astro data', err);
          set({ error: err.message || 'Failed to fetch astrology data', loading: false, backgroundRefreshing: false });
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
          const res = await apiClient.get(withProfile('/api/astrology/all-transit', () => get().activeProfileId));
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
          const res = await apiClient.get(withProfile('/api/astrology/maha-dashas', () => get().activeProfileId));
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
          const res = await apiClient.get(withProfile('/api/astrology/yogini-dasha', () => get().activeProfileId));
          await cacheDB.set('astro-yogini-dashas', res.data, CACHE_TTL.YOGINI_DASHAS);
          set({ yoginiDashas: res.data, loading: false });
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch Yogini dashas', loading: false });
          }
        }
      },

      fetchPanchang: async () => {
        const cached = await cacheDB.get<PanchangData>('astro-panchang');
        if (cached) {
          set({ panchang: cached });
        }

        try {
          const res = await apiClient.get(withProfile('/api/astrology/panchang', () => get().activeProfileId));
          set({ panchang: res.data });
          cacheDB.set('astro-panchang', res.data, CACHE_TTL.PANCHANG);
        } catch (err: any) {
          if (!cached) {
            set({ error: err.message || 'Failed to fetch panchang' });
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
      // Bumped after the chart computation schema fix: drop stale chart data so it
      // recomputes, but keep user/profiles/coins.
      version: 2,
      migrate: (persisted: any) => {
        const stale = ['planets', 'd9Chart', 'mahaDashas', 'yoginiDashas', 'aiPersona', 'panchang', 'specialPlanets'];
        if (!persisted || typeof persisted !== 'object') return {};
        const next = { ...persisted };
        for (const key of stale) delete next[key];
        return next;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.activeProfileId && state?.profiles.length) {
          const p = state.profiles.find(p => p.id === state.activeProfileId);
          document.documentElement.dataset.primary = p?.color || 'indigo';
        }
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
        panchang: state.panchang,
        coins: state.coins,
        canClaim: state.canClaim,
        lastCoinFetch: state.lastCoinFetch,
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
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
