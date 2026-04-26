import { useEffect, useState, useRef } from 'react';
import api from '../api.js';
import toast from 'react-hot-toast';
import AppShell from '../components/shared/AppShell.jsx';
import ProfileCard from '../components/shared/ProfileCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { X, MessageSquare, Paperclip } from 'lucide-react';

const statusOptions = ['investigating','resolved','dismissed','whistleblown'];

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportMessages, setReportMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageAttachedFiles, setMessageAttachedFiles] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef(null);
  const messageFileInputRef = useRef(null);

  const load = () => api.get('/admin/reports').then(r => setReports(r.data.reports || []));
  useEffect(() => { load(); }, []);

  // Scroll to bottom when messages change
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [reportMessages]);

  const loadReportMessages = async () => {
    if (!selectedReport) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/reports/${selectedReport._id}/messages`);
      setReportMessages(res.data.messages);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleMessageFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setMessageAttachedFiles(prev => [...prev, ...files].slice(-1));
  };

  const removeMessageFile = (idx) => {
    setMessageAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const sendReportMessage = async () => {
    if (!messageInput.trim() && messageAttachedFiles.length === 0) return;
    
    setSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append('message', messageInput.trim());
      
      if (messageAttachedFiles.length > 0) {
        formData.append('file', messageAttachedFiles[0]);
      }

      const res = await api.post(`/reports/${selectedReport._id}/messages`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setReportMessages(prev => [...prev, res.data.message]);
      setMessageInput('');
      setMessageAttachedFiles([]);
      toast.success('Message added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const viewReportDetails = async (report) => {
    setSelectedReport(report);
    setReportMessages([]);
    setMessageInput('');
    setMessageAttachedFiles([]);
    await loadReportMessages();
  };

  const closeDetail = () => {
    setSelectedReport(null);
    setReportMessages([]);
    setMessageInput('');
    setMessageAttachedFiles([]);
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/reports/${id}/status`, { status });
      toast.success(`Status → ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const sevColor = s => ({critical:'#fca5a5',high:'#fdba74',medium:'#fde68a',low:'#86efac'})[s] || '#fff';
  const sevBg = s => ({critical:'rgba(220,38,38,0.15)',high:'rgba(234,88,12,0.15)',medium:'rgba(217,119,6,0.15)',low:'rgba(22,163,74,0.1)'})[s];

  const overdue = (r) => {
    if (!r.timerDeadline) return false;
    return new Date(r.timerDeadline) < new Date() && !['resolved','dismissed'].includes(r.status);
  };
  const daysLeft = (r) => {
    if (!r.timerDeadline) return null;
    const d = Math.ceil((new Date(r.timerDeadline) - new Date()) / 86400000);
    return d;
  };

  const filtered = reports.filter(r => !filter || r.title?.toLowerCase().includes(filter.toLowerCase()) || r.county?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AppShell>
      <div className="p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="syne font-extrabold text-xl">Report Management</h1>
            <p className="text-white/30 text-sm">{user.assignedCounty || 'All counties'} · {reports.length} total</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.25)',color:'#fca5a5'}}>
              ⚠️ {reports.filter(overdue).length} Overdue
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(124,58,237,0.1)',border:'1px solid rgba(124,58,237,0.2)',color:'#A78BFA'}}>
              🤖 {reports.filter(r=>r.aiFlag).length} AI Flagged
            </div>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search..."
              className="px-3 py-1.5 rounded-lg text-xs outline-none ml-2"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}} />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-3">
              {filtered.map(r => {
                const days = daysLeft(r);
                return (
                  <div key={r._id} className="rounded-xl p-5 transition-all"
                    style={{background: r.aiFlag ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.03)', border:`1px solid ${r.aiFlag?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.07)'}`}}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:sevBg(r.severity),color:sevColor(r.severity)}}>{r.severity?.toUpperCase()}</span>
                          {r.aiFlag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(124,58,237,0.15)',color:'#A78BFA'}}>🤖 AI FLAGGED</span>}
                          {overdue(r) && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(220,38,38,0.15)',color:'#fca5a5'}}>⚠️ OVERDUE</span>}
                          {days !== null && !overdue(r) && <span className="text-xs text-white/25">⏱ {days}d left</span>}
                        </div>
                        <h3 className="font-bold text-white/80 mb-1">{r.title}</h3>
                        {r.aiPattern && <p className="text-xs mb-1" style={{color:'#A78BFA'}}>{r.aiPattern}</p>}
                        <p className="text-white/30 text-xs">📍 {r.subcounty || r.county} · {r.anonymousAlias} · {r.voteScore||0} votes · {r.category}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end">
                        <span className="text-xs capitalize px-2 py-0.5 rounded-full" style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.4)'}}>{r.status}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <button onClick={() => viewReportDetails(r)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#A78BFA'}}>👁 Details</button>
                      <button onClick={() => updateStatus(r._id, 'investigating')} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(22,163,74,0.15)',border:'1px solid rgba(22,163,74,0.3)',color:'#86efac'}}>✓ Investigate</button>
                      <button onClick={() => updateStatus(r._id, 'resolved')} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>✓ Resolved</button>
                      <button onClick={() => updateStatus(r._id, 'whistleblown')} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#A78BFA'}}>📡 Whistleblow</button>
                      <button onClick={() => updateStatus(r._id, 'dismissed')} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)'}}>Dismiss</button>
                      <button onClick={() => deleteReport(r._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold ml-auto" style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.2)',color:'#fca5a5'}}>🗑 Delete</button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-center py-8 text-white/20">No reports found</p>}
            </div>
          </div>

          {/* Profile Sidebar */}
          <div className="hidden lg:block">
            <ProfileCard />
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-2xl max-h-90vh overflow-hidden flex flex-col border border-white/10">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-bold text-white text-lg">{selectedReport.title}</h2>
                <p className="text-xs text-white/40 mt-1">{selectedReport.description}</p>
              </div>
              <button onClick={closeDetail} className="text-white/40 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Info */}
            <div className="p-4 border-b border-white/10 grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-white/40">Status</div>
                <div className="text-white font-bold capitalize">{selectedReport.status}</div>
              </div>
              <div>
                <div className="text-white/40">County</div>
                <div className="text-white font-bold">{selectedReport.county}</div>
              </div>
              <div>
                <div className="text-white/40">Severity</div>
                <div className="font-bold" style={{color:selectedReport.severity==='critical'?'#fca5a5':selectedReport.severity==='high'?'#fdba74':selectedReport.severity==='medium'?'#fde68a':'#86efac'}}>{selectedReport.severity?.toUpperCase()}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-xs font-bold text-white/40 mb-3 flex items-center gap-2">
                <MessageSquare size={14} /> Comments ({reportMessages.length})
              </div>
              {loadingMessages ? (
                <div className="text-center py-4 text-white/40 text-xs">Loading...</div>
              ) : reportMessages.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">No comments yet</div>
              ) : (
                reportMessages.map((msg, i) => (
                  <div key={msg._id || i} className="flex gap-2 text-xs p-2 rounded bg-white/5">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{background:'rgba(37,99,235,0.2)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                      {msg.senderAlias?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="font-semibold text-white/70">{msg.senderAlias}</span>
                        <span className="text-white/30">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {msg.message && <p className="text-white/60 break-words">{msg.message}</p>}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-1 grid grid-cols-2 gap-1">
                          {msg.attachments.map((att, idx) => (
                            <div key={idx}>
                              {att.fileType === 'image' && <img src={att.url} alt="" className="rounded max-h-16 object-cover" />}
                              {att.fileType === 'video' && <video src={att.url} className="rounded max-h-16" />}
                              {att.fileType === 'document' && <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 text-xs underline">📄 {att.fileName}</a>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 space-y-2">
              {messageAttachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {messageAttachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                      <span>📎 {file.name}</span>
                      <button onClick={() => removeMessageFile(idx)} className="hover:scale-110">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <input 
                  ref={messageFileInputRef}
                  type="file" 
                  accept="image/*,video/*,.pdf" 
                  onChange={handleMessageFileSelect}
                  style={{display:'none'}} 
                />
                <button onClick={() => messageFileInputRef.current?.click()}
                  disabled={sendingMessage}
                  className="px-2 py-1.5 rounded text-xs transition-all hover:scale-105 disabled:opacity-40"
                  style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                  <Paperclip size={12}/>
                </button>
                <input 
                  value={messageInput} 
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && !sendingMessage && sendReportMessage()}
                  className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                  placeholder="Add a comment..." />
                <button onClick={sendReportMessage} disabled={!messageInput.trim() && messageAttachedFiles.length === 0 || sendingMessage}
                  className="px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-40"
                  style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                  {sendingMessage ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
