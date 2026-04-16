import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authClient } from '../lib/auth-client';
import apiClient from '../lib/api-client';
import { ChartData, MahaDasha, YoginiDasha, User } from '../types/api';

interface AstroState {
  user: User | null;
  planets: ChartData | null;
  d9Chart: ChartData | null;
  specialPlanets: any | null;
  mahaDashas: MahaDasha[];
  yoginiDashas: YoginiDasha[];
  transitData: ChartData | null;
  myTransitData: ChartData | null;
  aiPersona: string | null;
  coins: number;
  canClaim: boolean;
  loading: boolean;
  loadingAiPersona: boolean;
  hydrated: boolean;
  error: string | null;
  lastTransitFetch: number | null;
  fetchAstroData: (force?: boolean, token?: string) => Promise<void>;
  fetchCoinStatus: () => Promise<void>;
  claimDailyCoins: () => Promise<void>;
  fetchTransitData: (force?: boolean) => Promise<void>;
  fetchMyTransitData: (force?: boolean) => Promise<void>;
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
      aiPersona: null,
      coins: 0,
      canClaim: false,
      loading: false,
      loadingAiPersona: false, // Initialize the new loading state
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

      // Update user and refresh all astrology data (for after profile changes)
      updateUserAndRefresh: async (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
        // Force refresh all astro data with new user details
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
          aiPersona: null,
          coins: 0,
          canClaim: false,
          loading: false,
          loadingAiPersona: false,
          hydrated: false,
          error: null,
          lastTransitFetch: null,
        });
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
        } catch (err: any) {
          console.error('Error fetching coins', err);
          set({ error: err.message || 'Failed to fetch coin status' });
        }
      },

      claimDailyCoins: async () => {
        if (!get().canClaim) return;

        set({ loading: true });
        try {
          const res = await apiClient.post('/api/user/claim-coins', {});
          set({ coins: res.data.coins, canClaim: false, loading: false });
        } catch (err: any) {
          console.error('Error claiming coins', err);
          set({
            error: err.message || 'Failed to claim coins',
            loading: false,
          });
        }
      },

      fetchAstroData: async (force = false, token?: string) => {
        // Prevent concurrent fetches
        if (get().loading) return;

        // If not hydrated yet, wait for hydration (but only if not forcing)
        if (!force && !get().hydrated) {
          console.log('Waiting for hydration...');
          return;
        }

        // If not forcing and we already have valid data, don't refetch (Offline-first)
        // But we still need to check if transit data needs refreshing (it's time-sensitive)
        if (
          !force &&
          get().planets &&
          Object.keys(get().planets!).length > 0 &&
          get().d9Chart
        ) {
          console.log('Using persisted astro data');
          // Check if transit data is stale (older than 1 hour) and refresh if needed
          const lastTransitFetch = get().lastTransitFetch;
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;

          if (!lastTransitFetch || now - lastTransitFetch > oneHour) {
            console.log('Refreshing transit data (stale)');
            get().fetchTransitData(true);
          }
          // Refresh coin status in background without setting full loading state
          get().fetchCoinStatus();
          return;
        }

        set({ loading: true, error: null });

        // Use provided token or fetch a new session
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
            set({ loading: false, error: errors.join('; ') || 'Failed to fetch planets data' });
            return;
          }

          const natal = planetsRes.data;

          // Calculate Special Planets (Karakas)
          const majorPlanets = [
            'Sun',
            'Moon',
            'Mars',
            'Mercury',
            'Jupiter',
            'Venus',
            'Saturn',
          ]
            .map((name) => ({
              name,
              degree: (natal[name]?.normDegree || 0) % 30,
            }))
            .sort((a, b) => b.degree - a.degree);

          const atmakarakaName = majorPlanets[0].name;
          const darakarakaName = majorPlanets[6].name;

          const ascSign =
            natal?.Ascendant?.sign_number || natal?.Ascendant?.current_sign;
          const yogakarakaMap: Record<
            number,
            { name: string; houses: string }
          > = {
            2: { name: 'Saturn', houses: '9th & 10th' }, // Taurus
            4: { name: 'Mars', houses: '5th & 10th' }, // Cancer
            5: { name: 'Mars', houses: '4th & 9th' }, // Leo
            7: { name: 'Saturn', houses: '4th & 5th' }, // Libra
            10: { name: 'Venus', houses: '5th & 10th' }, // Capricorn
            11: { name: 'Venus', houses: '4th & 9th' }, // Aquarius
          };

          const ykInfo = yogakarakaMap[ascSign];
          const specialPlanets = {
            atmakaraka: {
              name: atmakarakaName,
              details: natal[atmakarakaName],
            },
            darakaraka: {
              name: darakarakaName,
              details: natal[darakarakaName],
            },
            yogakaraka: ykInfo
              ? {
                name: ykInfo.name,
                houses: ykInfo.houses,
                details: natal[ykInfo.name],
              }
              : null,
          };

          set({
            user: userData || get().user,
            planets: natal,
            d9Chart: d9Res?.data ?? get().d9Chart,
            specialPlanets,
            mahaDashas: mahaDashasRes?.data ?? get().mahaDashas,
            yoginiDashas: yoginiDashasRes?.data ?? get().yoginiDashas,
            transitData: transitRes?.data ?? get().transitData,
            loading: false,
          });
          if (errors.length > 0) {
            console.warn('Partial fetch — some requests failed:', errors);
          }
          get().fetchCoinStatus(); // Update coin status after fetching astro data
        } catch (err: any) {
          console.error('Error fetching astro data', err);
          set({
            error: err.message || 'Failed to fetch astrology data',
            loading: false,
          });
        }
      },

      fetchTransitData: async (force = false) => {
        if (get().loading) return;
        if (!force && get().transitData && get().lastTransitFetch) {
          // Check if data is fresh (within 1 hour)
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (now - get().lastTransitFetch! < oneHour) {
            console.log('Transit data is still fresh, using cached');
            return;
          }
        }

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/api/astrology/transit');
          set({ transitData: res.data, loading: false, lastTransitFetch: Date.now() });
        } catch (err: any) {
          console.error('Error fetching transit data', err);
          set({
            error: err.message || 'Failed to fetch transit data',
            loading: false,
          });
        }
      },

      fetchMyTransitData: async (force = false) => {
        if (get().loading) return;
        // myTransitData should always be fresh when fetched from server
        if (!force && get().myTransitData && get().lastTransitFetch) {
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (now - get().lastTransitFetch! < oneHour) {
            return;
          }
        }

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/api/astrology/my-transit');
          set({ myTransitData: res.data, loading: false, lastTransitFetch: Date.now() });
        } catch (err: any) {
          console.error('Error fetching my transit data', err);
          set({
            error: err.message || 'Failed to fetch my transit data',
            loading: false,
          });
        }
      },

      fetchVimsottariDashas: async (force = false) => {
        if (get().loading) return;
        if (!force && get().mahaDashas.length > 0) return;

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/api/astrology/maha-dashas');
          set({ mahaDashas: res.data, loading: false });
        } catch (err: any) {
          console.error('Error fetching Vimsottari dashas', err);
          set({
            error: err.message || 'Failed to fetch Vimsottari dashas',
            loading: false,
          });
        }
      },

      fetchYoginiDashas: async (force = false) => {
        if (get().loading) return;
        if (!force && get().yoginiDashas.length > 0) return;

        set({ loading: true, error: null });
        try {
          const res = await apiClient.get('/api/astrology/yogini-dasha');
          set({ yoginiDashas: res.data, loading: false });
        } catch (err: any) {
          console.error('Error fetching Yogini dashas', err);
          set({
            error: err.message || 'Failed to fetch Yogini dashas',
            loading: false,
          });
        }
      },

      fetchAiPersona: async () => {
        if (get().loadingAiPersona) return; // Use specific loading state
        set({ loadingAiPersona: true, error: null }); // Use specific loading state
        try {
          const res = await apiClient.get('/api/ai/persona');
          const persona = res.data.persona;
          set({
            aiPersona: persona,
            loadingAiPersona: false,
          });
        } catch (err: any) {
          console.error('Error fetching AI persona', err);
          set({
            error: err.message || 'Failed to fetch AI persona',
            loadingAiPersona: false, // Use specific loading state
          });
        }
      },
    }),
    {
      name: 'astro-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        planets: state.planets,
        d9Chart: state.d9Chart,
        specialPlanets: state.specialPlanets,
        mahaDashas: state.mahaDashas,
        yoginiDashas: state.yoginiDashas,
        transitData: state.transitData,
        myTransitData: state.myTransitData,
        aiPersona: state.aiPersona,
        coins: state.coins,
        canClaim: state.canClaim,
        lastTransitFetch: state.lastTransitFetch,
      }),
    },
  ),
);
