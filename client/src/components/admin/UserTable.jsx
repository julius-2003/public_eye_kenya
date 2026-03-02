import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../shared/RoleBadge';

const KENYA_COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Uasin Gishu','Meru','Kiambu','Machakos','Kilifi','Kakamega','Kisii','Kericho','Bungoma','Nyeri','Murang\'a','Kirinyaga','Nyandarua','Laikipia','Samburu','Trans Nzoia','Elgeyo Marakwet','Nandi','Baringo','Bomet','Nyamira','Migori','Homabay','Siaya','Vihiga','Busia','Turkana','West Pokot','Isiolo','Marsabit','Mandera','Wajir','Garissa','Tana River','Lamu','Taita Taveta','Kajiado','Makueni','Kitui','Embu','Tharaka Nithi','Kwale'];

export default function UserTable() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filterRole]);

  const handleSuspend = async (userId, suspend, alias) => {
    if (!confirm(`${suspend ? 'Suspend' : 'Unsuspend'} ${alias}?`)) return;
    const reason = suspend ? prompt('Reason for suspension:') : undefined;
    await api.put(`/admin/users/${userId}/suspend`, { suspend, reason });
    fetchUsers();
  };

  const handleRoleChange = async (userId, role, assignedCounty) => {
    await api.put(`/admin/users/${userId}/role`, { role, assignedCounty });
    setEditUser(null);
    fetchUsers();
  };

  const filtered = users.filter(u =>
    u.alias?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.county?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search alias, email, county..."
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white/70 outline-none min-w-48"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="">All Roles</option>
          <option value="citizen">Citizens</option>
          <option value="countyadmin">County Admins</option>
          {isSuperAdmin && <option value="superadmin">Super Admins</option>}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Head */}
        <div className="grid px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['User','County','Role','Status','Actions'].map(h => (
            <div key={h} className="font-syne text-[9px] font-black text-white/25 tracking-wider uppercase text-center first:text-left">{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/20 text-sm">No users found</div>
        ) : filtered.map(u => (
          <div key={u._id} className="grid px-4 py-3 items-center" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
                {u.alias?.[0] || 'C'}
              </div>
              <div>
                <div className="text-xs text-white/80 font-medium">{u.alias}</div>
                <div className="text-[10px] text-white/30">{u.email}</div>
              </div>
            </div>
            <div className="text-xs text-white/50 text-center">{u.county}</div>
            <div className="flex justify-center"><RoleBadge role={u.role} /></div>
            <div className="flex justify-center">
              {u.isSuspended
                ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.25)' }}>Suspended</span>
                : u.emailVerified
                  ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(22,163,74,0.15)', color: '#86efac', border: '1px solid rgba(22,163,74,0.25)' }}>Verified</span>
                  : <span className="px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: 'rgba(234,179,8,0.15)', color: '#fde047', border: '1px solid rgba(234,179,8,0.25)' }}>Pending</span>
              }
            </div>
            <div className="flex gap-1.5 justify-center">
              {isSuperAdmin && (
                <button onClick={() => setEditUser(u)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:bg-blue-900/30"
                  style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
                  title="Edit role">✏️</button>
              )}
              <button onClick={() => handleSuspend(u._id, !u.isSuspended, u.alias)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
                title={u.isSuspended ? 'Unsuspend' : 'Suspend'}>
                {u.isSuspended ? '✅' : '⛔'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Role edit modal */}
      {editUser && (
        <RoleEditModal user={editUser} counties={KENYA_COUNTIES}
          onSave={handleRoleChange} onClose={() => setEditUser(null)} />
      )}
    </div>
  );
}

function RoleEditModal({ user, counties, onSave, onClose }) {
  const [role, setRole] = useState(user.role);
  const [county, setCounty] = useState(user.assignedCounty || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 animate-fadeIn" style={{ background: '#111', border: '1.5px solid rgba(124,58,237,0.4)' }} onClick={e => e.stopPropagation()}>
        <div className="font-syne font-black text-base text-white mb-1">Edit Role</div>
        <div className="text-xs text-white/40 mb-4">{user.alias}</div>
        <div className="mb-3">
          <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <option value="citizen">Citizen</option>
            <option value="countyadmin">County Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        {role === 'countyadmin' && (
          <div className="mb-4">
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1">Assigned County</label>
            <select value={county} onChange={e => setCounty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white/70 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <option value="">Select county...</option>
              {counties.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onSave(user._id, role, county)}
            className="flex-1 py-2.5 rounded-lg font-syne font-bold text-sm text-white"
            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
            Save Changes
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-lg font-syne font-bold text-sm text-white/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
