import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MessageSquare, X, Send, User, Trash2, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { selectSettings, selectCurrencySymbol } from '../../store/settingsSlice';
import { aiApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [userMsgCount, setUserMsgCount] = useState(0);
  const [hasEscalated, setHasEscalated] = useState(false);

  const location = useLocation();
  const messagesEndRef = useRef(null);

  const settings = useSelector(selectSettings);
  const currencySymbol = useSelector(selectCurrencySymbol) || '₹';

  const supportEmail = settings?.siteEmail || 'support@threadntones.in';
  const supportPhone = settings?.sitePhone || '+91 99999 88888';

  // Generate or load conversation state on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('tnt_support_chat');
    const savedConvId = localStorage.getItem('tnt_support_conversation_id');
    const savedCount = localStorage.getItem('tnt_support_user_msg_count');
    const savedEscalated = localStorage.getItem('tnt_support_has_escalated');

    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Default initial welcome message
      setMessages([
        {
          role: 'model',
          text: 'Hi! 👋 Welcome to Threadntones Support. I can help you find products, track orders, understand shipping & returns, or solve website problems. How can I help you today?',
          isWelcome: true
        }
      ]);
    }

    if (savedConvId) {
      setConversationId(savedConvId);
    } else {
      const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setConversationId(newId);
      localStorage.setItem('tnt_support_conversation_id', newId);
    }

    if (savedCount) {
      setUserMsgCount(parseInt(savedCount, 10));
    }

    if (savedEscalated) {
      setHasEscalated(savedEscalated === 'true');
    }
  }, []);

  // Save chat to localStorage on message updates
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('tnt_support_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', text: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const newMsgCount = userMsgCount + 1;
    setUserMsgCount(newMsgCount);
    localStorage.setItem('tnt_support_user_msg_count', newMsgCount.toString());

    // Format chat history for backend (Gemini expects role/text structures)
    // Filter out welcome message/product cards arrays for plain text context
    const cleanHistory = messages
      .filter(m => !m.isWelcome && !m.isEscalation)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const response = await aiApi.chat({
        message: messageText,
        history: cleanHistory,
        conversationId,
        context: {
          currentPage: location.pathname
        }
      });

      setIsLoading(false);

      if (response.success) {
        const replyMessage = {
          role: 'model',
          text: response.message,
          products: response.products || []
        };
        setMessages((prev) => [...prev, replyMessage]);

        // Human Escalation Check (after 5 user messages)
        if (newMsgCount >= 5 && !hasEscalated) {
          triggerEscalation();
        }
      } else {
        triggerErrorFallback(response.message || 'Unable to get response');
      }
    } catch (err) {
      setIsLoading(false);
      console.error(err);
      
      const errorMsg = err.response?.data?.message || 'Sorry, our support assistant is temporarily busy. Please try again in a moment.';
      triggerErrorFallback(errorMsg);
    }
  };

  const triggerErrorFallback = (text) => {
    const errorBubble = {
      role: 'model',
      text: text,
      isError: true
    };
    setMessages((prev) => [...prev, errorBubble]);
  };

  const triggerEscalation = () => {
    setHasEscalated(true);
    localStorage.setItem('tnt_support_has_escalated', 'true');
    const escalationBubble = {
      role: 'model',
      text: `Need to speak to a human support agent? Please contact our official Threadntones Customer Support team:\n\n✉️ Email: ${supportEmail}\n📞 Phone: ${supportPhone}\n\nPlease include your order number and query summary so we can help you faster!`,
      isEscalation: true
    };
    setMessages((prev) => [...prev, escalationBubble]);
  };

  const clearChat = () => {
    if (!window.confirm('Are you sure you want to clear your support chat history?')) return;
    localStorage.removeItem('tnt_support_chat');
    localStorage.removeItem('tnt_support_user_msg_count');
    localStorage.removeItem('tnt_support_has_escalated');
    setUserMsgCount(0);
    setHasEscalated(false);
    setMessages([
      {
        role: 'model',
        text: 'Hi! 👋 Welcome to Threadntones Support. I can help you find products, track orders, understand shipping & returns, or solve website problems. How can I help you today?',
        isWelcome: true
      }
    ]);
    toast.success('Chat history cleared.');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden flex flex-col items-end">
      {/* Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-ink text-paper rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all relative border border-line"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-paper" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-paper border border-line shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 w-full h-[100vh] fixed inset-0 sm:static sm:w-96 sm:h-[520px] sm:rounded-2xl">
          {/* Header */}
          <div className="bg-ink p-4 text-paper flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-stone/20 border border-line flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-paper" />
              </div>
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider block">Threadntones AI Support</span>
                <span className="text-[9px] text-paper/70 font-semibold uppercase tracking-wide">Replies Instantly</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1.5 text-paper/70 hover:text-paper hover:bg-stone/10 rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-1.5 text-paper/70 hover:text-paper hover:bg-stone/10 rounded transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-stone/15">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-stone flex items-center justify-center shrink-0 border border-line">
                    <User className="w-3.5 h-3.5 text-muted" />
                  </div>
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed font-semibold whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-ink text-paper rounded-tr-none'
                        : msg.isError
                        ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-none shadow-xs'
                        : 'bg-paper text-ink border border-line rounded-tl-none shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Welcome Screen Quick Actions */}
                {msg.isWelcome && (
                  <div className="ml-9 grid grid-cols-2 gap-2 max-w-[85%] pt-1">
                    {[
                      { label: 'Find a Product', text: 'Show me product recommendations' },
                      { label: 'Track My Order', text: 'Where is my order? Can you track it?' },
                      { label: 'Shipping & Returns', text: 'What is your shipping and return policy?' },
                      { label: 'Payment Help', text: 'What payment methods do you accept?' }
                    ].map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act.text)}
                        className="px-3 py-2 border border-line bg-paper text-ink hover:bg-stone rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all"
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Cards List */}
                {msg.products && msg.products.length > 0 && (
                  <div className="ml-9 flex gap-3 overflow-x-auto pb-2 scrollbar-thin max-w-[85%] snap-x">
                    {msg.products.map((prod) => (
                      <div key={prod.id} className="w-40 border border-line rounded-xl bg-paper overflow-hidden shrink-0 snap-start flex flex-col justify-between shadow-xs">
                        <div className="relative aspect-square w-full bg-stone">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">No Image</div>
                          )}
                          {prod.originalPrice && (
                            <span className="absolute top-2 left-2 bg-red-600 text-paper text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                              SALE
                            </span>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <h4 className="text-[10px] font-black text-ink line-clamp-1 truncate">{prod.name}</h4>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[11px] font-black text-ink">{currencySymbol}{prod.price}</span>
                            {prod.originalPrice && (
                              <span className="text-[9px] text-muted line-through font-semibold">{currencySymbol}{prod.originalPrice}</span>
                            )}
                          </div>
                        </div>
                        <div className="p-2 pt-0">
                          <Link
                            to={prod.url}
                            className="w-full py-1.5 bg-stone hover:bg-ink hover:text-paper text-ink border border-line rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                          >
                            View Product <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[80%] mr-auto items-center animate-pulse">
                <div className="w-7 h-7 rounded-full bg-stone flex items-center justify-center border border-line">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                </div>
                <div className="p-3 bg-paper text-ink border border-line rounded-xl rounded-tl-none text-[10px] font-bold flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-ink/75 rounded-full animate-bounce delay-75" />
                  <span className="w-1.5 h-1.5 bg-ink/75 rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-ink/75 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                handleSend(input);
              }
            }} 
            className="p-3 border-t border-line flex gap-2 bg-paper shrink-0"
          >
            <input
              type="text"
              placeholder="Ask support assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              maxLength={400}
              className="flex-1 bg-stone border border-line rounded-lg px-3 py-2.5 text-xs text-ink font-semibold focus:outline-none disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-ink text-paper rounded-lg hover:bg-ink/90 disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
