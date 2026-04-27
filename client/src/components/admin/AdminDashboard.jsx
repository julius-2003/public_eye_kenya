import { useState, useEffect } from 'react';
import { MessageSquare, Users, Map, Filter } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot'
];

const CHAT_ROOMS = ['general','water','roads','health','education','housing','finance'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'chats'
  const [selectedCounty, setSelectedCounty] = useState(
    user?.role === 'countyadmin' ? user.assignedCounty : 'All'
  );
  const [selectedRoom, setSelectedRoom] = useState('general');

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Chats state
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Available counties for dropdown
  const availableCounties = user?.role === 'countyadmin'
    ? [user.assignedCounty]
    : ['All', ...KENYA_COUNTIES];

  const [promotingUser, setPromotingUser] = useState(null);
  const [promoteCounty, setPromoteCounty] = useState('');

  // Load users when county changes
  useEffect(() => {
    if (activeTab !== 'users') return;
    loadUsers();
  }, [selectedCounty, userFilter, activeTab]);

  // Load chats when county or room changes
  useEffect(() => {
    if (activeTab !== 'chats') return;
    loadChats();
  }, [selectedCounty, selectedRoom, activeTab]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = {};
      if (userFilter) params.role = userFilter;
      const { data } = await api.get('/admin/users', { params });
      
      // Filter by county
      const countyFiltered = data.users?.filter(u => {
        if (selectedCounty === 'All') return true;
        const userCounty = u.assignedCounty || u.county;
        return userCounty === selectedCounty;
      }) || [];
      
      setUsers(countyFiltered);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadChats = async () => {
    try {
      setLoadingChats(true);
      const { data } = await api.get(`/chat/${selectedCounty}/${selectedRoom}`);
      setMessages(data.messages || []);
    } catch (err) {
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const suspend = async (id, suspend) => {
    try {
      await api.put(`/admin/users/${id}/suspend`, { suspend, reason: 'Policy violation' });
      toast.success(suspend ? 'User suspended' : 'User unsuspended');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const changeRole = async (id, role, assignedCounty) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role, assignedCounty });
      toast.success('Role updated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const filteredUsers = users.filter(u =>
    !userSearch || 
    u.email?.includes(userSearch) || 
    u.anonymousAlias?.includes(userSearch)
  );

  const roleColor = r => r==='superadmin'?'#A78BFA':r==='countyadmin'?'#93C5FD':'rgba(255,255,255,0.5)';
  const roleBg = r => r==='superadmin'?'rgba(124,58,237,0.2)':r==='countyadmin'?'rgba(37,99,235,0.2)':'rgba(255,255,255,0.06)';

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header with tabs */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: activeTab === 'users' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'users' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: activeTab === 'users' ? '#93C5FD' : 'rgba(255,255,255,0.5)'
              }}>
              <Users size={16} />
              All Users
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: activeTab === 'chats' ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: activeTab === 'chats' ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                color: activeTab === 'chats' ? '#93C5FD' : 'rgba(255,255,255,0.5)'
              }}>
              <MessageSquare size={16} />
              All Chats
            </button>
          </div>
          
          {/* County Selector */}
          {user?.role === 'superadmin' && (
            <div className="flex items-center gap-2">
              <Map size={14} className="text-white/40" />
              <select
                value={selectedCounty}
                onChange={e => setSelectedCounty(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}>
                {availableCounties.map(c => (
                  <option key={c} value={c} style={{ background: '#1a1a1a' }}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'users' && (
          <div className="p-6">
            {/* Users Filters */}
            <div className="flex gap-3 mb-6 flex-wrap items-center">
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by email or alias..."
                className="flex-1 px-4 py-2 rounded-lg text-sm outline-none min-w-64"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-white/40" />
                <select
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                  <option value="">All Roles</option>
                  <option value="citizen">Citizens</option>
                  <option value="countyadmin">County Admins</option>
                  <option value="superadmin">Super Admins</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="grid grid-cols-5 p-4 gap-4" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <div key={h} className="text-xs font-bold text-white/25 uppercase tracking-widest">{h}</div>
                ))}
              </div>

              {loadingUsers ? (
                <div className="p-8 text-center text-white/30">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-white/20">No users found in {selectedCounty}</div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u._id} className="grid grid-cols-5 p-4 gap-4 items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: roleBg(u.role), border: `1px solid ${roleColor(u.role)}44` }}>
                        {u.role === 'superadmin' ? '👑' : u.role === 'countyadmin' ? '🛡️' : '🧑'}
                      </div>
                      <div className="text-xs text-white/70">{u.anonymousAlias}</div>
                    </div>
                    <div className="text-xs text-white/50">{u.email}</div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: roleBg(u.role), color: roleColor(u.role) }}>
                        {u.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: u.isSuspended ? 'rgba(220,38,38,0.15)' : u.emailVerified ? 'rgba(22,163,74,0.15)' : 'rgba(234,179,8,0.1)', color: u.isSuspended ? '#fca5a5' : u.emailVerified ? '#86efac' : '#fde047' }}>
                        {u.isSuspended ? 'Suspended' : u.emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {user?.role === 'superadmin' && u.role === 'citizen' && (
                        <button
                          onClick={() => { setPromotingUser(u); setPromoteCounty(u.county || ''); }}
                          className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
                          ⬆️ Promote
                        </button>
                      )}
                      <button
                        onClick={() => suspend(u._id, !u.isSuspended)}
                        className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-80"
                        style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5' }}>
                        {u.isSuspended ? '✅ Unsuspend' : '⛔ Suspend'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="flex h-full">
            {/* Chat Rooms Sidebar */}
            <div className="w-40 flex-shrink-0 py-4 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="px-4 mb-3 text-xs font-bold text-white/25 uppercase tracking-widest">{selectedCounty}</div>
              {CHAT_ROOMS.map(room => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className="w-full text-left px-4 py-2 text-xs font-semibold capitalize transition-all"
                  style={{
                    color: selectedRoom === room ? 'white' : 'rgba(255,255,255,0.35)',
                    background: selectedRoom === room ? 'rgba(37,99,235,0.1)' : 'transparent',
                    borderRight: selectedRoom === room ? '2px solid #2563EB' : '2px solid transparent'
                  }}>
                  # {room}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-6">
              <h2 className="text-lg font-bold mb-4 capitalize"># {selectedRoom} - {selectedCounty}</h2>
              
              <div className="flex-1 overflow-y-auto rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {loadingChats ? (
                  <div className="flex items-center justify-center h-full text-white/30">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/20">No messages in this room</div>
                ) : (
                  messages.map(msg => (
                    <div key={msg._id} className="mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white/80">{msg.senderAlias}</span>
                            <span className="text-xs text-white/30">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-white/70 mt-1 break-words">{msg.message}</p>
                          {msg.attachments?.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {msg.attachments.map((att, i) => (
                                <a key={i} href={att} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                                  📎 Attachment
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {promotingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full mx-4" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
            <h3 className="syne font-bold text-lg mb-2">Promote to County Admin</h3>
            <p className="text-white/50 text-sm mb-4">Select the county for {promotingUser.anonymousAlias}</p>
            
            <select
              value={promoteCounty}
              onChange={e => setPromoteCounty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm mb-6 outline-none"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}>
              <option value="">Select a county...</option>
              {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <div className="flex gap-3">
              <button onClick={() => setPromotingUser(null)} className="flex-1 py-2 rounded-lg font-semibold transition-all" style={{background:'rgba(255,255,255,0.06)',color:'white'}}>Cancel</button>
              <button 
                onClick={() => {
                  if(!promoteCounty) return toast.error('Select a county');
                  changeRole(promotingUser._id, 'countyadmin', promoteCounty);
                  setPromotingUser(null);
                }}
                className="flex-1 py-2 rounded-lg font-semibold transition-all" style={{background:'rgba(37,99,235,0.2)',border:'1px solid rgba(37,99,235,0.4)',color:'#93C5FD'}}>
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
