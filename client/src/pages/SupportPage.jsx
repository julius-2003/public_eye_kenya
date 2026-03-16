import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { usePayment } from '../context/PaymentContext.jsx';

const AMOUNTS = [
  { ksh: 50, label: 'Karibu' },
  { ksh: 100, label: '🔥 Popular', featured: true },
  { ksh: 200, label: 'Supporter' },
  { ksh: 500, label: 'Champion' },
];

export default function SupportPage() {
  const { initiatePayment, status, clearPayment, payment } = usePayment();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('stk');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handleSupport = async () => {
    if (!phone) return toast.error('Please enter your phone number');
    setLoading(true);
    try {
      await initiatePayment({ phone, amount: finalAmount, method });
      if (method === 'stk') toast.success('STK Push sent! Enter your M-Pesa PIN on your phone.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{background:'#0d0d0d'}}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-white/30 hover:text-white text-sm mb-6">← Back</button>

        {/* Hero */}
        <div className="text-center rounded-2xl p-10 mb-8" style={{background:'rgba(5,150,105,0.08)',border:'1.5px solid rgba(5,150,105,0.3)'}}>
          <span className="text-5xl mb-4 block">❤️</span>
          <h1 className="syne font-extrabold text-3xl mb-3">Support <span style={{color:'#34D399'}}>PublicEye</span></h1>
          <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
            No ads. No government funding. Just citizens. Every shilling keeps the AI running and corruption accountable.
          </p>
        </div>

        {/* Payment box */}
        {status === 'success' ? (
          <div className="text-center rounded-2xl p-10" style={{background:'rgba(22,163,74,0.08)',border:'1.5px solid rgba(22,163,74,0.3)'}}>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="syne font-extrabold text-2xl mb-2">Thank you!</h2>
            <p className="text-white/50 mb-2">Receipt: <span className="mono text-green-400">{payment?.receipt || 'Success'}</span></p>
            <p className="text-white/30 text-sm mb-6">Your KSh {finalAmount} contribution helps fight corruption across Kenya.</p>
            <button onClick={() => { clearPayment(); navigate('/dashboard'); }}
              className="px-8 py-3 rounded-xl font-bold" style={{background:'#059669',color:'white'}}>
              Continue →
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            {/* Amount selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Select Amount</label>
              <div className="flex gap-3 flex-wrap">
                {AMOUNTS.map(a => (
                  <button key={a.ksh} onClick={() => { setAmount(a.ksh); setCustomAmount(''); }}
                    className="px-4 py-3 rounded-xl text-center transition-all hover:scale-105"
                    style={{
                      background: amount===a.ksh && !customAmount ? (a.featured?'rgba(5,150,105,0.2)':'rgba(5,150,105,0.1)') : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${amount===a.ksh && !customAmount ? 'rgba(5,150,105,0.5)' : 'rgba(255,255,255,0.08)'}`
                    }}>
                    <div className="syne font-extrabold text-lg">KSh {a.ksh}</div>
                    <div className="text-xs text-white/40">{a.label}</div>
                  </button>
                ))}
                <div className="flex-1 min-w-24">
                  <input type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{background:'rgba(255,255,255,0.06)',border:`1.5px solid ${customAmount?'rgba(5,150,105,0.5)':'rgba(255,255,255,0.1)'}`,color:'white'}}
                    placeholder="Custom" />
                  <div className="text-xs text-white/30 text-center mt-1">Any amount</div>
                </div>
              </div>
            </div>

            {/* Method */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id:'stk', icon:'📲', name:'STK Push', desc:'Auto prompt on phone' },
                  { id:'pochi', icon:'🏪', name:'Pochi wa Mtaa', desc:'Manual send' },
                  { id:'till', icon:'🏷️', name:'Till Number', desc:'Buy Goods' },
                ].map(m => (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{background: method===m.id ? 'rgba(5,150,105,0.12)' : 'rgba(255,255,255,0.03)', border:`1px solid ${method===m.id ? 'rgba(5,150,105,0.4)' : 'rgba(255,255,255,0.08)'}`}}>
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-xs font-bold text-white/80">{m.name}</div>
                    <div className="text-xs text-white/30">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            {method === 'stk' && (
              <div className="mb-5">
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">M-Pesa Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                  placeholder="0712345678" />
              </div>
            )}

            {method === 'pochi' && (
              <div className="rounded-xl p-4 mb-5" style={{background:'rgba(234,179,8,0.08)',border:'1px solid rgba(234,179,8,0.2)'}}>
                <p className="text-xs text-white/50 mb-1">Send <strong className="text-white">KSh {finalAmount}</strong> to Pochi wa Mtaa:</p>
                <p className="syne font-extrabold text-2xl" style={{color:'#fde047'}}>{import.meta.env.VITE_POCHI_PHONE || '0702199939'}</p>
                <p className="text-xs text-white/30 mt-1">PublicEye Kenya</p>
              </div>
            )}

            {method === 'till' && (
              <div className="rounded-xl p-4 mb-5" style={{background:'rgba(37,99,235,0.08)',border:'1px solid rgba(37,99,235,0.2)'}}>
                <p className="text-xs text-white/50 mb-1">Buy Goods & Services — Till Number:</p>
                <p className="syne font-extrabold text-2xl" style={{color:'#93C5FD'}}>{import.meta.env.VITE_TILL_NUMBER || '552341'}</p>
                <p className="text-xs text-white/30 mt-1">Amount: KSh {finalAmount}</p>
              </div>
            )}

            {method === 'stk' && (
              <button onClick={handleSupport} disabled={loading || status === 'pending'}
                className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{background:'#059669',color:'white'}}>
                {status==='pending' ? '⏳ Waiting for PIN...' : loading ? 'Sending...' : `Send KSh ${finalAmount} via STK Push ❤️`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
