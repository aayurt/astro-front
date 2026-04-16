import {
  BlockTitle,
  Button,
  Icon,
  List,
  ListItem,
  Message,
  Messagebar,
  Messages,
  Navbar,
  Page,
  Preloader,
} from 'konsta/react';
import {
  Bot,
  MenuIcon,
  MessageSquare,
  Mic,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingPlanet } from '../components/LoadingPlanet';
import apiClient from '../lib/api-client';
import { ChatMessage, useChatStore } from '../store/chatStore';

const formatMessageTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.replace(/[APM\s]/g, '').split(':').map(Number);
  const isPM = timeStr.toLowerCase().includes('pm');
  const totalMinutes = hours * 60 + minutes + (isPM && hours !== 12 ? 12 * 60 : 0);
  const now = new Date();
  const msgDate = new Date(now);
  msgDate.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);

  const diffMs = now.getTime() - msgDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timeStr;
};

const formatMessageText = (text: string) => {
  if (!text) return text;

  // Sanitize HTML — only allow safe formatting tags the AI uses for tables/lists
  const sanitizeHtml = (html: string) => {
    const tags = ['strong', 'em', 'b', 'i', 'u', 'br', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/\son\w+\s*=/gi, ' data-sanitized=')
      .replace(/<([^/>\s]+)\b[^>]*>/gi, (match, tag) => {
        if (!tags.includes(tag.toLowerCase())) {
          return '';
        }
        // Strip event handlers and javascript: from attributes
        return match.replace(/\s(?:on\w+|href)\s*=\s*(?:"[^"]*"|'[^']*'|javascript:[^\s>]*[^>]*)?/gi, ' ');
      });
  };

  // If text contains HTML tags (simple detection), use sanitized dangerouslySetInnerHTML
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  if (isHtml) {
    return (
      <div
        className='prose prose-sm max-w-none text-inherit dark:prose-invert 
  space-y-3
  [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
  [&_p]:mb-3
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
  [&_li]:mb-1
  [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-200 
  [&_th]:border [&_th]:border-gray-200 [&_th]:p-1 
  [&_td]:border [&_td]:border-gray-200 [&_td]:p-1
  [&_b]:font-semibold
  '
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }
        }
      />
    );
  }

  const labels = [
    {
      key: 'Recommended Remedies:',
      icon: <Sparkles className='w-4 h-4 text-amber-500 inline mr-1' />,
    },
    {
      key: 'Lal Kitab Remedies:',
      icon: <Zap className='w-4 h-4 text-indigo-500 inline mr-1' />,
    },
    {
      key: 'Mantras:',
      icon: <Mic className='w-4 h-4 text-purple-500 inline mr-1' />,
    },
  ];

  let parts: (string | any)[] = [text];

  labels.forEach(({ key, icon }) => {
    const nextParts: (string | any)[] = [];
    parts.forEach((part) => {
      if (typeof part === 'string') {
        const subParts = part.split(key);
        subParts.forEach((subPart, i) => {
          nextParts.push(subPart);
          if (i < subParts.length - 1) {
            nextParts.push(
              <div
                key={`${key}-${i}`}
                className='mt-4 mb-2 flex items-center bg-gray-50/50 p-2 rounded-lg border border-gray-100'
              >
                {icon}
                <span className='font-bold text-indigo-900 text-xs uppercase tracking-wider'>
                  {key}
                </span>
              </div>,
            );
          }
        });
      } else {
        nextParts.push(part);
      }
    });
    parts = nextParts;
  });

  return <>{parts}</>;
};

export default function AIPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');

  const {
    messages,
    conversations,
    activeConversationId,
    loading,
    loadingHistory,
    hydrated,
    fetchConversations,
    fetchMessages,
    setMessages,
    setActiveConversationId,
    setLoading,
    addMessage,
  } = useChatStore();

  const [coins, setCoins] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    'Consulting your birth chart...',
    'Analyzing planetary transits...',
    'Calculating dasha periods...',
    'Synthesizing cosmic patterns...',
    'Revealing celestial insights...',
    'Creating personalized recommendations...',
  ];

  const speakMessage = (text: string) => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.75;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      if (id) {
        fetchMessages(id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  }, [id, hydrated]);

  const fetchCoins = async () => {
    try {
      const res = await apiClient.get('/api/user/coins');
      setCoins(res.data.coins);
    } catch (err) {
      console.error('Error fetching coins', err);
    }
  };

  useEffect(() => {
    if (hydrated) {
      fetchCoins();
      fetchConversations(true); // Force fetch on mount of AI page
    }
  }, [hydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    navigate('/ai');
    setMessageText('');
  };

  const sendMessage = async () => {
    const text = messageText.trim();
    if (!text || coins <= 0 || loading) return;

    const newMessage: ChatMessage = {
      text,
      type: 'sent',
      name: 'Me',
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    addMessage(newMessage);
    setMessageText('');
    setLoading(true);

    // Reset textarea height
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = 'auto';
    }

    try {
      const res = await apiClient.post(
        '/api/ai/chat5',
        { message: text, conversationId: activeConversationId },
        { timeout: 100000 }, // Wait for 100 seconds
      );

      const aiMessage: ChatMessage = {
        text: res.data.response,
        type: 'received',
        name: 'Astro AI',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      addMessage(aiMessage);
      setCoins(res.data.coinsLeft);
      setLoading(false);
      fetchConversations(true); // Always refresh the conversation list to update titles/timestamps

      if (!activeConversationId) {
        navigate(`/ai/${res.data.conversationId}`, { replace: true });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      let errorMessage =
        'I am sorry, I am currently unable to access my celestial insights. Please try again later.';

      if (err.code === 'ECONNABORTED') {
        errorMessage =
          'The cosmic connection is taking longer than usual. Please try again in a moment.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      addMessage({
        text: errorMessage,
        type: 'received',
        name: 'Astro AI',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setLoading(false);
    }
  };

  return (
    <Page>
      <Navbar
        title='AI Guru'
        className=''
        left={
          <Button
            clear
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='p-2!'
          >
            <MenuIcon
              size={20}
              className={sidebarOpen ? 'text-indigo-600' : 'text-gray-400'}
            />
          </Button>
        }
        right={
          <div className='flex items-center gap-2 mr-2'>
            <Button
              clear
              onClick={() => {
                if (id) {
                  fetchMessages(id);
                } else {
                  fetchConversations(true);
                }
                fetchCoins();
              }}
              className='p-2!'
            >
              <RefreshCw
                size={20}
                className='text-gray-400 active:text-indigo-600 transition-colors'
              />
            </Button>
            <span className='inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 inset-ring inset-ring-yellow-600/20 whitespace-nowrap'>
              🪙 {coins} Coins
            </span>
          </div>
        }
      ></Navbar>

      <div className='flex h-[calc(100vh-160px)] overflow-hidden relative'>
        {/* Sidebar Overlay (Mobile only) */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 bg-black/20 z-40 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
          fixed md:relative z-50 md:z-auto h-full
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full'}
          transition-all duration-300 border-r border-gray-100 bg-white md:bg-gray-50/50 flex flex-col overflow-hidden
        `}
        >
          <div className='p-4'>
            <Button
              outline
              className='w-full flex items-center justify-center gap-2'
              onClick={() => {
                startNewChat();
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
            >
              <Plus size={16} /> New Chat
            </Button>
          </div>

          <div className='flex-1 min-w-0'>
            <BlockTitle className='m-0! px-4 py-2 uppercase text-[10px] font-bold tracking-wider text-gray-400'>
              Recent Chats
            </BlockTitle>
            {loadingHistory ? (
              <div className='flex justify-center py-4'>
                <Preloader className='w-5 h-5' />
              </div>
            ) : (
              <List strongIos insetIos className='m-2! h-full overflow-y-auto'>
                {conversations.map((conv) => (
                  <ListItem
                    key={conv.id}
                    link
                    title={
                      <div className='text-xs truncate w-full block'>
                        {conv.title}
                      </div>
                    }
                    onClick={() => {
                      navigate(`/ai/${conv.id}`);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`${activeConversationId === conv.id ? 'bg-indigo-50' : ''} overflow-hidden`}
                    media={
                      <div className='shrink-0'>
                        <MessageSquare
                          size={14}
                          className={
                            activeConversationId === conv.id
                              ? 'text-indigo-600'
                              : 'text-gray-400'
                          }
                        />
                      </div>
                    }
                  />
                ))}
                {conversations.length === 0 && (
                  <div className='px-4 py-8 text-center text-gray-400 text-xs italic'>
                    No history yet
                  </div>
                )}
              </List>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className='flex-1 flex flex-col min-w-0 bg-white'>
          <div className='flex-1 overflow-y-auto p-4'>
            <Messages>
              {messages.length === 0 && (
                <div className='flex flex-col items-center justify-center h-full text-center opacity-50 px-10'>
                  <div className='w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-100/50'>
                    <Bot size={36} className='text-indigo-600' />
                  </div>
                  <h3 className='text-2xl font-semibold text-gray-800 tracking-wide'>
                    Vedic Astrology AI
                  </h3>
                  <p className='text-base mt-3 text-gray-600'>
                    Ask me about your chart, dashas, or current transits.
                  </p>
                  <p className='text-[11px] mt-5 tracking-widest uppercase text-indigo-400 font-medium'>
                    Each question uses 1 coin
                  </p>
                </div>
              )}
              {messages.map((msg, index) => {
                return (
                  <Message
                    key={index}
                    type={msg.type}
                    name={msg.name}
                    text={formatMessageText(msg.text)}
                    footer={
                      <div
                        className={`text-xs text-gray-400 flex items-center justify-between ${msg.type !== 'received' ? 'justify-end' : 'justify-between'} mt-1`}
                      >
                        <span>{msg.time ? formatMessageTime(msg.time) : "NaN"}</span>
                        {msg.type === 'received' && (
                          <button
                            onClick={() => speakMessage(msg.text)}
                            className="p-1 hover:bg-indigo-50 rounded transition-colors ml-2"
                            aria-label="Speak message"
                          >
                            <Volume2 size={20} className={isSpeaking ? 'text-indigo-600' : 'text-gray-400'} />
                          </button>
                        )}
                      </div>
                    }
                    colors={
                      {
                        bubbleReceivedMd: 'bg-[#f4f5f7] text-[#1f1f1f] tracking-wide',
                        bubbleReceivedIos: 'bg-[#f4f5f7] text-[#1f1f1f] tracking-wide',
                        bubbleSentMd: 'bg-[#e9eef6] text-[#1f1f1f] tracking-wide',
                        bubbleSentIos: 'bg-[#e9eef6] text-[#1f1f1f] tracking-wide',
                      }
                    }
                    className={`mb-4 py-2 ${/<[a-z][\s\S]*>/i.test(msg.text) ? '' : 'whitespace-pre-wrap'}`}
                  />
                );
              })}
              {loading && (
                <Message
                  type='received'
                  name='Astro AI'
                  text={loadingMessages[loadingStep]}
                  footer={new Date().toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  className='italic text-indigo-600/70'
                />
              )}
              {loading && <LoadingPlanet />}

              <div ref={messagesEndRef} />
            </Messages>
          </div>
          <Messagebar
            placeholder={coins > 0 ? 'Ask about your chart...' : 'Insufficient coins'}
            value={messageText}
            onInput={(e: any) => {
              setMessageText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e: any) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={coins <= 0}
            className='border-t border-gray-100 relative rounded-md shadow-md md:shadow-lg [&_textarea]:resize-none [&_textarea]:max-h-48'
            right={
              <Button
                clear
                className='text-indigo-600 font-bold'
                onClick={sendMessage}
                disabled={!messageText.trim() || coins <= 0 || loading}
              >
                <Icon
                  ios={<Send className={`w-7 h-7`} />}
                  material={
                    <Send className='w-6 h-6 fill-black dark:fill-md-dark-on-surface' />
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
