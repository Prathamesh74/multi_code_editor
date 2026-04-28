import React, { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { Send } from 'lucide-react';

interface Message {
  username: string;
  message: string;
  timestamp: string;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
  username: string;
}

export default function ChatPanel({ socket, roomId, username }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:receive', handleMessage);

    return () => {
      socket.off('chat:receive', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('chat:send', { roomId, username, message: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Chat</h2>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className={`text-xs font-bold ${msg.username === username ? 'text-emerald-500' : 'text-zinc-300'}`}>
                {msg.username}
              </span>
              <span className="text-[10px] text-zinc-600">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-1 break-words leading-relaxed">
              {msg.message}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 pr-10 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
