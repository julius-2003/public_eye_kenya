import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Plus, Users } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TaskForcePage() {
  const { user } = useAuth();
  const [forces, setForces] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:'', description:'' });

  const load = () => axios.get(`${API}/taskforce`).then(r => setForces(r.data.forces || []));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await axios.post(`${API}/taskforce`, form);
      toast.success('Task force created!');
      setShowNew(false);
      setForm({ name:'', description:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const join = async (id) => {
    try {
      await axios.post(`${API}/taskforce/${id}/join`);
      toast.success('Joined task force!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const inputStyle = {background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'};

  return (
    <AppShell>
      <div className="p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="syne font-extrabold text-xl">🤝 Task Forces</h1>
            <p className="text-white/30 text-sm">{user.county} County</p>
          </div>
          <button onClick={()=>setShowNew(!showNew)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{background:'#BB0000',color:'white'}}>
            <Plus size={14}/> New Force
          </button>
        </div>

        {showNew && (
          <div className="rounded-xl p-5 mb-5 space-y-3" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <h3 className="syne font-bold">Create Task Force</h3>
            <input className="w-full px-4 py-2 rounded-xl text-sm outline-none" style={inputStyle} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Task force name" />
            <textarea className="w-full px-4 py-2 rounded-xl text-sm outline-none" style={{...inputStyle,minHeight:'80px',resize:'none'}} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What will this task force investigate?" />
            <div className="flex gap-2">
              <button onClick={()=>setShowNew(false)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>Cancel</button>
              <button onClick={create} disabled={!form.name} className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40" style={{background:'#BB0000',color:'white'}}>Create</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {forces.map(f => (
            <div key={f._id} className="rounded-xl p-4 flex items-center justify-between" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="flex-1">
                <h3 className="syne font-bold text-sm text-white/80">{f.name}</h3>
                <p className="text-white/30 text-xs mt-0.5">{f.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Users size={12} className="text-white/20"/>
                  <span className="text-xs text-white/30">{f.members?.length||0} members</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background: f.status==='active'?'rgba(22,163,74,0.1)':'rgba(255,255,255,0.05)', color: f.status==='active'?'#86efac':'rgba(255,255,255,0.3)'}}>{f.status}</span>
                </div>
              </div>
              {!f.members?.some(m => (m._id||m)===user._id) && (
                <button onClick={()=>join(f._id)} className="px-3 py-1.5 rounded-lg text-xs font-bold ml-4" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                  Join
                </button>
              )}
            </div>
          ))}
          {forces.length === 0 && <p className="text-center py-8 text-white/20 text-sm">No task forces yet. Create one to start organizing!</p>}
        </div>
      </div>
    </AppShell>
  );
}
