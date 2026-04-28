import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Whiteboard from '../components/Whiteboard';
import CodeEditor from '../components/CodeEditor';
import ChatPanel from '../components/ChatPanel';
import Terminal from '../components/Terminal';
import { Share2, Users, Layout, MessageSquare, Terminal as TerminalIcon } from 'lucide-react';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<{ socketId: string, username: string, userId: string }[]>([]);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'code'>('code');
  
  // Capture profile once on mount to prevent identity confusion between tabs
  const [profile] = useState(() => ({
    username: localStorage.getItem('username') || 'Anonymous',
    userId: localStorage.getItem('userId') || 'ID_UNKNOWN'
  }));
  const { username, userId } = profile;

  // Centralized Room State
  const [code, setCode] = useState('// Start coding here...');
  const [language, setLanguage] = useState('javascript');
  const [drawHistory, setDrawHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [roomId, navigate]);

  if (!roomId) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Invalid Room ID. Redirecting to home...</div>
      </div>
    );
  }

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    const onConnect = () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('room:join', { roomId, username, userId });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    if (newSocket.connected) onConnect();

    newSocket.on('user:joined', ({ users }: { users: any[] }) => {
      setUsers(users);
    });

    newSocket.on('room:state', (state: { code: string, language: string, drawHistory: any[] }) => {
      setCode(state.code);
      setLanguage(state.language);
      setDrawHistory(state.drawHistory);
    });

    newSocket.on('code:update', (newCode: string) => {
      setCode(newCode);
    });

    newSocket.on('language:update', (newLang: string) => {
      setLanguage(newLang);
    });

    newSocket.on('user:left', ({ users }: { users: any[] }) => {
      setUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, username]);

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">Collab<span className="text-emerald-500">IDE</span></h1>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="font-mono bg-zinc-800 px-2 py-1 rounded border border-zinc-700">{roomId}</span>
            <button 
              onClick={copyRoomId}
              className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Copy Room ID"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-medium text-zinc-100">{username}</span>
            <span className="text-[10px] text-zinc-500 font-mono">ID: {userId}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/10">
            {username.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col gap-2">
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/40">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                Collaborators ({users.length})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {users.map((u) => (
                <div key={u.socketId} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold border transition-all ${
                    u.socketId === socket?.id 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400'
                  }`}>
                    {(u.username || '??').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-medium truncate ${u.socketId === socket?.id ? 'text-emerald-500' : 'text-zinc-200'}`}>
                      {u.username || 'Anonymous'}
                      {u.socketId === socket?.id && <span className="ml-1 text-[10px] text-zinc-500 opacity-60">(You)</span>}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono truncate">ID: {u.userId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex-1 flex gap-2 overflow-hidden">
            {/* Whiteboard + Editor Tab System */}
            <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              {/* Tabs */}
              <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1">
                <button
                  onClick={() => setActiveTab('whiteboard')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'whiteboard'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  Whiteboard
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'code'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  Code Editor
                </button>
              </div>

              {/* Content Area - Keeping both components mounted */}
              <div className="flex-1 relative">
                <div className={`absolute inset-0 ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
                  <Whiteboard socket={socket} roomId={roomId!} initialHistory={drawHistory} />
                </div>
                <div className={`absolute inset-0 ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                  <CodeEditor 
                    socket={socket} 
                    roomId={roomId!} 
                    initialCode={code}
                    initialLanguage={language}
                    onRun={(output) => setTerminalOutput(prev => prev + (prev ? '\n' : '') + output)}
                  />
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="w-80 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <ChatPanel socket={socket} roomId={roomId!} username={username} />
            </div>
          </div>

          {/* Terminal */}
          <div className="h-48 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <Terminal 
              output={terminalOutput} 
              language={language}
              onClear={() => setTerminalOutput('')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
