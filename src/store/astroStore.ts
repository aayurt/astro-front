import { create } from 'zustand';
import axios from 'axios';
import { authClient } from '../lib/auth-client';
import { ChartData, MahaDasha, YoginiDasha, User } from '../types/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface AstroState {
  user: User | null;
  planets: ChartData | null;
  specialPlanets: any | null;
  mahaDashas: MahaDasha[];
  yoginiDashas: YoginiDasha[];
  transitData: ChartData | null;
  myTransitData: ChartData | null;
  coins: number;
  canClaim: boolean;
  loading: boolean;
  error: string | null;
  fetchAstroData: () => Promise<void>;
  fetchCoinStatus: () => Promise<void>;
  claimDailyCoins: () => Promise<void>;
  fetchTransitData: () => Promise<void>;
  fetchMyTransitData: () => Promise<void>;
  fetchVimsottariDashas: () => Promise<void>;
  fetchYoginiDashas: () => Promise<void>;
  clearAstroData: () => void;
}

export const useAstroStore = create<AstroState>((set, get) => ({
  user: null,
  planets: null,
  specialPlanets: null,
  mahaDashas: [],
  yoginiDashas: [],
  transitData: null,
  myTransitData: null,
  coins: 0,
  canClaim: false,
  loading: false,
  error: null,

  clearAstroData: () => {
    set({
      user: null,
      planets: null,
      specialPlanets: null,
      mahaDashas: [],
      yoginiDashas: [],
      transitData: null,
      myTransitData: null,
      coins: 0,
      canClaim: false,
      error: null,
    });
  },

  fetchCoinStatus: async () => {
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ coins: 0, canClaim: false });
      return;
    }

    try {
      const res = await axios.get(`${BACKEND_URL}/api/user/coins`, {
        headers: { Authorization: `Bearer ${session.data.session.token}` },
        withCredentials: true,
      });
      set({ coins: res.data.coins, canClaim: res.data.canClaim });
    } catch (err: any) {
      console.error('Error fetching coins', err);
      set({ error: err.message || 'Failed to fetch coin status' });
    }
  },

  claimDailyCoins: async () => {
    if (!get().canClaim) return;

    set({ loading: true });
    const session = await authClient.getSession();
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/user/claim-coins`,
        {},
        {
          headers: { Authorization: `Bearer ${session.data?.session.token}` },
          withCredentials: true,
        },
      );
      set({ coins: res.data.coins, canClaim: false, loading: false });
    } catch (err: any) {
      console.error('Error claiming coins', err);
      set({ error: err.message || 'Failed to claim coins', loading: false });
    }
  },

  fetchAstroData: async () => {
    set({ loading: true, error: null });
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${session.data.session.token}` };

      const [planetsRes, mahaDashasRes, yoginiDashasRes, transitRes] =
        await Promise.all([
          axios.get(`${BACKEND_URL}/api/astrology/planets-extended`, {
            headers,
            withCredentials: true,
          }),
          axios.get(`${BACKEND_URL}/api/astrology/maha-dashas`, {
            headers,
            withCredentials: true,
          }),
          axios.get(`${BACKEND_URL}/api/astrology/yogini-dasha`, {
            headers,
            withCredentials: true,
          }),
          axios.get(`${BACKEND_URL}/api/astrology/transit`, {
            headers,
            withCredentials: true,
          }),
        ]);

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
      const yogakarakaMap: Record<number, { name: string; houses: string }> = {
        2: { name: 'Saturn', houses: '9th & 10th' }, // Taurus
        4: { name: 'Mars', houses: '5th & 10th' }, // Cancer
        5: { name: 'Mars', houses: '4th & 9th' }, // Leo
        7: { name: 'Saturn', houses: '4th & 5th' }, // Libra
        10: { name: 'Venus', houses: '5th & 10th' }, // Capricorn
        11: { name: 'Venus', houses: '4th & 9th' }, // Aquarius
      };

      const ykInfo = yogakarakaMap[ascSign];
      const specialPlanets = {
        atmakaraka: { name: atmakarakaName, details: natal[atmakarakaName] },
        darakaraka: { name: darakarakaName, details: natal[darakarakaName] },
        yogakaraka: ykInfo
          ? {
              name: ykInfo.name,
              houses: ykInfo.houses,
              details: natal[ykInfo.name],
            }
          : null,
      };

      set({
        user: session.data.user,
        planets: natal,
        specialPlanets,
        mahaDashas: mahaDashasRes ? mahaDashasRes.data : [],
        yoginiDashas: yoginiDashasRes ? yoginiDashasRes.data : [],
        transitData: transitRes.data,
        loading: false,
      });
      get().fetchCoinStatus(); // Update coin status after fetching astro data
    } catch (err: any) {
      console.error('Error fetching astro data', err);
      set({
        error: err.message || 'Failed to fetch astrology data',
        loading: false,
      });
    }
  },

  fetchTransitData: async () => {
    set({ loading: true, error: null });
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${session.data.session.token}` };
      const res = await axios.get(`${BACKEND_URL}/api/astrology/transit`, {
        headers,
        withCredentials: true,
      });
      set({ transitData: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching transit data', err);
      set({
        error: err.message || 'Failed to fetch transit data',
        loading: false,
      });
    }
  },

  fetchMyTransitData: async () => {
    set({ loading: true, error: null });
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${session.data.session.token}` };
      const res = await axios.get(`${BACKEND_URL}/api/astrology/my-transit`, {
        headers,
        withCredentials: true,
      });
      set({ myTransitData: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching my transit data', err);
      set({
        error: err.message || 'Failed to fetch my transit data',
        loading: false,
      });
    }
  },

  fetchVimsottariDashas: async () => {
    set({ loading: true, error: null });
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${session.data.session.token}` };
      const res = await axios.get(`${BACKEND_URL}/api/astrology/maha-dashas`, {
        headers,
        withCredentials: true,
      });
      set({ mahaDashas: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching Vimsottari dashas', err);
      set({
        error: err.message || 'Failed to fetch Vimsottari dashas',
        loading: false,
      });
    }
  },

  fetchYoginiDashas: async () => {
    set({ loading: true, error: null });
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) {
      set({ loading: false, error: 'Not authenticated' });
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${session.data.session.token}` };
      const res = await axios.get(`${BACKEND_URL}/api/astrology/yogini-dasha`, {
        headers,
        withCredentials: true,
      });
      set({ yoginiDashas: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching Yogini dashas', err);
      set({
        error: err.message || 'Failed to fetch Yogini dashas',
        loading: false,
      });
    }
  },
}));
