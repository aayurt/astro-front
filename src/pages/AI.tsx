import {
  Bot,
  BookOpen,
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
import { AvatarDisplay } from '../components/AvatarPicker';
import { LoadingPlanet } from '../components/LoadingPlanet';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Button } from '../components/modern-ui/button';
import { Badge } from '../components/modern-ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '../components/modern-ui/sheet';
import { Tooltip } from '../components/modern-ui/tooltip';
import apiClient from '../lib/api-client';
import { ChatMessage, KnowledgeSource, useChatStore } from '../store/chatStore';
import { useAstroStore } from '../store/astroStore';

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
      icon: <Zap className='w-4 h-4 text-primary-500 inline mr-1' />,
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
                <span className='font-bold text-primary-900 text-xs uppercase tracking-wider'>
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

const IS_MOBILE =
  typeof navigator !== 'undefined' &&
  (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    navigator.maxTouchPoints > 0);

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
    loadingByConversation,
    hydrated,
    knowledgeSources,
    conversationMeta,
    fetchConversations,
    fetchMessages,
    fetchKnowledgeSources,
    setMessages,
    setActiveConversationId,
    setLoading,
    addMessage,
    addMessageToConversation,
  } = useChatStore();

  const { coins, fetchCoinStatus, profiles, activeProfileId, user: storeUser } = useAstroStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [waitTime, setWaitTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    'Consulting your birth chart...',
    'Analyzing planetary transits...',
    'Calculating dasha periods...',
    'Synthesizing cosmic patterns...',
    'Revealing celestial insights...',
    'Creating personalized recommendations...',
    'Mapping karma aspects...',
    'Reading ascendant signs...',
    'Interpreting moon phases...',
    'Calculating aspect angles...',
    'Tracing planetary house positions...',
    'Decoding stellar influences...',
    'Generating remedies...',
    'Preparing cosmic guidance...',
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
      }, 5000);
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
        setActiveConversationId(id);
        fetchMessages(id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    }
  }, [id, hydrated]);

  useEffect(() => {
    if (hydrated) {
      fetchCoinStatus();
      fetchConversations(); // Use cache on mount
      fetchKnowledgeSources();
    }
  }, [hydrated]);

  useEffect(() => {
    if (!loading) return;
    setWaitTime(0);
    const id = setInterval(() => setWaitTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const convMeta = id ? conversationMeta[id] : undefined;
  const chartOwner = id
    ? profiles.find((p) => p.id === convMeta?.profileId) ??
      (convMeta?.profileId ? undefined : storeUser)
    : profiles.find((p) => p.id === activeProfileId) ?? storeUser;
  const activeKnowledgeKey = id ? convMeta?.knowledgeSource ?? null : selectedSource;
  const activeKnowledgeLabel = knowledgeSources.find((s) => s.key === activeKnowledgeKey)?.label ?? null;
  const ownerAvatar = chartOwner && 'avatar' in chartOwner ? chartOwner.avatar : undefined;
  const ownerColor = chartOwner && 'color' in chartOwner ? chartOwner.color : undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setSelectedSource(null);
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
      const start = Date.now();
      const store = useAstroStore.getState();
      const isNewChat = !activeConversationId;
      // Existing conversations answer against their locked chart; new ones use
      // the currently-active profile and the selected knowledge base.
      const chatProfileId = isNewChat
        ? store.activeProfileId
        : (convMeta?.profileId ?? store.activeProfileId);
      const res = await apiClient.post(
        '/api/ai/chat6',
        {
          message: text,
          conversationId: activeConversationId,
          profileId: chatProfileId,
          knowledgeSource: isNewChat ? selectedSource : undefined,
        },
        { timeout: 180000 }, // Wait for 180 seconds
      );

      const aiMessage: ChatMessage = {
        text: res.data.response,
        type: 'received',
        name: 'Astro AI',
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        duration: Math.round((Date.now() - start) / 1000),
      };

      addMessage(aiMessage);
      if (!activeConversationId) {
        addMessageToConversation(res.data.conversationId, newMessage);
        addMessageToConversation(res.data.conversationId, aiMessage);
      }
      useAstroStore.setState({ coins: res.data.coinsLeft });
      setLoading(false);
      fetchConversations(true); // Always refresh the conversation list to update titles/timestamps

      if (!activeConversationId) {
        setActiveConversationId(res.data.conversationId);
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
        left={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuIcon
              size={20}
              className={sidebarOpen ? 'text-primary-600' : 'text-gray-400'}
            />
          </Button>
        }
        right={
          <div className='flex items-center gap-2'>
            {loading && (
              <div className='w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin' />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (id) {
                  fetchMessages(id);
                } else {
                  fetchConversations(true);
                }
                fetchCoinStatus();
              }}
            >
              <RefreshCw
                size={20}
                className='text-gray-400 active:text-primary-600 transition-colors'
              />
            </Button>
          </div>
        }
      />

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
          border-r border-gray-100 bg-white md:bg-gray-50/50 flex flex-col overflow-hidden
          transition-all duration-200
        `}
        >
          <div className='p-4 shrink-0'>
            <Button
              variant="outline"
              className='w-full flex items-center justify-center gap-2'
              onClick={() => {
                startNewChat();
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
            >
              <Plus size={16} /> New Chat
            </Button>
          </div>

          <div className='flex-1 min-w-0 flex flex-col overflow-hidden'>
            <div className='px-4 py-2 uppercase text-[10px] font-bold tracking-wider text-gray-400 shrink-0'>
              Recent Chats
            </div>
            {loadingHistory ? (
              <div className='flex justify-center py-4'>
                <div className='w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin' />
              </div>
            ) : (
              <div className='flex-1 overflow-y-auto'>
                <div className='space-y-0.5 px-2 pb-2'>
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        navigate(`/ai/${conv.id}`);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-2 p-3 cursor-pointer text-sm rounded-lg transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate flex-1">{conv.title}</span>
                      {loadingByConversation[conv.id] && (
                        <div className='w-3 h-3 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin shrink-0' />
                      )}
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className='px-4 py-8 text-center text-gray-400 text-xs italic'>
                      No history yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className='flex-1 flex flex-col min-w-0 bg-white'>
          {chartOwner && (
            <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 text-xs ring-1 ring-gray-200">
                <AvatarDisplay id={ownerAvatar} color={ownerColor} size="sm" />
                <span className="font-medium text-gray-700 truncate max-w-[120px]">
                  {chartOwner.name || 'Me'}
                </span>
                <span className="text-[10px] text-gray-400 capitalize whitespace-nowrap">
                  {id ? 'chart' : 'active chart'}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 text-xs ring-1 ring-gray-200 text-gray-600"
                title={id ? 'Reference text is locked for this conversation' : 'Reference text for this conversation'}
              >
                <BookOpen size={12} className={activeKnowledgeLabel ? 'text-primary-500' : 'text-gray-400'} />
                <span className="font-medium truncate max-w-[160px]">
                  {activeKnowledgeLabel || 'None (chart only)'}
                </span>
              </div>
            </div>
          )}
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {messages.length === 0 && !loading && !id && (
              <div className='flex flex-col items-center justify-center h-full text-center px-10'>
                <div className='w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary-100/50'>
                  <Bot size={36} className='text-primary-600' />
                </div>
                <h3 className='text-2xl font-semibold text-gray-800 tracking-wide'>
                  Vedic Astrology AI
                </h3>
                <p className='text-base mt-3 text-gray-600'>
                  Ask me about your chart, dashas, or current transits.
                </p>
                <div className="mt-6 w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-4 text-left shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Reference text
                    </span>
                    <BookOpen size={14} className="text-gray-300" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSource(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors ${
                        selectedSource === null
                          ? 'bg-primary-600 text-white ring-primary-600'
                          : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      None (chart only)
                    </button>
                    {knowledgeSources.map((s: KnowledgeSource) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setSelectedSource(s.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition-colors ${
                          selectedSource === s.key
                            ? 'bg-primary-600 text-white ring-primary-600'
                            : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">
                    The AI will answer from the selected text. Locked once you send your first message.
                  </p>
                </div>
                <p className='text-[11px] mt-5 tracking-widest uppercase text-primary-400 font-medium'>
                  Each question uses 1 coin
                </p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.type === 'sent'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                }`}>
                  <div className={`text-sm ${/<[a-z][\s\S]*>/i.test(msg.text) ? '' : 'whitespace-pre-wrap'}`}>
                    {formatMessageText(msg.text)}
                  </div>
                  <div className={`flex items-center ${msg.type === 'received' ? 'justify-between' : 'justify-end'} gap-2 mt-1`}>
                    <span className={`text-[10px] ${msg.type === 'sent' ? 'text-primary-200' : 'text-gray-400'}`}>
                      {msg.time ? formatMessageTime(msg.time) : "NaN"}
                      {msg.duration ? ` · ⏱ ${msg.duration}s` : ''}
                    </span>
                    {msg.type === 'received' && (
                      <button
                        onClick={() => speakMessage(msg.text)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        aria-label="Speak message"
                      >
                        <Volume2 size={14} className={isSpeaking ? 'text-primary-600' : 'text-gray-400'} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* Loading indicator in chat */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-gray-100 text-gray-900 rounded-bl-md">
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="relative">
                      <div className="w-10 h-10 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={14} className="text-primary-600 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center max-w-[200px] animate-pulse">
                      {loadingMessages[loadingStep]}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 tabular-nums">
                      ⏱ Waiting {waitTime}s
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 p-3 bg-white">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
              <textarea
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (IS_MOBILE) {
                      // On mobile there is no Shift key; let Enter insert a new line.
                      // Send via the send button instead.
                      return;
                    }
                    if (!e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }
                }}
                placeholder={coins > 0 ? 'Ask about your chart...' : 'Insufficient coins'}
                disabled={coins <= 0}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 max-h-48"
              />
              <Button
                onClick={sendMessage}
                disabled={!messageText.trim() || coins <= 0 || loading}
                size="icon"
                className="shrink-0 h-10 w-10 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
