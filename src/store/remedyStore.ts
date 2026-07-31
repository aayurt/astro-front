import { create } from 'zustand';
import apiClient from '../lib/api-client';

export interface Remedy {
  id: string;
  userId: string;
  type: 'mantra' | 'gemstone' | 'ritual' | 'charity' | 'lifestyle';
  title: string;
  description: string;
  source: 'ai_chat' | 'transit_prediction' | 'manual';
  sourceRef: string | null;
  completed: boolean;
  createdAt: string;
}

interface RemedyState {
  remedies: Remedy[];
  loading: boolean;
  error: string | null;

  fetchRemedies: () => Promise<void>;
  addRemedy: (data: { type: string; title: string; description: string; source?: string; sourceRef?: string }) => Promise<void>;
  scanRemedies: () => Promise<number>;
  toggleRemedy: (id: string) => Promise<void>;
  deleteRemedy: (id: string) => Promise<void>;
}

export const useRemedyStore = create<RemedyState>()((set, get) => ({
  remedies: [],
  loading: false,
  error: null,

  fetchRemedies: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.get('/api/user/remedies');
      set({ remedies: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch remedies', loading: false });
    }
  },

  addRemedy: async (data) => {
    try {
      const res = await apiClient.post('/api/user/remedies', data);
      set({ remedies: [res.data, ...get().remedies] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add remedy' });
    }
  },

  scanRemedies: async () => {
    set({ loading: true, error: null });
    try {
      const res = await apiClient.post('/api/user/remedies/scan');
      const found = res.data.remedies || [];
      set({ remedies: [...found, ...get().remedies], loading: false });
      return res.data.found || 0;
    } catch (err: any) {
      set({ error: err.message || 'Failed to scan remedies', loading: false });
      return 0;
    }
  },

  toggleRemedy: async (id) => {
    try {
      const res = await apiClient.patch(`/api/user/remedies/${id}/toggle`);
      set({
        remedies: get().remedies.map((r) => (r.id === id ? res.data : r)),
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to toggle remedy' });
    }
  },

  deleteRemedy: async (id) => {
    try {
      await apiClient.delete(`/api/user/remedies/${id}`);
      set({ remedies: get().remedies.filter((r) => r.id !== id) });
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete remedy' });
    }
  },
}));
