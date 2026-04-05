import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { authClient } from '../lib/auth-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ChatMessage {
  text: string;
  type: 'sent' | 'received';
  name: string;
  time?: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  loadingHistory: boolean;
  hydrated: boolean;
  error: string | null;
  
  setHydrated: (val: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setActiveConversationId: (id: string | null) => void;
  fetchConversations: (force?: boolean) => Promise<void>;
  fetchMessages: (id: string, force?: boolean) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearChatData: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      conversations: [],
      activeConversationId: null,
      loading: false,
      loadingHistory: false,
      hydrated: false,
      error: null,

      setHydrated: (val: boolean) => set({ hydrated: val }),
      
      setMessages: (messages) => set({ messages }),
      
      setActiveConversationId: (id) => set({ activeConversationId: id }),

      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),

      clearChatData: () => set({
        messages: [],
        conversations: [],
        activeConversationId: null,
        error: null,
      }),

      fetchConversations: async (force = false) => {
        if (get().loadingHistory) return;
        
        // Wait for hydration before checking cache
        if (!force && !get().hydrated) return;

        if (!force && get().conversations.length > 0) {
          console.log('Using cached conversations');
          return;
        }

        set({ loadingHistory: true });
        const session = await authClient.getSession();
        if (!session?.data?.session?.token) {
          set({ loadingHistory: false });
          return;
        }

        try {
          const res = await axios.get(`${BACKEND_URL}/api/ai/conversations`, {
            headers: { Authorization: `Bearer ${session.data.session.token}` },
            withCredentials: true,
          });
          set({ conversations: res.data, loadingHistory: false });
        } catch (err: any) {
          console.error('Error fetching conversations', err);
          set({ error: err.message || 'Failed to fetch conversations', loadingHistory: false });
        }
      },

      fetchMessages: async (id, force = false) => {
        if (get().loading) return;
        
        // Wait for hydration before checking cache
        if (!force && !get().hydrated) return;

        // If we are already viewing this conversation and have messages, skip fetch unless forced
        if (!force && get().activeConversationId === id && get().messages.length > 0) {
          console.log('Using cached messages for conversation:', id);
          return;
        }

        set({ loading: true, activeConversationId: id });
        const session = await authClient.getSession();
        if (!session?.data?.session?.token) {
          set({ loading: false });
          return;
        }

        try {
          const res = await axios.get(`${BACKEND_URL}/api/ai/conversations/${id}`, {
            headers: { Authorization: `Bearer ${session.data.session.token}` },
            withCredentials: true,
          });
          
          const chatMessages: ChatMessage[] = res.data.messages.map((m: any) => ({
            text: m.content,
            type: m.role === 'user' ? 'sent' : 'received',
            name: m.role === 'user' ? 'Me' : 'Astro AI',
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          
          set({ messages: chatMessages, loading: false });
        } catch (err: any) {
          console.error('Error fetching messages', err);
          set({ error: err.message || 'Failed to fetch messages', loading: false });
        }
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        messages: state.messages,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
