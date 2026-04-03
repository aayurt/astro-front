import React, { useState, useEffect, useRef } from 'react';
import { Page, Navbar, Block, BlockTitle, List, ListItem, Button, Message, Messagebar, Messages, MessagesTitle, Preloader, Icon } from 'konsta/react';
import axios from 'axios';
import { authClient } from '../lib/auth-client';
import { MessageSquare, Plus, History, ChevronLeft, ChevronRight, Bot, Send } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ChatMessage {
  text: string;
  type: 'sent' | 'received';
  name: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function AIPage() {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCoins = async () => {
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/user/coins`, {
        headers: { Authorization: `Bearer ${session.data.session.token}` },
        withCredentials: true,
      });
      setCoins(res.data.coins);
    } catch (err) {
      console.error('Error fetching coins', err);
    }
  };

  const fetchConversations = async () => {
    setLoadingHistory(true);
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/ai/conversations`, {
        headers: { Authorization: `Bearer ${session.data.session.token}` },
        withCredentials: true,
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMessages = async (id: string) => {
    setLoading(true);
    const session = await authClient.getSession();
    if (!session?.data?.session?.token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/ai/conversations/${id}`, {
        headers: { Authorization: `Bearer ${session.data.session.token}` },
        withCredentials: true,
      });
      const chatMessages: ChatMessage[] = res.data.messages.map((m: any) => ({
        text: m.content,
        type: m.role === 'user' ? 'sent' : 'received',
        name: m.role === 'user' ? 'Me' : 'Astro AI',
      }));
      setMessages(chatMessages);
      setActiveConversationId(id);
    } catch (err) {
      console.error('Error fetching messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setMessageText('');
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || coins <= 0 || loading) return;

    const newMessage: ChatMessage = {
      text,
      type: 'sent',
      name: 'Me',
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessageText('');
    setLoading(true);

    const session = await authClient.getSession();
    try {
      const res = await axios.post(`${BACKEND_URL}/api/ai/chat`,
        { message: text, conversationId: activeConversationId },
        {
          headers: { Authorization: `Bearer ${session.data?.session.token}` },
          withCredentials: true,
        }
      );

      const aiMessage: ChatMessage = {
        text: res.data.response,
        type: 'received',
        name: 'Astro AI',
      };

      setMessages([...updatedMessages, aiMessage]);
      setCoins(res.data.coinsLeft);

      if (!activeConversationId) {
        setActiveConversationId(res.data.conversationId);
        fetchConversations();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to get response';
      setMessages([...updatedMessages, { text: errorMessage, type: 'received', name: 'System' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page>
      <Navbar
        title='AI Guru'
        className=''
        right={
          <>
          </>
        }
      >
        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20">🪙 {coins} Coins</span>
      </Navbar>

      <div className="flex h-[calc(100vh-160px)] overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-100 bg-gray-50/50 flex flex-col overflow-hidden`}>
          <div className="p-4">
            <Button
              outline
              className="w-full flex items-center justify-center gap-2"
              onClick={startNewChat}
            >
              <Plus size={16} /> New Chat
            </Button>
          </div>

          <div className="flex-1 ">
            <BlockTitle className="m-0! px-4 py-2 uppercase text-[10px] font-bold tracking-wider text-gray-400">Recent Chats</BlockTitle>
            {loadingHistory ? (
              <div className="flex justify-center py-4"><Preloader size="w-5 h-5" /></div>
            ) : (
              <List strongIos insetIos className="m-2! h-full overflow-y-auto">
                {conversations.map((conv) => (
                  <ListItem
                    key={conv.id}
                    link
                    title={<span className="text-xs truncate block">{conv.title}</span>}
                    onClick={() => fetchMessages(conv.id)}
                    className={`${activeConversationId === conv.id ? 'bg-indigo-50' : ''}`}
                    media={<MessageSquare size={14} className={activeConversationId === conv.id ? 'text-indigo-600' : 'text-gray-400'} />}
                  />
                ))}
                {conversations.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400 text-xs italic">No history yet</div>
                )}
              </List>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <div className="flex-1 overflow-y-auto p-4">
            <Messages>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-10">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                    <Bot size={32} className="text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-800">Vedic Astrology AI</h3>
                  <p className="text-sm mt-2">Ask me about your chart, dashas, or current transits.</p>
                  <p className="text-[10px] mt-4 italic font-medium">(Each question uses 1 coin)</p>
                </div>
              )}
              {messages.map((msg, index) => (
                <Message
                  key={index}
                  type={msg.type}
                  name={msg.name}
                  text={msg.text}
                  className="mb-4"
                />
              ))}
              {loading && activeConversationId && <Message type="received" name="Astro AI" text="Thinking..." />}
              <div ref={messagesEndRef} />
            </Messages>
          </div>
          <div className='border-t border-gray-500'></div>
          <Messagebar
            placeholder={coins > 0 ? "Ask a question..." : "Insufficient coins"}
            value={messageText}
            onInput={(e) => setMessageText(e.target.value)}
            disabled={coins <= 0}
            className="border-t border-gray-100 relative rounded-md shadow-md md:shadow-lg"
            right={
              <Button
                clear
                className="text-indigo-600 font-bold"
                onClick={sendMessage}
                disabled={!messageText.trim() || coins <= 0 || loading}
              >
                <Icon
                  ios={
                    <Send
                      className={`w-7 h-7`}
                    />
                  }
                  material={
                    <Send className="w-6 h-6 fill-black dark:fill-md-dark-on-surface" />
                  }
                />
              </Button>
            }
          />
        </div>
      </div>
    </Page>
  );
}
