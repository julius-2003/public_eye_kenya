import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Kiambu','Machakos','Nyeri','Meru','Thika','Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kilifi','Kirinyaga','Kisii','Kitui','Kwale','Laikipia','Lamu','Makueni','Mandera','Marsabit','Migori','Murang\'a','Nandi','Narok','Nyamira','Nyandarua','Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans-Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', nationalId:'', county:'', password:'' });
  const [loading, setLoading] = useState(false);

  const updateForm = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(form);
      toast.success('Registration successful! Check your email to verify your account.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'};
  const labelClass = "block text-xs font-semibold text-white/50 mb-2 uppercase tracking-widest";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'#0d0d0d'}}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="syne font-extrabold text-2xl">Public<span className="text-red-500">Eye</span></Link>
          <h1 className="syne font-extrabold text-2xl mt-2 mb-1">Create Account</h1>
          <p className="text-white/40 text-sm">Step {step} of 3 — Your identity is always protected</p>
          <div className="flex gap-2 mt-4 justify-center">
            {[1,2,3].map(s => (
              <div key={s} className="h-1 w-12 rounded-full transition-all" style={{background: s <= step ? '#BB0000' : 'rgba(255,255,255,0.1)'}} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          {step === 1 && (
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
                <label className={labelClass}>Phone Number</label>
                <input className={inputClass} style={inputStyle} value={form.phone} onChange={e => updateForm('phone', e.target.value)} placeholder="0712345678" />
              </div>
              <div>
                <label className={labelClass}>National ID</label>
                <input className={inputClass} style={inputStyle} value={form.nationalId} onChange={e => updateForm('nationalId', e.target.value)} placeholder="12345678" />
                <p className="text-white/25 text-xs mt-1">Stored as encrypted hash — never readable</p>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.firstName || !form.lastName || !form.phone || !form.nationalId}
                className="w-full py-3 rounded-xl font-bold mt-2 disabled:opacity-40 transition-all hover:scale-[1.02]"
                style={{background:'#BB0000',color:'white'}}>Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="syne font-bold text-lg mb-4">Account Setup</h2>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} style={inputStyle} value={form.email} onChange={e => updateForm('email', e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" className={inputClass} style={inputStyle} value={form.password} onChange={e => updateForm('password', e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className={labelClass}>County</label>
                <select className={inputClass} style={{...inputStyle,background:'rgba(255,255,255,0.06)'}} value={form.county} onChange={e => updateForm('county', e.target.value)}>
                  <option value="">Select county</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold transition-all" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>← Back</button>
                <button onClick={() => setStep(3)} disabled={!form.email || !form.password || !form.county}
                  className="flex-1 py-3 rounded-xl font-bold disabled:opacity-40 transition-all hover:scale-[1.02]"
                  style={{background:'#BB0000',color:'white'}}>Continue →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="syne font-bold text-lg mb-4">Confirm & Submit</h2>
              <div className="rounded-xl p-4 space-y-2" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                {[['Name', `${form.firstName} ${form.lastName}`], ['Email', form.email], ['County', form.county], ['Phone', form.phone]].map(([k,v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white/80">{v}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-4 text-xs" style={{background:'rgba(187,0,0,0.08)',border:'1px solid rgba(187,0,0,0.2)'}}>
                <p className="text-white/50 leading-relaxed">🎭 Your reports will appear as <strong className="text-white">"Citizen#XXXX"</strong> — your real name and National ID are never shown publicly. Your data is protected under Kenyan data privacy laws.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>← Back</button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl font-bold disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{background:'#BB0000',color:'white'}}>
                  {loading ? 'Creating...' : '✓ Create Account'}
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-center text-white/30 text-sm mt-4">Already registered? <Link to="/login" className="text-red-400">Sign In</Link></p>
      </div>
    </div>
  );
}
