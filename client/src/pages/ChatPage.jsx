import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Send } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const ROOMS = ['general','water','roads','health','education','housing','finance'];

export default function ChatPage() {
  const { user, token } = useAuth();
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token } });
    socketRef.current = s;
    s.emit('join_county', user.county);
    s.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    s.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, message: '[deleted]' } : m));
    });
    return () => s.disconnect();
  }, [token, user.county]);

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_room', { county: user.county, room });
    axios.get(`${API}/chat/${user.county}/${room}`)
      .then(r => setMessages(r.data.messages))
      .catch(() => {});
  }, [room, user.county]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = () => {
    if (!input.trim()) return;
    socketRef.current?.emit('send_message', { county: user.county, room, message: input });
    setInput('');
  };

  return (
    <AppShell>
      <div className="flex h-full" style={{height:'calc(100vh - 0px)'}}>
        {/* Room list */}
        <div className="w-36 flex-shrink-0 py-4" style={{background:'rgba(255,255,255,0.02)',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="px-3 mb-3 text-xs font-bold text-white/25 uppercase tracking-widest">{user.county}</div>
          {ROOMS.map(r => (
            <button key={r} onClick={() => setRoom(r)}
              className="w-full text-left px-3 py-2 text-xs font-semibold capitalize transition-all"
              style={{
                color: room===r ? 'white' : 'rgba(255,255,255,0.35)',
                background: room===r ? 'rgba(37,99,235,0.1)' : 'transparent',
                borderRight: room===r ? '2px solid #2563EB' : '2px solid transparent'
              }}>
              # {r}
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 flex items-center gap-2" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <span className="syne font-bold text-sm"># {room}</span>
            <span className="text-xs text-white/30">{user.county} County</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {messages.map((m,i) => (
              <div key={m._id || i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs" style={{background:'rgba(37,99,235,0.2)',border:'1px solid rgba(37,99,235,0.3)'}}>
                  {m.alias?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{color: m.alias === user.anonymousAlias ? '#93C5FD' : 'rgba(255,255,255,0.6)'}}>{m.alias}</span>
                    <span className="text-xs text-white/20">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/70">{m.message}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 flex gap-2" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendMsg()}
              className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
              placeholder={user.isSuspended ? 'Account suspended' : `Message #${room}...`}
              disabled={user.isSuspended} />
            <button onClick={sendMsg} disabled={user.isSuspended || !input.trim()}
              className="px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
              style={{background:'#2563EB',color:'white'}}>
              <Send size={14}/>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
