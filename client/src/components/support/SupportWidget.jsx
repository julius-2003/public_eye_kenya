import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, X } from 'lucide-react';

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-50"
        style={{background:'#059669',boxShadow:'0 4px 20px rgba(5,150,105,0.4)'}}>
        {open ? <X size={18} className="text-white" /> : <Heart size={18} className="text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 rounded-2xl overflow-hidden shadow-2xl w-72"
          style={{background:'#111',border:'1px solid rgba(255,255,255,0.1)'}}>
          <div className="p-4 text-center" style={{background:'linear-gradient(135deg,rgba(5,150,105,0.2),rgba(5,150,105,0.05))',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="syne font-extrabold text-sm">Support PublicEye ❤️</div>
            <div className="text-xs text-white/40 mt-0.5">Keep us running. No ads, no funding.</div>
          </div>
          <div className="p-4 space-y-2">
            {[50,100,200,500].map(a => (
              <Link key={a} to={`/support?amount=${a}`} onClick={() => setOpen(false)}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02]"
                style={{background:'rgba(5,150,105,0.08)',border:'1px solid rgba(5,150,105,0.2)'}}>
                <span className="syne font-extrabold">KSh {a}</span>
                <span className="text-xs text-white/30">{a===100?'🔥 Popular':a===50?'Karibu':a===200?'Supporter':'Champion'}</span>
              </Link>
            ))}
            <Link to="/support" onClick={() => setOpen(false)}
              className="block text-center text-xs text-white/30 hover:text-white/50 mt-1 py-1">
              Custom amount →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
