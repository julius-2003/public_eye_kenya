import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState('loading');
  const token = params.get('token');

  useEffect(() => {
    if (!token) { setState('error'); return; }
    axios.get(`${API}/auth/verify-email/${token}`)
      .then(({ data }) => {
        localStorage.setItem('pe_token', data.token);
        setState('success');
      })
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'#0d0d0d'}}>
      <div className="text-center max-w-md">
        {state === 'loading' && <><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" /><p className="text-white/50">Verifying...</p></>}
        {state === 'success' && <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="syne font-extrabold text-2xl mb-2">Email Verified!</h1>
          <p className="text-white/50 mb-6">You're now ready to report corruption anonymously.</p>
          <Link to="/dashboard" className="px-8 py-3 rounded-xl font-bold" style={{background:'#BB0000',color:'white'}}>Go to Dashboard →</Link>
        </>}
        {state === 'error' && <>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="syne font-extrabold text-2xl mb-2">Verification Failed</h1>
          <p className="text-white/50 mb-6">The link is invalid or has expired.</p>
          <Link to="/login" className="text-red-400 hover:text-red-300">Back to Login</Link>
        </>}
      </div>
    </div>
  );
}
