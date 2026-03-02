import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Upload, ThumbsUp, AlertTriangle, ThumbsDown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORIES = ['Ghost Workers','Contractor Kickbacks','Missing Funds','Bribery','Nepotism','Procurement Fraud','Other'];
const SEVERITIES = ['low','medium','high','critical'];

export default function ReportPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('list'); // list | new
  const [form, setForm] = useState({ title:'', description:'', category:'', severity:'medium', subcounty:'', department:'' });
  const [loading, setLoading] = useState(false);

  const fetchReports = () => axios.get(`${API}/reports`).then(r => setReports(r.data.reports));
  useEffect(() => { fetchReports(); }, []);

  const submit = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/reports`, { ...form, county: user.county });
      toast.success('Report submitted anonymously!');
      setTab('list');
      fetchReports();
      setForm({ title:'', description:'', category:'', severity:'medium', subcounty:'', department:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  const vote = async (id, voteType) => {
    try {
      await axios.post(`${API}/reports/${id}/vote`, { voteType });
      fetchReports();
    } catch (err) { toast.error(err.response?.data?.message || 'Vote failed'); }
  };

  const sevColor = s => ({critical:'#fca5a5',high:'#fdba74',medium:'#fde68a',low:'#86efac'})[s];
  const sevBg = s => ({critical:'rgba(220,38,38,0.15)',high:'rgba(234,88,12,0.15)',medium:'rgba(217,119,6,0.15)',low:'rgba(22,163,74,0.15)'})[s];
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none";
  const inputStyle = {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'};

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="syne font-extrabold text-xl">{tab==='new'?'New Report':'Reports'}</h1>
          <button onClick={() => setTab(tab==='list'?'new':'list')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{background: tab==='new'?'rgba(255,255,255,0.06)':'#BB0000',color:'white',border: tab==='new'?'1px solid rgba(255,255,255,0.1)':'none'}}>
            {tab==='new'?'← Back to List':'+ New Report'}
          </button>
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
            <button onClick={submit} disabled={loading || !form.title || !form.category || !form.description}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
              style={{background:'#BB0000',color:'white'}}>
              {loading ? 'Submitting...' : '🎭 Submit Anonymously'}
            </button>
          </div>
        )}

        {tab === 'list' && (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r._id} className="rounded-xl p-4 transition-all hover:border-white/15"
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
                  </div>
                  <div className="flex flex-col items-end gap-2">
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
