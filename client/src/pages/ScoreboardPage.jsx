import { useEffect, useState } from 'react';
import axios from 'axios';
import AppShell from '../components/shared/AppShell.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ScoreboardPage() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    axios.get(`${API}/scoreboard`).then(r => setBoards(r.data.scoreboard || []));
  }, []);

  const riskColor = r => ({critical:'#fca5a5',high:'#fdba74',medium:'#fde68a',low:'#86efac'})[r];

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="syne font-extrabold text-xl mb-1">🏆 Accountability Scoreboard</h1>
          <p className="text-white/30 text-sm">Departments ranked by transparency and performance</p>
        </div>
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="grid grid-cols-6 p-3" style={{borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.03)'}}>
            {['Dept','County','Transparency','Response Rate','Avg Days','Risk'].map(h=>(
              <div key={h} className="text-xs font-bold text-white/25 uppercase tracking-widest">{h}</div>
            ))}
          </div>
          {boards.map((b,i) => (
            <div key={i} className="grid grid-cols-6 p-3 items-center" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div className="text-sm font-semibold text-white/80">{b.department}</div>
              <div className="text-xs text-white/40">{b.county}</div>
              <div className="text-sm font-bold" style={{color:'#34D399'}}>{b.transparencyScore}%</div>
              <div className="text-sm text-white/60">{b.responseRate}%</div>
              <div className="text-sm text-white/60">{b.avgResolutionDays}d</div>
              <span className="text-xs font-bold" style={{color:riskColor(b.corruptionRisk)}}>{b.corruptionRisk}</span>
            </div>
          ))}
          {boards.length === 0 && <p className="p-6 text-center text-white/20 text-sm">No scoreboard data yet</p>}
        </div>
      </div>
    </AppShell>
  );
}
