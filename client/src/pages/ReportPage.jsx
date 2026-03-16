import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Upload, ThumbsUp, AlertTriangle, ThumbsDown, X, Send, Paperclip, ChevronLeft, MessageSquare } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Ghost Workers','Contractor Kickbacks','Missing Funds','Bribery','Nepotism','Procurement Fraud','Other'];
const SEVERITIES = ['low','medium','high','critical'];

export default function ReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('list'); // list | new | detail
  const [selectedReport, setSelectedReport] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', category:'', severity:'medium', subcounty:'', department:'' });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Report detail state
  const [reportMessages, setReportMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messageAttachedFiles, setMessageAttachedFiles] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef(null);
  const messageFileInputRef = useRef(null);

  const fetchReports = () => axios.get(`${API}/reports`).then(r => setReports(r.data.reports));
  useEffect(() => { fetchReports(); }, []);

  // Scroll to bottom when messages change
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [reportMessages]);

  // Fetch report messages when detail view opened
  useEffect(() => {
    if (tab === 'detail' && selectedReport) {
      loadReportMessages();
    }
  }, [tab, selectedReport?._id]);

  const loadReportMessages = async () => {
    if (!selectedReport) return;
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API}/reports/${selectedReport._id}/messages`);
      setReportMessages(res.data.messages);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} format not supported`);
        return;
      }
      setEvidenceFiles(prev => [...prev, file]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeEvidenceFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMessageFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} format not supported`);
        return;
      }
      setMessageAttachedFiles(prev => [...prev, file]);
    });
    if (messageFileInputRef.current) messageFileInputRef.current.value = '';
  };

  const removeMessageFile = (index) => {
    setMessageAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    setLoading(true);
    try {
      let evidenceUrls = [];

      // Upload evidence files if any
      if (evidenceFiles.length > 0) {
        setUploading(true);
        for (const file of evidenceFiles) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await axios.post(`${API}/evidence/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            evidenceUrls.push(res.data);
          } catch {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        setUploading(false);
      }

      await axios.post(`${API}/reports`, { 
        ...form, 
        county: user.county,
        evidenceFiles: evidenceUrls
      });
      toast.success('Report submitted anonymously!');
      setTab('list');
      fetchReports();
      setForm({ title:'', description:'', category:'', severity:'medium', subcounty:'', department:'' });
      setEvidenceFiles([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
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

      const res = await axios.post(`${API}/reports/${selectedReport._id}/messages`, formData, {
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

  const vote = async (id, voteType) => {
    try {
      await axios.post(`${API}/reports/${id}/vote`, { voteType });
      fetchReports();
    } catch (err) { toast.error(err.response?.data?.message || 'Vote failed'); }
  };

  const viewReportDetail = (report) => {
    setSelectedReport(report);
    setTab('detail');
  };

  const sevColor = s => ({critical:'#fca5a5',high:'#fdba74',medium:'#fde68a',low:'#86efac'})[s];
  const sevBg = s => ({critical:'rgba(220,38,38,0.15)',high:'rgba(234,88,12,0.15)',medium:'rgba(217,119,6,0.15)',low:'rgba(22,163,74,0.15)'})[s];
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const inputStyle = {background:'rgba(255, 255, 255, 0.09)',border:'1px solid rgba(255, 255, 255, 0.33)',color:'white'};

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {tab === 'detail' && (
              <button onClick={() => { setTab('list'); setSelectedReport(null); }}
                className="p-2 rounded-lg transition-all hover:scale-110"
                style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}>
                <ChevronLeft size={18} />
              </button>
            )}
            <h1 className="syne font-extrabold text-xl">
              {tab==='new'?'New Report':tab==='detail'?'Report Details':'Reports'}
            </h1>
          </div>
          {tab === 'list' && (
            <button onClick={() => setTab(tab==='list'?'new':'list')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
              style={{background: tab==='new'?'rgba(255,255,255,0.06)':'#BB0000',color:'white',border: tab==='new'?'1px solid rgba(255,255,255,0.1)':'none'}}>
              {tab==='new'?'← Back to List':'+ New Report'}
            </button>
          )}
        </div>

        {tab === 'new' && (
          <div className="rounded-2xl p-6 space-y-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="flex items-center gap-2 p-3 rounded-xl text-xs" style={{background:'rgba(187,0,0,0.08)',border:'1px solid rgba(187,0,0,0.2)'}}>
              🎭 This report will be submitted as <strong className="mx-1">{user?.anonymousAlias}</strong> — your identity is protected
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Report Title</label>
              <input className={inputClass} style={inputStyle} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Ghost Workers in Water Dept." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Category</label>
                <select className={inputClass} style={{...inputStyle,background:'rgba(255,255,255,0.06)'}} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Severity</label>
                <select className={inputClass} style={{...inputStyle,background:'rgba(255,255,255,0.06)'}} value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})}>
                  {SEVERITIES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Description</label>
              <textarea className={inputClass} style={{...inputStyle,minHeight:'120px',resize:'vertical'}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the corruption in detail..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Subcounty / Location</label>
                <input className={inputClass} style={inputStyle} value={form.subcounty} onChange={e=>setForm({...form,subcounty:e.target.value})} placeholder="e.g. Westlands" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Department</label>
                <input className={inputClass} style={inputStyle} value={form.department} onChange={e=>setForm({...form,department:e.target.value})} placeholder="e.g. Water, Roads..." />
              </div>
            </div>

            {/* Evidence Files */}
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">📸 Evidence (Optional)</label>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                onChange={handleFileSelect}
                style={{display:'none'}} 
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-40 flex items-center justify-center gap-2"
                style={{background:'rgba(37,99,235,0.15)',border:'1px dashed rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                <Upload size={14}/> Add Photos or Documents
              </button>

              {/* Evidence Files Preview */}
              {evidenceFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {evidenceFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{background:'rgba(37,99,235,0.08)',border:'1px solid rgba(37,99,235,0.2)'}}>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">📄</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white/80 truncate">{file.name}</div>
                          <div className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <button onClick={() => removeEvidenceFile(idx)} className="ml-2 hover:scale-110 transition-transform">
                        <X size={16} style={{color:'#93C5FD'}} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={submit} disabled={loading || !form.title || !form.category || !form.description || uploading}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
              style={{background:'#BB0000',color:'white'}}>
              {loading ? 'Submitting...' : uploading ? 'Uploading evidence...' : '🎭 Submit Anonymously'}
            </button>
          </div>
        )}

        {tab === 'detail' && selectedReport && (
          <div className="space-y-4">
            {/* Report Header */}
            <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:sevBg(selectedReport.severity),color:sevColor(selectedReport.severity)}}>
                      {selectedReport.severity?.toUpperCase()}
                    </span>
                    {selectedReport.aiFlag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(124,58,237,0.15)',color:'#A78BFA',border:'1px solid rgba(124,58,237,0.25)'}}>🤖 AI FLAGGED</span>}
                    <span className="text-xs text-white/20 capitalize px-2 py-0.5 rounded-full" style={{background:'rgba(255,255,255,0.04)'}}>{selectedReport.status}</span>
                  </div>
                  <h2 className="font-bold text-lg text-white mb-1">{selectedReport.title}</h2>
                  <p className="text-xs text-white/50">📍 {selectedReport.subcounty || selectedReport.county} · {selectedReport.anonymousAlias} · {selectedReport.category}</p>
                  <p className="text-sm text-white/60 mt-2">{selectedReport.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:scale-105"
                    style={{background:'rgba(22,163,74,0.1)',border:'1px solid rgba(22,163,74,0.2)',color:'#86efac'}}>
                    <ThumbsUp size={11}/> {selectedReport.votes?.confirm?.length||0}
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{background:'rgba(234,88,12,0.1)',border:'1px solid rgba(234,88,12,0.2)',color:'#fdba74'}}>
                    <AlertTriangle size={11}/> {selectedReport.votes?.urgent?.length||0}
                  </button>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                    style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.3)'}}>
                    <ThumbsDown size={11}/> {selectedReport.votes?.fake?.length||0}
                  </button>
                </div>
              </div>
              
              {/* Evidence Display */}
              {selectedReport.evidenceFiles && selectedReport.evidenceFiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs font-semibold text-white/50 mb-2">EVIDENCE ({selectedReport.evidenceFiles.length})</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {selectedReport.evidenceFiles.map((file, idx) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg text-center transition-all hover:scale-105"
                        style={{background:'rgba(37,99,235,0.1)',border:'1px solid rgba(37,99,235,0.2)'}}>
                        <div className="text-xl mb-1">📄</div>
                        <p className="text-xs text-white/60 truncate">{file.filename || 'File'}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Report Messages */}
            <div className="rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',height:'400px'}}>
              <div className="p-3 border-b border-white/10 flex items-center gap-2 text-sm font-semibold" style={{color:'white'}}>
                <MessageSquare size={16} /> Comments ({reportMessages.length})
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loadingMessages ? (
                  <div className="text-center py-4 text-white/40">Loading messages...</div>
                ) : reportMessages.length === 0 ? (
                  <div className="text-center py-8 text-white/40">No comments yet. Be the first!</div>
                ) : (
                  reportMessages.map((msg, i) => (
                    <div key={msg._id || i} className="flex gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{background:'rgba(37,99,235,0.2)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD',fontSize:'10px'}}>
                        {msg.senderAlias?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-semibold text-white/70">{msg.senderAlias}</span>
                          <span className="text-white/30 text-xs">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                        </div>
                        {msg.message && <p className="text-white/60 break-words">{msg.message}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-1 grid grid-cols-2 gap-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx}>
                                {att.fileType === 'image' && <img src={att.url} alt="" className="rounded max-h-20 object-cover" />}
                                {att.fileType === 'video' && <video src={att.url} className="rounded max-h-20" />}
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
              <div className="p-3 border-t border-white/10 space-y-2">
                {/* Attached Files Preview */}
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
                    className="px-2 py-1 rounded text-xs transition-all hover:scale-105 disabled:opacity-40"
                    style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                    <Paperclip size={12}/>
                  </button>
                  <input 
                    value={messageInput} 
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && !sendingMessage && sendReportMessage()}
                    className="flex-1 px-2 py-1 rounded text-xs outline-none"
                    style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                    placeholder="Add a comment..." />
                  <button onClick={sendReportMessage} disabled={!messageInput.trim() && messageAttachedFiles.length === 0 || sendingMessage}
                    className="px-2 py-1 rounded transition-all hover:scale-105 disabled:opacity-40"
                    style={{background:'#2563EB',color:'white'}}>
                    <Send size={12}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'list' && (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r._id} onClick={() => viewReportDetail(r)}
                className="rounded-xl p-4 transition-all hover:border-white/15 cursor-pointer"
                style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:sevBg(r.severity),color:sevColor(r.severity)}}>
                        {r.severity?.toUpperCase()}
                      </span>
                      {r.aiFlag && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(124,58,237,0.15)',color:'#A78BFA',border:'1px solid rgba(124,58,237,0.25)'}}>🤖 AI FLAGGED</span>}
                      <span className="text-xs text-white/20 capitalize px-2 py-0.5 rounded-full" style={{background:'rgba(255,255,255,0.04)'}}>{r.status}</span>
                    </div>
                    <h3 className="font-semibold text-white/80 text-sm mb-1">{r.title}</h3>
                    <p className="text-white/30 text-xs">📍 {r.subcounty || r.county} · {r.anonymousAlias} · {r.category}</p>
                    
                    {/* Evidence Display */}
                    {r.evidenceFiles && r.evidenceFiles.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
                        <span>📎 {r.evidenceFiles.length} evidence file{r.evidenceFiles.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => vote(r._id,'confirm')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:scale-105"
                        style={{background:'rgba(22,163,74,0.1)',border:'1px solid rgba(22,163,74,0.2)',color:'#86efac'}}>
                        <ThumbsUp size={11}/> {r.votes?.confirm?.length||0}
                      </button>
                      <button onClick={() => vote(r._id,'urgent')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{background:'rgba(234,88,12,0.1)',border:'1px solid rgba(234,88,12,0.2)',color:'#fdba74'}}>
                        <AlertTriangle size={11}/> {r.votes?.urgent?.length||0}
                      </button>
                      <button onClick={() => vote(r._id,'fake')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
                        style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.3)'}}>
                        <ThumbsDown size={11}/> {r.votes?.fake?.length||0}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {reports.length === 0 && <div className="text-center py-12 text-white/20">No reports in your county yet. Be the first to report!</div>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
