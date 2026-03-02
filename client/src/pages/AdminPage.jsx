import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');

  const loadUsers = () => axios.get(`${API}/admin/users`).then(r => setUsers(r.data.users || []));
  useEffect(() => { loadUsers(); }, []);

  const suspend = async (id, suspend) => {
    try {
      await axios.put(`${API}/admin/users/${id}/suspend`, { suspend, reason: 'Policy violation' });
      toast.success(suspend ? 'User suspended' : 'User unsuspended');
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const changeRole = async (id, role, assignedCounty) => {
    try {
      await axios.put(`${API}/admin/users/${id}/role`, { role, assignedCounty });
      toast.success('Role updated');
      loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const roleColor = r => r==='superadmin'?'#A78BFA':r==='countyadmin'?'#93C5FD':'rgba(255,255,255,0.5)';
  const roleBg = r => r==='superadmin'?'rgba(124,58,237,0.2)':r==='countyadmin'?'rgba(37,99,235,0.2)':'rgba(255,255,255,0.06)';

  const filtered = users.filter(u => !filter || u.email?.includes(filter) || u.anonymousAlias?.includes(filter) || u.county?.includes(filter));

  return (
    <AppShell>
      <div className="p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="syne font-extrabold text-xl">User Management</h1>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search users..."
            className="px-4 py-2 rounded-xl text-sm outline-none"
            style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',width:'200px'}} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="syne font-extrabold text-xl">{users.length}</div>
            <div className="text-white/35 text-xs">Total Users</div>
          </div>
          <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="syne font-extrabold text-xl" style={{color:'#86efac'}}>{users.filter(u=>u.emailVerified).length}</div>
            <div className="text-white/35 text-xs">Verified</div>
          </div>
          <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="syne font-extrabold text-xl" style={{color:'#fca5a5'}}>{users.filter(u=>u.isSuspended).length}</div>
            <div className="text-white/35 text-xs">Suspended</div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="grid grid-cols-5 p-3" style={{background:'rgba(255,255,255,0.03)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            {['User','Role','County','Status','Actions'].map(h => <div key={h} className="text-xs font-bold text-white/25 uppercase tracking-widest">{h}</div>)}
          </div>
          {filtered.map(u => (
            <div key={u._id} className="grid grid-cols-5 p-3 items-center" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{background:roleBg(u.role),border:`1px solid ${roleColor(u.role)}44`}}>
                  {u.role==='superadmin'?'👑':u.role==='countyadmin'?'🛡️':'🧑'}
                </div>
                <div>
                  <div className="text-xs text-white/70">{u.email}</div>
                  <div className="text-xs text-white/25">{u.anonymousAlias}</div>
                </div>
              </div>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:roleBg(u.role),color:roleColor(u.role)}}>
                  {u.role}
                </span>
              </div>
              <div className="text-xs text-white/40">{u.assignedCounty || u.county}</div>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{background: u.isSuspended?'rgba(220,38,38,0.15)':u.emailVerified?'rgba(22,163,74,0.15)':'rgba(234,179,8,0.1)', color: u.isSuspended?'#fca5a5':u.emailVerified?'#86efac':'#fde047'}}>
                  {u.isSuspended ? 'Suspended' : u.emailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex gap-2">
                {me.role === 'superadmin' && u.role === 'citizen' && (
                  <button onClick={() => changeRole(u._id, 'countyadmin', u.county)}
                    className="px-2 py-1 rounded text-xs font-bold" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
                    → Admin
                  </button>
                )}
                {me.role === 'superadmin' && u.role === 'countyadmin' && (
                  <button onClick={() => changeRole(u._id, 'citizen', null)}
                    className="px-2 py-1 rounded text-xs font-bold" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)'}}>
                    Demote
                  </button>
                )}
                {u.role === 'citizen' && u._id !== me._id && (
                  <button onClick={() => suspend(u._id, !u.isSuspended)}
                    className="px-2 py-1 rounded text-xs font-bold transition-all"
                    style={{background: u.isSuspended?'rgba(22,163,74,0.15)':'rgba(220,38,38,0.15)', border: `1px solid ${u.isSuspended?'rgba(22,163,74,0.3)':'rgba(220,38,38,0.3)'}`, color: u.isSuspended?'#86efac':'#fca5a5'}}>
                    {u.isSuspended ? '↺ Unsuspend' : '⛔ Suspend'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
