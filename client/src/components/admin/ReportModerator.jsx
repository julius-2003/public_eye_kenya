import { useState, useEffect } from 'react';
import api from '../../api';
import SeverityBadge from '../shared/SeverityBadge';

const STATUS_OPTIONS = ['pending', 'investigating', 'resolved', 'dismissed', 'escalated'];

export default function ReportModerator() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/admin/reports', { params });
      setReports(data.reports);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filterStatus]);

  const handleUpdate = async () => {
    await api.put(`/admin/reports/${selected._id}/status`, { status: newStatus, reviewNote: note });
    setSelected(null);
    setNote('');
    fetchReports();
  };

  const handleWhistle = async (reportId) => {
    if (!confirm('Whistleblow this report to EACC, DCI, Nation Media, and TI-Kenya?')) return;
    await api.post(`/reports/${reportId}/whistleblow`);
    fetchReports();
  };

  return (
    <div>
      {/* Filter */}
      <div className="flex gap-3 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading ? (
          <div className="p-8 text-center text-white/30">Loading reports...</div>
        ) : reports.map(r => (
          <div key={r._id} className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: r.aiFlags?.length ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <SeverityBadge severity={r.severity} />
              <span className="text-[9px] text-white/30">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            {r.aiFlags?.length > 0 && (
              <div className="mb-2 px-2 py-1 rounded text-[9px] font-bold" style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.25)' }}>
                🤖 AI Pattern Detected
              </div>
            )}
            <div className="font-syne font-bold text-xs text-white mb-1">{r.title}</div>
            <div className="text-[10px] text-white/35 mb-3">📍 {r.county} · {r.department} · {r.alias} · {r.votes?.confirm?.length || 0} votes</div>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => { setSelected(r); setNewStatus(r.status); }}
                className="px-2.5 py-1.5 rounded-lg font-syne text-[9px] font-bold"
                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
                ✏️ Update
              </button>
              {!r.whistleblown && (
                <button onClick={() => handleWhistle(r._id)}
                  className="px-2.5 py-1.5 rounded-lg font-syne text-[9px] font-bold"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
                  📡 Whistleblow
                </button>
              )}
              {r.whistleblown && <span className="px-2 py-1 text-[9px] font-bold" style={{ color: '#34D399' }}>✅ Whistleblown</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Update modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-fadeIn" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div className="font-syne font-black text-sm text-white mb-4">Update Report Status</div>
            <div className="font-bold text-xs text-white/60 mb-4">{selected.title}</div>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none mb-3"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Review note (optional)..."
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none resize-none mb-4"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div className="flex gap-2">
              <button onClick={handleUpdate}
                className="flex-1 py-2.5 rounded-lg font-syne font-bold text-sm text-white"
                style={{ background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)' }}>
                Update
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-lg font-syne font-bold text-sm text-white/40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
