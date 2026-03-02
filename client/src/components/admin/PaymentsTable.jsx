import { useState, useEffect } from 'react';
import api from '../../api';

export default function PaymentsTable() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/admin/payments')
      .then(({ data }) => { setPayments(data.payments); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)' }}>
          <div className="font-syne font-black text-2xl" style={{ color: '#34D399' }}>KSh {totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-white/40 mt-1">Total Revenue</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="font-syne font-black text-2xl text-white">{payments.filter(p => p.status === 'SUCCESS').length}</div>
          <div className="text-xs text-white/40 mt-1">Successful Payments</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="font-syne font-black text-2xl text-white">{total}</div>
          <div className="text-xs text-white/40 mt-1">Total Transactions</div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['User','Method','Amount','Status','Date'].map(h => (
            <div key={h} className="font-syne text-[9px] font-black text-white/25 tracking-wider uppercase text-center first:text-left">{h}</div>
          ))}
        </div>
        {loading ? (
          <div className="p-8 text-center text-white/30">Loading...</div>
        ) : payments.map(p => (
          <div key={p._id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-xs text-white/60">{p.alias || p.user?.alias || '—'}</div>
            <div className="text-xs text-white/50 text-center capitalize">{p.method?.replace('_', ' ')}</div>
            <div className="text-xs font-bold text-center" style={{ color: '#34D399' }}>KSh {p.amount}</div>
            <div className="flex justify-center">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={p.status === 'SUCCESS'
                  ? { background: 'rgba(22,163,74,0.15)', color: '#86efac', border: '1px solid rgba(22,163,74,0.25)' }
                  : p.status === 'PENDING'
                  ? { background: 'rgba(234,179,8,0.15)', color: '#fde047', border: '1px solid rgba(234,179,8,0.25)' }
                  : { background: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.25)' }}>
                {p.status}
              </span>
            </div>
            <div className="text-[10px] text-white/30 text-center">{new Date(p.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
