import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailChange = useCallback((e) => {
    setForm(prev => ({ ...prev, email: e.target.value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.anonymousAlias}`);
      
      // Role-based navigation
      if (data.user.role === 'superadmin') {
        navigate('/admin');
      } else if (data.user.role === 'countyadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      const isPending = err.response?.data?.pendingVerification;
      
      if (isPending) {
        toast.error(errMsg, {
          duration: 5000,
          icon: '⏳'
        });
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [form, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'#0d0d0d'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:'rgba(187,0,0,0.2)',border:'1.5px solid rgba(187,0,0,0.5)'}}>
              <Shield size={20} className="text-red-400" />
            </div>
            <span className="syne font-extrabold text-xl">Public<span className="text-red-500">Eye</span></span>
          </Link>
          <h1 className="syne font-extrabold text-2xl mb-2">Sign In</h1>
          <p className="text-white/40 text-sm">Your identity stays anonymous. Always.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Email</label>
            <input type="email" value={form.email} onChange={handleEmailChange}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
              placeholder="your@email.com" required />
          </div>
          <div className="mb-6 relative">
            <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest">Password</label>
            <input type={show ? 'text' : 'password'} value={form.password} onChange={handlePasswordChange}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
              placeholder="••••••••" required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-9 text-white/30 hover:text-white/60">
              {show ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{background:'#BB0000',color:'white'}}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
          <div className="flex items-center justify-between text-white/30 text-sm mt-4">
            <Link to="/register" className="text-red-400 hover:text-red-300">New Account</Link>
            <Link to="/forgot-password" className="text-white/30 hover:text-white/60 text-xs">Forgot password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
