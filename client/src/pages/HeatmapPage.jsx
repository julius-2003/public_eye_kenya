import { useEffect, useState } from 'react';
import api from '../api.js';
import AppShell from '../components/shared/AppShell.jsx';

const riskColor = r => ({critical:'#DC2626',high:'#EA580C',medium:'#D97706',low:'#16A34A'})[r] || '#16A34A';
const riskBg = r => ({critical:'rgba(220,38,38,0.15)',high:'rgba(234,88,12,0.15)',medium:'rgba(217,119,6,0.15)',low:'rgba(22,163,74,0.1)'})[r] || 'rgba(22,163,74,0.1)';

export default function HeatmapPage() {
  const [heatmap, setHeatmap] = useState([]);

  useEffect(() => {
    api.get('/heatmap').then(r => setHeatmap(r.data.heatmap || []));
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="syne font-extrabold text-xl mb-1">Risk Heatmap</h1>
          <p className="text-white/30 text-sm">All 47 counties ranked by corruption risk score</p>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[['critical','Critical','#DC2626'],['high','High','#EA580C'],['medium','Medium','#D97706'],['low','Low','#16A34A']].map(([k,l,c])=>(
            <div key={k} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{background:c}} />
              <span className="text-white/50">{l}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {heatmap.map((c,i) => {
            const risk = c.riskScore > 70 ? 'critical' : c.riskScore > 40 ? 'high' : c.riskScore > 20 ? 'medium' : 'low';
            return (
              <div key={i} className="rounded-xl p-4 transition-all hover:scale-105 cursor-pointer"
                style={{background:riskBg(risk),border:`1.5px solid ${riskColor(risk)}44`}}>
                <div className="flex items-center justify-between mb-2">
                  <span className="syne font-bold text-sm text-white/80">{c.county}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:`${riskColor(risk)}22`,color:riskColor(risk)}}>
                    {risk}
                  </span>
                </div>
                <div className="w-full rounded-full h-1.5 mb-2" style={{background:'rgba(255,255,255,0.1)'}}>
                  <div className="h-1.5 rounded-full transition-all" style={{width:`${c.riskScore}%`,background:riskColor(risk)}} />
                </div>
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span>📋 {c.reportCount}</span>
                  {c.aiFlags > 0 && <span>🤖 {c.aiFlags}</span>}
                  <span style={{color:riskColor(risk)}}>{c.riskScore}/100</span>
                </div>
              </div>
            );
          })}
          {heatmap.length === 0 && (
            <div className="col-span-4 text-center py-12 text-white/20">No data yet. Reports will populate the heatmap.</div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
