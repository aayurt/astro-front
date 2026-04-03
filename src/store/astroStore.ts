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
      const res = await axios.post(`${BACKEND_URL}/api/user/claim-coins`, {}, {
        headers: { Authorization: `Bearer ${session.data?.session.token}` },
        withCredentials: true,
      });
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
      const summaryRes = await axios.get(`${BACKEND_URL}/api/astrology/summary`, {
        headers,
        withCredentials: true,
      });

      set({
        user: {
          ...session.data.user,
          birthDate: summaryRes.data.birthDetails.date,
          birthTime: summaryRes.data.birthDetails.time,
          location: summaryRes.data.birthDetails.location,
          latitude: summaryRes.data.birthDetails.latitude,
          longitude: summaryRes.data.birthDetails.longitude,
          timezone: summaryRes.data.birthDetails.timezone,
        },
        planets: summaryRes.data.natal, // Assuming 'natal' from summary is the extended planets
        specialPlanets: summaryRes.data.specialPlanets,
        mahaDashas: summaryRes.data.vimsottari.activeMahaDasha ? [summaryRes.data.vimsottari.activeMahaDasha] : [],
        yoginiDashas: summaryRes.data.yogini.activeYogini ? [summaryRes.data.yogini.activeYogini] : [],
        transitData: summaryRes.data.transit,
        loading: false,
      });
      get().fetchCoinStatus(); // Update coin status after fetching astro data
    } catch (err: any) {
      console.error('Error fetching astro data', err);
      set({ error: err.message || 'Failed to fetch astrology data', loading: false });
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
      const res = await axios.get(`${BACKEND_URL}/api/astrology/transit`, { headers, withCredentials: true });
      set({ transitData: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching transit data', err);
      set({ error: err.message || 'Failed to fetch transit data', loading: false });
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
      const res = await axios.get(`${BACKEND_URL}/api/astrology/my-transit`, { headers, withCredentials: true });
      set({ myTransitData: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching my transit data', err);
      set({ error: err.message || 'Failed to fetch my transit data', loading: false });
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
      const res = await axios.get(`${BACKEND_URL}/api/astrology/maha-dashas`, { headers, withCredentials: true });
      set({ mahaDashas: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching Vimsottari dashas', err);
      set({ error: err.message || 'Failed to fetch Vimsottari dashas', loading: false });
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
      const res = await axios.get(`${BACKEND_URL}/api/astrology/yogini-dasha`, { headers, withCredentials: true });
      set({ yoginiDashas: res.data, loading: false });
    } catch (err: any) {
      console.error('Error fetching Yogini dashas', err);
      set({ error: err.message || 'Failed to fetch Yogini dashas', loading: false });
    }
  },
}));
