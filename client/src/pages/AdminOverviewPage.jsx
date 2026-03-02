import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [aiFlagged, setAiFlagged] = useState([]);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/overview`).then(r => setStats(r.data));
    axios.get(`${API}/admin/ai/flags`).then(r => setAiFlagged(r.data.reports||[]));
  }, []);

  const triggerAI = async () => {
    setTriggering(true);
    try {
      await axios.post(`${API}/admin/ai/trigger`);
      toast.success('AI Pattern Detector triggered!');
      axios.get(`${API}/admin/ai/flags`).then(r => setAiFlagged(r.data.reports||[]));
    } catch { toast.error('Failed to trigger AI'); }
    finally { setTriggering(false); }
  };

  const statCards = [
    { label: 'Total Users', val: stats.totalUsers || 0 },
    { label: 'Total Reports', val: stats.totalReports || 0 },
    { label: 'Verified Today', val: stats.verifiedToday || 0, color: '#86efac' },
    { label: 'Suspended', val: stats.suspendedUsers || 0, color: '#fca5a5' },
    { label: 'Pending Reports', val: stats.pendingReports || 0, color: '#fde068' },
    { label: 'AI Flags', val: stats.aiFlagged || 0, color: '#A78BFA' },
    { label: 'Total Donations', val: `KSh ${stats.totalDonations || 0}`, color: '#34D399' },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="syne font-extrabold text-xl">Admin Overview</h1>
              <span className="text-xs px-2 py-0.5 rounded" style={{background: user.role==='superadmin'?'rgba(124,58,237,0.2)':'rgba(37,99,235,0.2)',color: user.role==='superadmin'?'#A78BFA':'#93C5FD',fontSize:'10px'}}>
                {user.role==='superadmin' ? '👑 SUPER ADMIN' : `🛡️ ${user.assignedCounty}`}
              </span>
            </div>
            <p className="text-white/30 text-sm">Platform management dashboard</p>
          </div>
          {user.role === 'superadmin' && (
            <button onClick={triggerAI} disabled={triggering}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#A78BFA'}}>
              <Zap size={14}/>{triggering ? 'Running...' : '🤖 Trigger AI'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map((s,i) => (
            <div key={i} className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="syne font-extrabold text-xl" style={{color:s.color||'white'}}>{s.val}</div>
              <div className="text-white/35 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI Flags */}
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(124,58,237,0.04)',border:'1px solid rgba(124,58,237,0.2)'}}>
          <div className="p-4 flex items-center gap-2" style={{borderBottom:'1px solid rgba(124,58,237,0.15)'}}>
            <span>🤖</span>
            <h2 className="syne font-bold text-sm" style={{color:'#A78BFA'}}>AI Flagged Patterns</h2>
            <span className="text-xs text-white/30 ml-auto">{aiFlagged.length} active</span>
          </div>
          {aiFlagged.slice(0,5).map(r => (
            <div key={r._id} className="p-4" style={{borderBottom:'1px solid rgba(124,58,237,0.1)'}}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/80">{r.title}</div>
                  {r.aiPattern && <div className="text-xs mt-1" style={{color:'#A78BFA'}}>{r.aiPattern}</div>}
                  <div className="text-xs text-white/30 mt-0.5">📍 {r.county} · Risk: {r.aiRiskScore}/100</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-bold" style={{background:'rgba(124,58,237,0.15)',color:'#A78BFA',border:'1px solid rgba(124,58,237,0.25)'}}>
                  {r.severity?.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
          {aiFlagged.length === 0 && <p className="p-6 text-center text-white/20 text-sm">No AI flags yet. Run the detector to scan for patterns.</p>}
        </div>
      </div>
    </AppShell>
  );
}
