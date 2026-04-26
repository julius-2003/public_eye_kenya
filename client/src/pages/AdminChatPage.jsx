import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Trash2, MessageSquare, Map } from 'lucide-react';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000');
const ROOMS = ['general','water','roads','health','education','housing','finance'];

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
];

export default function AdminChatPage() {
  const { user, token } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState(
    user?.role === 'countyadmin' ? user.assignedCounty : 'Nairobi'
  );
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Counties available for selection
  const availableCounties = user?.role === 'countyadmin'
    ? [user.assignedCounty]
    : KENYA_COUNTIES;

  // Socket for real-time updates
  useEffect(() => {
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join_county', selectedCounty);
      s.emit('join_room', { county: selectedCounty, room });
    });

    s.on('new_message', (msg) => {
      if (msg.county === selectedCounty && msg.room === room) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    s.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, message: '[deleted]', attachments: [] } : m
      ));
    });

    return () => s.disconnect();
  }, [token, selectedCounty]);

  // Load messages when county or room changes
  useEffect(() => {
    if (!selectedCounty || !room) return;
    setLoading(true);
    api.get(`/chat/${selectedCounty}/${room}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load messages');
        setMessages([]);
      })
      .finally(() => setLoading(false));

    // Rejoin socket room
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { county: selectedCounty, room });
    }
  }, [selectedCounty, room]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const deleteMessage = (messageId) => {
    if (!confirm('Delete this message?')) return;
    socketRef.current?.emit('delete_message', { messageId, county: selectedCounty });
    toast.success('Message deleted');
  };

  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${SOCKET_URL}${url}`;
  };

  return (
    <AppShell>
      <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <MessageSquare size={18} className="text-blue-400" />
            <h1 className="syne font-extrabold text-lg">
              {user?.role === 'countyadmin' ? `${user.assignedCounty} Chat Moderation` : 'All Chats'}
            </h1>
            {user?.role === 'superadmin' && (
              <div className="flex items-center gap-2 ml-auto">
                <Map size={14} className="text-white/40" />
                <select
                  value={selectedCounty}
                  onChange={e => setSelectedCounty(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                  {availableCounties.map(c => (
                    <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Room sidebar */}
          <div className="w-36 flex-shrink-0 py-4 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-3 mb-3 text-xs font-bold text-white/25 uppercase tracking-widest truncate">{selectedCounty}</div>
            {ROOMS.map(r => (
              <button key={r} onClick={() => setRoom(r)}
                className="w-full text-left px-3 py-2 text-xs font-semibold capitalize transition-all"
                style={{
                  color: room === r ? 'white' : 'rgba(255,255,255,0.35)',
                  background: room === r ? 'rgba(37,99,235,0.1)' : 'transparent',
                  borderRight: room === r ? '2px solid #2563EB' : '2px solid transparent'
                }}>
                # {r}
              </button>
            ))}
          </div>

          {/* Messages area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-bold text-sm"># {room}</span>
              <span className="text-xs text-white/30">{selectedCounty} County</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
                👁 Admin View
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-12 text-white/30 text-sm">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-sm">No messages in #{room} · {selectedCounty}</div>
              ) : (
                messages.map((m, i) => (
                  <div key={m._id || i} className="flex items-start gap-3 group">
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)' }}>
                      {m.alias?.charAt(0)?.toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          {m.alias || 'Unknown'}
                        </span>
                        <span className="text-xs text-white/20 flex-shrink-0">
                          {new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {m.message && m.message !== '[deleted]' && (
                        <p className="text-sm text-white/80 break-words leading-relaxed">{m.message}</p>
                      )}
                      {m.message === '[deleted]' && (
                        <p className="text-xs text-white/25 italic">[message deleted]</p>
                      )}
                      {m.attachments && m.attachments.length > 0 && m.message !== '[deleted]' && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.attachments.map((att, idx) => (
                            <div key={idx}>
                              {att.fileType === 'image' ? (
                                <a href={getAttachmentUrl(att.url)} target="_blank" rel="noreferrer">
                                  <img src={getAttachmentUrl(att.url)} alt={att.fileName || 'image'}
                                    className="rounded-lg max-h-32 max-w-xs object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                </a>
                              ) : att.fileType === 'video' ? (
                                <video src={getAttachmentUrl(att.url)} controls className="rounded-lg max-h-32 max-w-xs" />
                              ) : (
                                <a href={getAttachmentUrl(att.url)} target="_blank" rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                                  style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
                                  📎 {att.fileName || 'attachment'}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Delete button — admin action */}
                    {m.message !== '[deleted]' && (
                      <button
                        onClick={() => deleteMessage(m._id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:scale-110"
                        style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}
                        title="Delete message">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
