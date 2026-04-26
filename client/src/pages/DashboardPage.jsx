import { useEffect, useState } from 'react';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import ProfileCard from '../components/shared/ProfileCard.jsx';
import { Link } from 'react-router-dom';
import { AlertTriangle, MessageSquare, Trophy, Users } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState([]);
  const [aiFlagged, setAiFlagged] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoadingReports(true);
        const res = await api.get('/reports');
        setReports(res.data.reports || []);
      } catch (err) {
        console.warn('Failed to load reports (non-critical):', err.message);
        setReports([]);
      }
      
      try {
        const res = await api.get('/reports?aiFlag=true');
        setAiFlagged(res.data.reports || []);
      } catch (err) {
        console.warn('Failed to load AI flags (non-critical):', err.message);
        setAiFlagged([]);
      } finally {
        setLoadingReports(false);
      }
    };
    
    loadReports();
  }, []);

  const stats = [
    { label: 'My Reports', val: user?.totalReports || 0, sub: `${reports.filter(r=>r.status==='investigating').length} active` },
    { label: 'Votes Cast', val: user?.totalVotes || 0 },
    { label: 'Total Donated', val: `KSh ${user?.totalDonated || 0}`, color:'#34D399' },
    { label: 'Task Forces', val: user?.taskForceCount || 0 },
  ];

  const sevColor = s => s==='critical'?'#fca5a5':s==='high'?'#fdba74':s==='medium'?'#fde68a':'#86efac';
  const sevBg = s => s==='critical'?'rgba(220,38,38,0.15)':s==='high'?'rgba(234,88,12,0.15)':s==='medium'?'rgba(217,119,6,0.15)':'rgba(22,163,74,0.15)';

  return (
    <AppShell>
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="syne font-extrabold text-lg sm:text-xl md:text-2xl">Welcome, {user?.firstName}</h1>
                <p className="text-white/30 text-xs sm:text-sm">{user?.county} County</p>
              </div>
              <Link to="/report" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 w-full sm:w-auto justify-center sm:justify-start" style={{background:'#BB0000',color:'white'}}>
                <AlertTriangle size={14}/> New Report
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {stats.map((s,i) => (
                <div key={i} className="rounded-xl p-3 sm:p-4 text-center sm:text-left" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div className="syne font-extrabold text-lg sm:text-xl" style={{color:s.color||'white'}}>{s.val}</div>
                  <div className="text-white/35 text-xs mt-1">{s.label}</div>
                  {s.sub && <div className="text-green-400 text-xs font-bold mt-1 hidden sm:block">{s.sub}</div>}
                </div>
              ))}
            </div>

            {/* AI Alert */}
            {aiFlagged.length > 0 && (
              <div className="rounded-xl p-4 mb-6 flex items-start gap-3" style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.25)'}}>
                <span className="text-xl">🤖</span>
                <div>
                  <span className="text-white font-bold text-sm">AI Alert: </span>
                  <span className="text-white/60 text-sm">New corruption pattern detected in {user?.county}. {aiFlagged.length} reports linked.</span>
                  <Link to="/report" className="ml-2 text-sm font-bold" style={{color:'#BB0000'}}>View →</Link>
                </div>
              </div>
            )}

            {/* Recent reports */}
            <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div className="p-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <h2 className="syne font-bold text-sm">County Reports</h2>
                <Link to="/report" className="text-xs text-white/30 hover:text-white">View all →</Link>
              </div>
              {loadingReports ? (
                <div className="space-y-3 p-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <p className="p-6 text-center text-white/20 text-sm">No reports yet in your county</p>
              ) : (
                reports.slice(0,5).map(r => (
                  <div key={r._id} className="p-4 flex items-center gap-4" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white/80">{r.title}</div>
                      <div className="text-xs text-white/30 mt-0.5">{r.anonymousAlias} · {r.category} {r.aiFlag ? '· 🤖' : ''}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{background:sevBg(r.severity),color:sevColor(r.severity)}}>
                      {r.severity?.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/20">{r.voteScore || 0} votes</span>
                  </div>
                ))
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                {to:'/chat', icon:<MessageSquare size={18}/>, label:'County Chat', color:'#2563EB'},
                {to:'/heatmap', icon:'🗺️', label:'Risk Heatmap', color:'#BB0000'},
                {to:'/taskforce', icon:<Users size={18}/>, label:'Task Force', color:'#059669'},
              ].map((l,i) => (
                <Link key={i} to={l.to} className="rounded-xl p-3 sm:p-4 text-center transition-all hover:scale-105"
                  style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div className="flex justify-center mb-2">{typeof l.icon === 'string' ? <span className="text-lg sm:text-xl">{l.icon}</span> : l.icon}</div>
                  <div className="text-xs sm:text-sm font-semibold" style={{color:l.color}}>{l.label}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar - Profile Card */}
          <div className="lg:col-span-1 lg:row-span-3">
            <ProfileCard user={user} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
