import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Send, Paperclip, X, Trash2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000');
const ROOMS = ['general','water','roads','health','education','housing','finance'];

export default function ChatPage() {
  const { user, token } = useAuth();
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(null);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const s = io(SOCKET_URL, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join_county', user.county);
      s.emit('join_room', { county: user.county, room });
    });

    s.on('new_message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    s.on('message_deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, message: '[deleted]', attachments: [] } : m
      ));
    });

    s.on('error', (err) => toast.error(err));

    return () => s.disconnect();
  }, [token, user.county]);

  // Load messages when room changes
  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_room', { county: user.county, room });
    
    api.get(`/chat/${user.county}/${room}`)
      .then(r => setMessages(r.data.messages || []))
      .catch(() => setMessages([]));
  }, [room, user.county, token]);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); return; }
      const validTypes = ['image/jpeg','image/png','image/gif','video/mp4','video/webm'];
      if (!validTypes.includes(file.type)) { toast.error(`${file.name} format not supported`); return; }
      setAttachedFiles(prev => [...prev, file]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));

  const sendMsg = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    try {
      setUploading(true);
      let attachments = [];
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await api.post('/chat/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            attachments.push({ url: res.data.url, fileType: file.type.startsWith('image/') ? 'image' : 'video', fileName: file.name });
          } catch { toast.error(`Failed to upload ${file.name}`); }
        }
      }
      socketRef.current?.emit('send_message', { county: user.county, room, message: input, attachments });
      setInput('');
      setAttachedFiles([]);
    } finally {
      setUploading(false);
    }
  };

  const deleteMessage = (messageId) => {
    // Find the message
    const msg = messages.find(m => m._id === messageId);
    const isAdmin = ['countyadmin','superadmin'].includes(user.role);
    const isOwner = msg && msg.alias === user.anonymousAlias;
    if (!isAdmin && !isOwner) return;
    socketRef.current?.emit('delete_message', { messageId, county: user.county });
    toast.success('Message deleted');
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsg(text);
      toast.success('Copied!');
      setTimeout(() => setCopiedMsg(null), 2000);
    });
  };

  const getAttachmentUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${SOCKET_URL}${url}`;
  };

  const isAdmin = ['countyadmin','superadmin'].includes(user.role);

  return (
    <AppShell>
      <div className="flex" style={{height:'calc(100vh - 64px)'}}>
        {/* Rooms sidebar */}
        <div className="w-36 flex-shrink-0 py-4 overflow-y-auto" style={{background:'rgba(255,255,255,0.02)',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="px-3 mb-3 text-xs font-bold text-white/25 uppercase tracking-widest truncate">{user.county}</div>
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

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <span className="font-bold text-sm"># {room}</span>
            <span className="text-xs text-white/30">{user.county} County</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-white/30 text-sm mt-8">
                No messages yet. Be the first to say something!
              </div>
            )}
            {messages.map((m, i) => (
              <div key={m._id || i} 
                className="flex items-start gap-3 group relative"
                onMouseEnter={() => setHoveredMsg(m._id)}
                onMouseLeave={() => setHoveredMsg(null)}>
                
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" 
                  style={{background:'rgba(37,99,235,0.2)',border:'1px solid rgba(37,99,235,0.3)'}}>
                  {m.alias?.charAt(0)?.toUpperCase()}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold truncate" 
                      style={{color: m.alias === user.anonymousAlias ? '#93C5FD' : 'rgba(255,255,255,0.7)'}}>
                      {m.alias || 'Unknown'}
                    </span>
                    <span className="text-xs text-white/20 flex-shrink-0">
                      {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>

                  {/* Text message */}
                  {m.message && m.message !== '[deleted]' && (
                    <p className="text-sm text-white/80 break-words leading-relaxed">{m.message}</p>
                  )}
                  {m.message === '[deleted]' && (
                    <p className="text-xs text-white/25 italic">[message deleted]</p>
                  )}

                  {/* Attachments */}
                  {m.attachments && m.attachments.length > 0 && m.message !== '[deleted]' && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.attachments.map((att, idx) => (
                        <div key={idx} className="relative">
                          {att.fileType === 'image' ? (
                            <a href={getAttachmentUrl(att.url)} target="_blank" rel="noreferrer">
                              <img 
                                src={getAttachmentUrl(att.url)} 
                                alt={att.fileName || 'image'} 
                                className="rounded-lg max-h-48 max-w-xs object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onError={(e) => { e.target.style.display='none'; }}
                              />
                            </a>
                          ) : att.fileType === 'video' ? (
                            <video 
                              src={getAttachmentUrl(att.url)} 
                              controls 
                              className="rounded-lg max-h-48 max-w-xs"
                            />
                          ) : (
                            <a href={getAttachmentUrl(att.url)} target="_blank" rel="noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                              style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                              📎 {att.fileName || 'attachment'}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons — show on hover */}
                {hoveredMsg === m._id && m.message !== '[deleted]' && (
                  <div className="flex items-center gap-1 flex-shrink-0" 
                    style={{background:'rgba(20,20,30,0.95)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'2px 6px'}}>
                    {/* Copy button */}
                    {m.message && (
                      <button onClick={() => copyMessage(m.message)}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                        title="Copy message">
                        {copiedMsg === m.message ? 
                          <Check size={13} style={{color:'#4ade80'}}/> : 
                          <Copy size={13} style={{color:'rgba(255,255,255,0.5)'}}/>
                        }
                      </button>
                    )}
                    {/* Delete button — admin only */}
                    {(isAdmin || m.alias === user.anonymousAlias) && (
                      <button onClick={() => deleteMessage(m._id)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors"
                        title="Delete message">
                        <Trash2 size={13} style={{color:'#f87171'}}/>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-3 flex-shrink-0" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            {/* File previews */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                    <span>📎 {file.name}</span>
                    <button onClick={() => removeFile(idx)} className="ml-1 hover:scale-110"><X size={12}/></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} style={{display:'none'}}/>
              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploading || user.isSuspended}
                className="px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
                style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                <Paperclip size={14}/>
              </button>
              <input value={input} onChange={e => setInput(e.target.value)} 
                onKeyDown={e => e.key==='Enter' && !e.shiftKey && !uploading && sendMsg()}
                className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                placeholder={user.isSuspended ? 'Account suspended' : `Message #${room}...`}
                disabled={user.isSuspended || uploading}/>
              <button onClick={sendMsg} 
                disabled={user.isSuspended || (!input.trim() && attachedFiles.length === 0) || uploading}
                className="px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
                style={{background:'#2563EB',color:'white'}}>
                {uploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={14}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
