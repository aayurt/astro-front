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
  lastFetchedConversationsAt: number | null;
  lastFetchedMessagesAt: Record<string, number>;

  setHydrated: (val: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
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
      lastFetchedConversationsAt: null,
      lastFetchedMessagesAt: {},

      setHydrated: (val: boolean) => set({ hydrated: val }),

      setMessages: (messages) => set({ messages }),

      setActiveConversationId: (id) => set({ activeConversationId: id }),

      setLoading: (loading: boolean) => set({ loading }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearChatData: () =>
        set({
          messages: [],
          conversations: [],
          activeConversationId: null,
          error: null,
          lastFetchedConversationsAt: null,
          lastFetchedMessagesAt: {},
        }),

      fetchConversations: async (force = false) => {
        if (get().loadingHistory) return;

        // Wait for hydration before checking cache
        if (!force && !get().hydrated) return;

        const now = Date.now();
        const ONE_MINUTE = 60 * 1000;

        // If not forced, skip if fetched in the last minute AND we have conversations
        if (
          !force &&
          get().conversations.length > 0 &&
          get().lastFetchedConversationsAt &&
          now - (get().lastFetchedConversationsAt || 0) < ONE_MINUTE
        ) {
          console.log('Using cached conversations (fresh)');
          return;
        }

        set({ loadingHistory: true });
        const session = await authClient.getSession();
        console.log(
          'Session retrieved for conversations:',
          !!session?.data?.session?.token,
        );
        if (!session?.data?.session?.token) {
          console.log('No token found, skipping fetch');
          set({ loadingHistory: false });
          return;
        }

        try {
          console.log(
            'Fetching conversations from:',
            `${BACKEND_URL}/api/ai/conversations`,
          );
          const res = await axios.get(`${BACKEND_URL}/api/ai/conversations`, {
            headers: { Authorization: `Bearer ${session.data.session.token}` },
            withCredentials: true,
          });
          console.log('Conversations fetched:', res.data.length);
          set({
            conversations: res.data,
            loadingHistory: false,
            lastFetchedConversationsAt: now,
          });
        } catch (err: any) {
          console.error('Error fetching conversations:', err);
          set({
            error: err.message || 'Failed to fetch conversations',
            loadingHistory: false,
          });
        }
      },

      fetchMessages: async (id, force = false) => {
        if (get().loading) return;

        // Wait for hydration before checking cache
        if (!force && !get().hydrated) return;

        const conversation = get().conversations.find((c) => c.id === id);
        const lastFetched = get().lastFetchedMessagesAt[id] || 0;

        // If not forced, only skip if we have messages AND the conversation hasn't been updated since last fetch
        if (
          !force &&
          get().activeConversationId === id &&
          get().messages.length > 0
        ) {
          if (
            conversation &&
            new Date(conversation.updatedAt).getTime() <= lastFetched
          ) {
            console.log(
              'Using cached messages for conversation (up to date):',
              id,
            );
            return;
          }
        }

        set({ loading: true, activeConversationId: id });
        const session = await authClient.getSession();
        if (!session?.data?.session?.token) {
          set({ loading: false });
          return;
        }

        try {
          const res = await axios.get(
            `${BACKEND_URL}/api/ai/conversations/${id}`,
            {
              headers: {
                Authorization: `Bearer ${session.data.session.token}`,
              },
              withCredentials: true,
            },
          );

          const chatMessages: ChatMessage[] = res.data.messages.map(
            (m: any) => ({
              text: m.content,
              type: m.role === 'user' ? 'sent' : 'received',
              name: m.role === 'user' ? 'Me' : 'Astro AI',
              time: new Date(m.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }),
          );

          set((state) => ({
            messages: chatMessages,
            loading: false,
            lastFetchedMessagesAt: {
              ...state.lastFetchedMessagesAt,
              [id]: Date.now(),
            },
          }));
        } catch (err: any) {
          console.error('Error fetching messages', err);
          set({
            error: err.message || 'Failed to fetch messages',
            loading: false,
          });
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
        lastFetchedConversationsAt: state.lastFetchedConversationsAt,
        lastFetchedMessagesAt: state.lastFetchedMessagesAt,
      }),
    },
  ),
);
