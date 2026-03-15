import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

const RoomChat = ({ messages, onSend, currentUser }) => {
  const [text, setText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/50">
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3 opacity-50">
            <MessageSquare size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Silêncio produtivo...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.uid === currentUser?.uid;
            const timestamp = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();

            return (
              <div 
                key={msg.id || idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-slate-500 mb-1 ml-1">
                    {msg.userName}
                  </span>
                )}
                <div 
                  className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-white/5'
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.text}</p>
                  <span className={`text-[8px] font-medium block mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {format(timestamp, 'HH:mm')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSubmit}
        className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-white/5"
      >
        <div className="relative group">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Diga algo para o grupo..."
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

RoomChat.displayName = 'RoomChat';

export default memo(RoomChat);
