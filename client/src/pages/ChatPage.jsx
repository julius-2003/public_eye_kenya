import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Send, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const ROOMS = ['general','water','roads','health','education','housing','finance'];

export default function ChatPage() {
  const { user, token } = useAuth();
  const [room, setRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} format not supported`);
        return;
      }
      setAttachedFiles(prev => [...prev, file]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMsg = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    
    try {
      setUploading(true);
      let attachments = [];

      // Upload files if any
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/chat/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            attachments.push({
              url: res.data.url,
              fileType: file.type.startsWith('image/') ? 'image' : 'video',
              fileName: file.name
            });
          } catch {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      socketRef.current?.emit('send_message', { 
        county: user.county, 
        room, 
        message: input,
        attachments 
      });
      setInput('');
      setAttachedFiles([]);
    } finally {
      setUploading(false);
    }
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold truncate" style={{color: m.alias === user.anonymousAlias ? '#93C5FD' : 'rgba(255,255,255,0.6)'}}>{m.alias || 'Unknown'}</span>
                    <span className="text-xs text-white/20 flex-shrink-0">{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {m.message && m.message.trim() && (
                    <p className="text-sm text-white/70 break-words">{m.message}</p>
                  )}
                  
                  {/* Attachments Display */}
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {m.attachments.map((att, idx) => (
                        <div key={idx}>
                          {att.fileType === 'image' ? (
                            <img src={att.url} alt={att.fileName} className="rounded-lg max-w-sm max-h-40 object-cover cursor-pointer hover:opacity-80" />
                          ) : att.fileType === 'video' ? (
                            <video src={att.url} controls className="rounded-lg max-w-sm max-h-40" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            {/* Attached Files Preview */}
            {attachedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                    <span>📎 {file.name}</span>
                    <button onClick={() => removeFile(idx)} className="ml-1 hover:scale-110">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Input Area */}
            <div className="flex gap-2">
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleFileSelect}
                style={{display:'none'}} 
              />
              
              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploading || user.isSuspended}
                className="px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
                style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                <Paperclip size={14}/>
              </button>
              
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !uploading && sendMsg()}
                className="flex-1 px-4 py-2 rounded-xl text-sm outline-none"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                placeholder={user.isSuspended ? 'Account suspended' : `Message #${room}...`}
                disabled={user.isSuspended || uploading} />
              
              <button onClick={sendMsg} disabled={user.isSuspended || (!input.trim() && attachedFiles.length === 0) || uploading}
                className="px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-40"
                style={{background:'#2563EB',color:'white'}}>
                <Send size={14}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
