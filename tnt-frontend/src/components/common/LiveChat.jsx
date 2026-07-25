import { useState } from 'react';
import { MessageSquare, X, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'support', text: 'Hi! Welcome to TNT Luxury Support. How can we help you today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');

    // Simulated automated assistant answer
    setTimeout(() => {
      let reply = "Thank you for reaching out! A customer support representative will review your message and reply shortly via email.";
      if (userMessage.toLowerCase().includes('order') || userMessage.toLowerCase().includes('track')) {
        reply = "To track your order, please visit the 'Track Order' option in your Account Dashboard or click 'Track' in the top header.";
      } else if (userMessage.toLowerCase().includes('return') || userMessage.toLowerCase().includes('exchange')) {
        reply = "You can initiate a return or exchange request directly from your Account Order List within 14 days of delivery.";
      }
      setMessages((prev) => [...prev, { sender: 'support', text: reply }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-ink text-paper rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-paper border border-line rounded-xl w-80 sm:w-96 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-ink p-4 text-paper flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <div>
                <span className="font-extrabold text-xs uppercase tracking-wider block">TNT Support Assistant</span>
                <span className="text-[9px] text-paper/70 font-semibold uppercase">Replies in under a minute</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-paper/80 hover:text-paper">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="p-4 h-64 overflow-y-auto space-y-3.5 bg-stone/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 max-w-[80%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-stone flex items-center justify-center shrink-0 border border-line">
                  <User className="w-3.5 h-3.5 text-muted" />
                </div>
                <div
                  className={`p-3 rounded-lg text-xs leading-normal font-semibold ${
                    msg.sender === 'user'
                      ? 'bg-ink text-paper rounded-tr-none'
                      : 'bg-paper text-ink border border-line rounded-tl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-line flex gap-2 bg-paper">
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-stone border border-line rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
            />
            <button type="submit" className="p-2 bg-ink text-paper rounded-lg hover:bg-ink/90">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
