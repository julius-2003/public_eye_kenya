import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppShell from '../components/shared/AppShell.jsx';
import ProfileCard from '../components/shared/ProfileCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const statusOptions = ['investigating','resolved','dismissed','whistleblown'];

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('');

  const load = () => axios.get(`${API}/admin/reports`).then(r => setReports(r.data.reports || []));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/reports/${id}/status`, { status });
      toast.success(`Status → ${status}`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deleteReport = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await axios.delete(`${API}/reports/${id}`);
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
    </AppShell>
  );
}
