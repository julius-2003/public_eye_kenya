import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter email, 2: enter reset code, 3: new password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      toast.success('Check your email for password reset link');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!resetToken || !newPassword || !confirmPassword) {
      toast.error('All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { 
        email, 
        token: resetToken, 
        newPassword 
      });
      toast.success('Password reset successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = {background:'rgba(7, 7, 7, 0.86)',border:'1px solid rgba(26, 9, 9, 0.1)',color:'white'};
  const labelClass = "block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'#0d0d0d'}}>
      <div className="w-full max-w-md">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="text-center mb-8">
          <Link to="/" className="syne font-extrabold text-2xl">Public<span className="text-red-500">Eye</span></Link>
          <h1 className="syne font-extrabold text-2xl mt-2 mb-1">Reset Password</h1>
          <p className="text-white/40 text-sm">Step {step} of 2</p>
        </div>

        <div className="rounded-2xl p-8" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 text-xs mb-6" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
                <p className="text-blue-300">📧 Enter your email address and we'll send you a password reset link</p>
              </div>
              
              <div>
                <label className={labelClass}>Email Address</label>
                <input 
                  type="email"
                  className={inputClass}
                  style={inputStyle}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <button 
                onClick={requestReset}
                disabled={loading || !email}
                className="w-full py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{background:'#0fb528a8',color:'white'}}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 text-xs mb-6" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
                <p className="text-blue-300">🔐 Check your email for the reset code and enter your new password</p>
              </div>

              <div>
                <label className={labelClass}>Reset Code</label>
                <input 
                  type="text"
                  className={inputClass}
                  style={inputStyle}
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  placeholder="Paste the code from your email"
                />
                <p className="text-white/25 text-xs mt-1">You'll find this in the password reset email</p>
              </div>

              <div>
                <label className={labelClass}>New Password</label>
                <input 
                  type="password"
                  className={inputClass}
                  style={inputStyle}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <input 
                  type="password"
                  className={inputClass}
                  style={inputStyle}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)} 
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}
                >
                  ← Back
                </button>
                <button 
                  onClick={resetPassword}
                  disabled={loading || !resetToken || !newPassword || !confirmPassword}
                  className="flex-1 py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
                  style={{background:'#0fb528a8',color:'white'}}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-4">
          Remember your password? <Link to="/login" className="text-blue-400">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
