import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Layout, Plus, Users } from 'lucide-react';

export default function HomePage() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const saveProfile = () => {
    if (!username.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!userId.trim()) {
      setError('Please enter your User ID');
      return false;
    }
    localStorage.setItem('username', username.trim());
    localStorage.setItem('userId', userId.trim());
    return true;
  };

  const handleCreateRoom = () => {
    if (saveProfile()) {
      const id = Math.random().toString(36).substring(2, 9);
      navigate(`/room/${id}`);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (saveProfile()) {
      if (roomId.trim()) {
        navigate(`/room/${roomId.trim()}`);
      } else {
        setError('Please enter a Room ID to join');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 text-center"
      >
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Layout className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">CollabCanvas</h1>
          <p className="text-zinc-400">Real-time collaborative whiteboard and code editor.</p>
        </div>

        <div className="grid gap-8 mt-8">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Create Room Section */}
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Create New Room</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">User ID</label>
                <input
                  type="text"
                  placeholder="e.g. user_123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleCreateRoom}
              className="flex items-center justify-center gap-2 w-full p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
              <Plus className="w-5 h-5" />
              Create Room
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="bg-zinc-950 px-4 text-zinc-600">OR</span>
            </div>
          </div>

          {/* Join Room Section */}
          <form onSubmit={handleJoinRoom} className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Join Existing Room</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">User ID</label>
                <input
                  type="text"
                  placeholder="e.g. user_123"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-mono"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">Room ID</label>
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-sm font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              <Users className="w-5 h-5" />
              Join Room
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
