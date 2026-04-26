import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, Lock } from 'lucide-react';

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Kiambu','Machakos','Nyeri','Meru','Thika','Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kilifi','Kirinyaga','Kisii','Kitui','Kwale','Laikipia','Lamu','Makueni','Mandera','Marsabit','Migori','Murang\'a','Nandi','Narok','Nyamira','Nyandarua','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans-Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', nationalId: '', county: '', 
  });
  const [loading, setLoading] = useState(false);

  const updateForm = useCallback((field, val) => setForm(prev => ({ ...prev, [field]: val })), []);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      const result = await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        nationalId: form.nationalId,
        county: form.county,
        role: 'citizen',
      });

      console.log('✅ Registration successful:', result);
      toast.success('Registration successful! Check your email to verify your account.');
      navigate('/login');
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      console.error('Error message:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [form, register, navigate]);

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = {background:'rgba(7, 7, 7, 0.86)',border:'1px solid rgba(26, 9, 9, 0.1)',color:'white'};
  const labelClass = "block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'#0d0d0d'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="syne font-extrabold text-2xl">Public<span className="text-red-500">Eye</span></Link>
          <h1 className="syne font-extrabold text-2xl mt-2 mb-1">Create Account</h1>
          <p className="text-white/40 text-sm">Join as a citizen</p>
        </div>

        <div className="rounded-2xl p-8" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="space-y-4">
            <h2 className="syne font-bold text-lg mb-4">Personal Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input className={inputClass} style={inputStyle} value={form.firstName} onChange={e => updateForm('firstName', e.target.value)} placeholder="John" />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input className={inputClass} style={inputStyle} value={form.lastName} onChange={e => updateForm('lastName', e.target.value)} placeholder="Doe" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} style={inputStyle} value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="your@email.com" />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input type="password" className={inputClass} style={inputStyle} value={form.password} onChange={e => updateForm('password', e.target.value)} placeholder="Min 8 characters" />
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <input className={inputClass} style={inputStyle} value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="0712345678" />
            </div>

            <div>
              <label className={labelClass}>National ID</label>
              <input className={inputClass} style={inputStyle} value={form.nationalId} onChange={e => updateForm('nationalId', e.target.value)} placeholder="12345678" />
              <p className="text-white/25 text-xs mt-1">Stored encrypted - never shown publicly</p>
            </div>

            <div>
              <label className={labelClass}>County</label>
              <select className={inputClass} style={{...inputStyle,background:'rgba(167, 5, 5, 0.97)'}} value={form.county} onChange={e => updateForm('county', e.target.value)}>
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button onClick={handleSubmit} disabled={!form.firstName || !form.lastName || !form.email || !form.password || !form.phone || !form.nationalId || !form.county || loading}
              className="w-full py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
              style={{background:'#0fb528a8',color:'white'}}>
              {loading ? 'Creating...' : '✓ Create Account'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/30 text-sm mt-4">Already registered? <Link to="/login" className="text-red-400">Sign In</Link></p>
      </div>
    </div>
  );
}
