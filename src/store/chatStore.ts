import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../lib/api-client';

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
        set((state) => ({
          loadingByConversation: {
            ...state.loadingByConversation,
            [id]: loading,
          },
        })),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      addMessageToConversation: (conversationId: string, message: ChatMessage) =>
        set((state) => ({
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: [
              ...(state.messagesByConversation[conversationId] || []),
              message,
            ],
          },
        })),

      clearChatData: () =>
        set({
          messages: [],
          messagesByConversation: {},
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
        try {
          console.log('Fetching conversations...');
          const res = await apiClient.get('/api/ai/conversations');
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
        // Prevent loading if already loading this conversation
        if (get().loading && get().activeConversationId === id) return;

        // Wait for hydration before checking cache
        if (!force && !get().hydrated) return;

        // If switching to a different conversation, clear messages first (handled in component)
        // but also bypass cache for new conversations
        const isNewConversation = get().activeConversationId !== id;
        const lastFetched = get().lastFetchedMessagesAt[id] || 0;
        const conversation = get().conversations.find((c) => c.id === id);

        // If not forced and not a new conversation, check cache validity
        if (
          !force &&
          !isNewConversation &&
          get().lastFetchedMessagesAt[id] &&
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
        get().setConversationLoading(id, true);
        try {
          const res = await apiClient.get(`/api/ai/conversations/${id}`);

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
            messagesByConversation: {
              ...state.messagesByConversation,
              [id]: chatMessages,
            },
            loading: false,
            loadingByConversation: {
              ...state.loadingByConversation,
              [id]: false,
            },
            lastFetchedMessagesAt: {
              ...state.lastFetchedMessagesAt,
              [id]: Date.now(),
            },
          }));
        } catch (err: any) {
          console.error('Error fetching messages', err);
          set((state) => ({
            error: err.message || 'Failed to fetch messages',
            loading: false,
            loadingByConversation: {
              ...state.loadingByConversation,
              [id]: false,
            },
          }));
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
