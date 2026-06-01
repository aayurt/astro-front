import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../lib/api-client';
import { cacheDB } from '../lib/cache';

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

const CACHE_TTL_CONVERSATIONS = 60 * 1000;

interface ChatState {
  messages: ChatMessage[];
  messagesByConversation: Record<string, ChatMessage[]>;
  conversations: Conversation[];
  activeConversationId: string | null;
  loading: boolean;
  loadingHistory: boolean;
  loadingByConversation: Record<string, boolean>;
  hydrated: boolean;
  error: string | null;
  lastFetchedConversationsAt: number | null;
  lastFetchedMessagesAt: Record<string, number>;

  setHydrated: (val: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setConversationLoading: (id: string, loading: boolean) => void;
  fetchConversations: (force?: boolean) => Promise<void>;
  fetchMessages: (id: string, force?: boolean) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  addMessageToConversation: (conversationId: string, message: ChatMessage) => void;
  clearChatData: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      messagesByConversation: {},
      conversations: [],
      activeConversationId: null,
      loading: false,
      loadingHistory: false,
      loadingByConversation: {},
      hydrated: false,
      error: null,
      lastFetchedConversationsAt: null,
      lastFetchedMessagesAt: {},

      setHydrated: (val: boolean) => set({ hydrated: val }),

      setMessages: (messages) => set({ messages }),

      setActiveConversationId: (id) => set({ activeConversationId: id, messages: id ? (get().messagesByConversation[id] || []) : [] }),

      setLoading: (loading: boolean) => set({ loading }),

      setConversationLoading: (id: string, loading: boolean) =>
        set((state) => ({ loadingByConversation: { ...state.loadingByConversation, [id]: loading } })),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      addMessageToConversation: (conversationId: string, message: ChatMessage) =>
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [...(state.messagesByConversation[conversationId] || []), message],
          },
        })),

      clearChatData: () => {
        set({
          messages: [],
          messagesByConversation: {},
          conversations: [],
          activeConversationId: null,
          error: null,
          lastFetchedConversationsAt: null,
          lastFetchedMessagesAt: {},
        });
        cacheDB.delete('chat-conversations');
      },

      fetchConversations: async (force = false) => {
        if (get().loadingHistory) return;
        if (!force && !get().hydrated) return;

        const now = Date.now();
        if (!force && get().conversations.length > 0 && get().lastFetchedConversationsAt && now - (get().lastFetchedConversationsAt || 0) < CACHE_TTL_CONVERSATIONS) {
          console.log('Using cached conversations (fresh)');
          return;
        }

        const cached = await cacheDB.get<Conversation[]>('chat-conversations');
        if (cached && !force && get().lastFetchedConversationsAt) {
          set({ conversations: cached });
        }

        set({ loadingHistory: true });
        try {
          console.log('Fetching conversations...');
          const res = await apiClient.get('/api/ai/conversations');
          set({
            conversations: res.data,
            loadingHistory: false,
            lastFetchedConversationsAt: now,
          });
          cacheDB.set('chat-conversations', res.data, CACHE_TTL_CONVERSATIONS);
        } catch (err: any) {
          console.error('Error fetching conversations:', err);
          if (!cached) {
            set({ error: err.message || 'Failed to fetch conversations', loadingHistory: false });
          } else {
            set({ loadingHistory: false });
          }
        }
      },

      fetchMessages: async (id, force = false) => {
        if (get().loading && get().activeConversationId === id) return;
        if (!force && !get().hydrated) return;

        const isNewConversation = get().activeConversationId !== id;
        const lastFetched = get().lastFetchedMessagesAt[id] || 0;
        const conversation = get().conversations.find((c) => c.id === id);

        if (!force && !isNewConversation && get().lastFetchedMessagesAt[id] && get().messages.length > 0) {
          if (conversation && new Date(conversation.updatedAt).getTime() <= lastFetched) {
            console.log('Using cached messages for conversation (up to date):', id);
            return;
          }
        }

        const cached = await cacheDB.get<ChatMessage[]>(`chat-messages-${id}`);
        if (cached && !force && !isNewConversation) {
          set({
            messages: cached,
            messagesByConversation: { ...get().messagesByConversation, [id]: cached },
          });
        }

        set({ loading: true, activeConversationId: id });
        get().setConversationLoading(id, true);
        try {
          const res = await apiClient.get(`/api/ai/conversations/${id}`);

          const chatMessages: ChatMessage[] = res.data.messages.map((m: any) => ({
            text: m.content,
            type: m.role === 'user' ? 'sent' : 'received',
            name: m.role === 'user' ? 'Me' : 'Astro AI',
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));

          set((state) => ({
            messages: chatMessages,
            messagesByConversation: { ...state.messagesByConversation, [id]: chatMessages },
            loading: false,
            loadingByConversation: { ...state.loadingByConversation, [id]: false },
            lastFetchedMessagesAt: { ...state.lastFetchedMessagesAt, [id]: Date.now() },
          }));

          cacheDB.set(`chat-messages-${id}`, chatMessages, CACHE_TTL_CONVERSATIONS);
        } catch (err: any) {
          console.error('Error fetching messages', err);
          if (!cached) {
            set((state) => ({
              error: err.message || 'Failed to fetch messages',
              loading: false,
              loadingByConversation: { ...state.loadingByConversation, [id]: false },
            }));
          } else {
            set((state) => ({
              loading: false,
              loadingByConversation: { ...state.loadingByConversation, [id]: false },
            }));
          }
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
