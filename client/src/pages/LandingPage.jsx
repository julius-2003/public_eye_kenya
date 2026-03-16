import { Link } from 'react-router-dom';
import { Shield, Eye, MapPin, Zap, Users, Lock } from 'lucide-react';
import SocialMedia from '../components/shared/SocialMedia.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#0A0A0A 0%,#1a0505 40%,#0d0a1a 80%,#0A0A0A 100%)'}}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:'rgba(187,0,0,0.2)',border:'1.5px solid rgba(187,0,0,0.5)'}}>
            <Eye size={18} className="text-red-400" />
          </div>
          <span className="syne font-extrabold text-lg">Public<span className="text-red-500">Eye</span></span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',color:'#F0D98B'}}>Kenya</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-white/60 hover:text-white px-4 py-2 transition-colors">Sign In</Link>
          <Link to="/register" className="text-sm font-semibold px-4 py-2 rounded-lg transition-all" style={{background:'#BB0000',color:'white'}}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase" style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',color:'#F0D98B'}}>
          ✦ Citizen Accountability Platform v5
        </div>
        <h1 className="syne font-extrabold mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.04em'}}>
          Hold Kenya<br /><span style={{color:'#BB0000'}}>Accountable.</span>
        </h1>
        <p className="text-white/50 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Anonymous corruption reporting, AI pattern detection, and real-time accountability for all 47 counties. Your identity stays hidden. The truth doesn't.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/register" className="px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105" style={{background:'#BB0000',color:'white'}}>
            Start Reporting
          </Link>
          <Link to="/heatmap" className="px-8 py-4 rounded-xl font-semibold text-white/70 hover:text-white transition-all" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
            View Heatmap
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Shield size={24}/>, title:'Anonymous Reporting', desc:'Reports show as "Citizen#4821" — your name never appears.', color:'#BB0000'},
          { icon: <Zap size={24}/>, title:'AI Pattern Detection', desc:'AI runs every 30 minutes finding repeated contractors, ghost workers, and corruption clusters.', color:'#7C3AED'},
          { icon: <MapPin size={24}/>, title:'County Risk Heatmap', desc:'All 47 counties ranked by AI corruption risk score. Click any county for full analysis.', color:'#C9A84C'},
          { icon: <Lock size={24}/>, title:'Evidence Locker', desc:'SHA-256 hashed files. Chain-of-custody log. Court-admissible tamper-proof evidence.', color:'#059669'},
          { icon: <Eye size={24}/>, title:'Whistleblower Mode', desc:'One tap encrypts everything and sends anonymously to EACC, DCI, Nation Media, and TI-Kenya.', color:'#2563EB'},
          { icon: <Users size={24}/>, title:'Task Forces', desc:'Organize citizen-led task forces per county to investigate and document corruption together.', color:'#EA580C'},
        ].map((f, i) => (
          <div key={i} className="rounded-2xl p-6 transition-all hover:scale-[1.02]" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{background:`${f.color}22`,border:`1.5px solid ${f.color}44`,color:f.color}}>
              {f.icon}
            </div>
            <h3 className="syne font-extrabold mb-2">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Support CTA */}
      <div className="max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="rounded-2xl p-8" style={{background:'rgba(5,150,105,0.08)',border:'1.5px solid rgba(5,150,105,0.3)'}}>
          <span className="text-4xl mb-4 block">❤️</span>
          <h2 className="syne font-extrabold text-2xl mb-2">Keep PublicEye Running</h2>
          <p className="text-white/40 text-sm mb-6">No ads. No government funding. Just citizens. Support us via M-Pesa.</p>
          <Link to="/support" className="inline-block px-8 py-3 rounded-xl font-bold transition-all hover:scale-105" style={{background:'#059669',color:'white'}}>
            Support via M-Pesa ❤️
          </Link>
        </div>
      </div>

      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8">
          {/* Social Media Links */}
          <div className="mb-8">
            <SocialMedia layout="horizontal" size="md" />
          </div>
          {/* Footer Text */}
          <div className="text-center text-white/20 text-sm">
            © 2025 PublicEye Kenya · For the citizens, by the citizens
          </div>
        </div>
      </footer>
    </div>
  );
}
