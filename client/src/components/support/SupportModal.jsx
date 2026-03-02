import { useState } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { useAuth } from '../../context/AuthContext';

const AMOUNTS = [50, 100, 200, 500];

export default function SupportModal({ onClose }) {
  const { initiate, loading, paymentStatus, receipt } = usePayment();
  const { user } = useAuth();
  const [tab, setTab] = useState('stk'); // stk | pochi | till
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [manualResult, setManualResult] = useState(null);

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const handlePay = async () => {
    setError('');
    if (!finalAmount || finalAmount < 10) { setError('Minimum amount is KSh 10'); return; }
    if (tab === 'stk' && !phone) { setError('Phone number required'); return; }
    try {
      const result = await initiate({ phone, amount: finalAmount, method: tab === 'stk' ? 'stk_push' : tab });
      if (tab !== 'stk') setManualResult(result);
    } catch (e) {
      setError(e.response?.data?.message || 'Payment failed. Try again.');
    }
  };

  // Success screen
  if (paymentStatus === 'SUCCESS') {
    return (
      <ModalWrap onClose={onClose}>
        <div className="text-center py-8 animate-fadeIn">
          <div className="text-5xl mb-4">✅</div>
          <div className="font-syne font-black text-lg text-white mb-2">Thank you! ❤️</div>
          <div className="text-sm text-white/50 mb-4">Your support keeps PublicEye alive.</div>
          {receipt && <div className="font-mono text-xs text-[#34D399] p-2 rounded" style={{ background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.25)' }}>Receipt: {receipt}</div>}
          <button onClick={onClose} className="mt-6 w-full py-2.5 rounded-lg font-syne font-bold text-sm text-white" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>Done</button>
        </div>
      </ModalWrap>
    );
  }

  // Manual method result
  if (manualResult) {
    return (
      <ModalWrap onClose={onClose}>
        <div className="text-center py-6 animate-fadeIn">
          <div className="text-4xl mb-3">{tab === 'pochi' ? '🏪' : '🏷️'}</div>
          <div className="font-syne font-black text-base text-white mb-2">{tab === 'pochi' ? 'Send via Pochi wa Mtaa' : 'Send via Till Number'}</div>
          <div className="rounded-xl p-4 my-4 text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs text-white/40 mb-1">{tab === 'pochi' ? 'Pochi Number' : 'Till Number'}</div>
            <div className="font-mono text-2xl font-black text-white tracking-widest">{tab === 'pochi' ? manualResult.pochiNumber : manualResult.tillNumber}</div>
            {tab === 'pochi' && <div className="text-xs text-white/30 mt-1">{manualResult.pochiName}</div>}
            <div className="mt-3 text-sm font-bold" style={{ color: '#34D399' }}>Amount: KSh {finalAmount}</div>
          </div>
          <p className="text-xs text-white/40 mb-4">Open your M-Pesa app and complete the transfer. Thank you for supporting PublicEye! 🙏</p>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg font-syne font-bold text-sm text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>Close</button>
        </div>
      </ModalWrap>
    );
  }

  return (
    <ModalWrap onClose={onClose}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">❤️</div>
        <div className="font-syne font-black text-base text-white">Support PublicEye</div>
        <div className="text-[10px] text-white/40 mt-0.5">Keep accountability alive in Kenya</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {[['stk','📲 STK Push'],['pochi','🏪 Pochi'],['till','🏷️ Till']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex-1 py-2 rounded-lg font-syne text-[10px] font-bold transition-all"
            style={tab === key
              ? { background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', color: 'white' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Amount picker */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {AMOUNTS.map(a => (
          <button key={a} onClick={() => { setAmount(a); setCustomAmount(''); }}
            className="py-2 rounded-lg font-syne text-[10px] font-bold transition-all"
            style={amount === a && !customAmount
              ? { background: 'rgba(5,150,105,0.2)', border: '1.5px solid rgba(5,150,105,0.5)', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            {a}
          </button>
        ))}
      </div>
      <input
        type="number" placeholder="Custom amount (KSh)" value={customAmount}
        onChange={e => setCustomAmount(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Phone (STK only) */}
      {tab === 'stk' && (
        <>
          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Phone Number</div>
          <input
            type="tel" placeholder="07XX XXX XXX" value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </>
      )}

      {paymentStatus === 'PENDING' && (
        <div className="text-center py-3 mb-3 rounded-lg animate-pulse" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <div className="text-sm text-white/70">📲 STK Push sent. Enter your M-Pesa PIN...</div>
        </div>
      )}
      {paymentStatus === 'FAILED' && (
        <div className="text-center py-2 mb-3 rounded-lg text-sm" style={{ background: 'rgba(220,38,38,0.1)', color: '#fca5a5' }}>
          Payment failed or cancelled. Try again.
        </div>
      )}

      {error && <div className="text-[11px] text-red-400 mb-2 text-center">{error}</div>}

      <button onClick={handlePay} disabled={loading || paymentStatus === 'PENDING'}
        className="w-full py-3 rounded-xl font-syne font-black text-sm text-white transition-all disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
        {loading ? '⏳ Processing...' : `❤️ Pay KSh ${finalAmount || amount} via M-Pesa`}
      </button>
      <div className="text-[9px] text-white/20 text-center mt-2">🔒 Secured by Safaricom Daraja API</div>
    </ModalWrap>
  );
}

function ModalWrap({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fadeIn"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]"
          style={{ background: 'linear-gradient(135deg,rgba(5,150,105,0.2),rgba(5,150,105,0.05))' }}>
          <span className="font-syne font-black text-sm text-white">Support PublicEye</span>
          <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
