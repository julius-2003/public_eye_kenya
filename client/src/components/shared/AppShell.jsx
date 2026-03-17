import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { LayoutDashboard, AlertTriangle, MessageSquare, Map, Trophy, Users, Heart, Shield, LogOut, Eye, Crown, Lock, Settings, Clock, Bell, Menu, X } from 'lucide-react';
import NotificationBell from './NotificationBell.jsx';
import SocialMedia from './SocialMedia.jsx';

const citizenLinks = [
  { path: '/dashboard', icon: <LayoutDashboard size={16}/>, label: 'Dashboard' },
  { path: '/report', icon: <AlertTriangle size={16}/>, label: 'New Report' },
  { path: '/chat', icon: <MessageSquare size={16}/>, label: 'County Chat' },
  { path: '/heatmap', icon: <Map size={16}/>, label: 'Heatmap' },
  { path: '/scoreboard', icon: <Trophy size={16}/>, label: 'Scoreboard' },
  { path: '/taskforce', icon: <Users size={16}/>, label: 'Task Force' },
  { path: '/announcements', icon: <Bell size={16}/>, label: 'Announcements', color: '#DC2626' },
  { path: '/support', icon: <Heart size={16}/>, label: 'Support Us', color: '#34D399' },
  { path: '/settings', icon: <Settings size={16}/>, label: 'Settings' },
];

const countyadminLinks = [
  { path: '/admin', icon: <LayoutDashboard size={16}/>, label: 'Overview' },
  { path: '/admin/users', icon: <Users size={16}/>, label: 'Users' },
  { path: '/admin/reports', icon: <AlertTriangle size={16}/>, label: 'Reports' },
  { path: '/admin/moderation', icon: <Shield size={16}/>, label: 'Moderation' },
  { path: '/admin/announcements', icon: <Bell size={16}/>, label: 'Announcements', color: '#DC2626' },
  { path: '/admin/support-settings', icon: <Settings size={16}/>, label: 'Support Settings' },
];

const superadminLinks = [
  { path: '/admin', icon: <Crown size={16}/>, label: 'System Overview' },
  { path: '/admin/county-admins/pending', icon: <Clock size={16}/>, label: 'Pending Approvals' },
  { path: '/admin/counties', icon: <Map size={16}/>, label: 'County Management' },
  { path: '/admin/users', icon: <Users size={16}/>, label: 'All Users' },
  { path: '/admin/reports', icon: <AlertTriangle size={16}/>, label: 'All Reports' },
  { path: '/admin/admins', icon: <Lock size={16}/>, label: 'Admin Management' },
  { path: '/admin/announcements', icon: <Bell size={16}/>, label: 'Announcements', color: '#DC2626' },
  { path: '/admin/support-settings', icon: <Settings size={16}/>, label: 'Support Settings' },
  { path: '/admin/moderation', icon: <Shield size={16}/>, label: 'Global Moderation' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { 
    logout(); 
    navigate('/'); 
  };

  // Determine navigation links and styling based on role
  let links = citizenLinks;
  let roleColor = 'rgba(255,255,255,0.5)';
  let roleBg = 'rgba(255,255,255,0.05)';
  let roleLabel = '🧑 CITIZEN';
  let roleIcon = null;

  if (user?.role === 'superadmin') {
    links = superadminLinks;
    roleColor = '#A78BFA';
    roleBg = 'rgba(124,58,237,0.2)';
    roleLabel = '👑 SUPER ADMIN';
    roleIcon = <Crown size={14} className="inline mr-1" />;
  } else if (user?.role === 'countyadmin') {
    links = countyadminLinks;
    roleColor = '#93C5FD';
    roleBg = 'rgba(37,99,235,0.2)';
    roleLabel = `🛡️ ${user.assignedCounty?.toUpperCase() || 'COUNTY'} ADMIN`;
    roleIcon = <Lock size={14} className="inline mr-1" />;
  }

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row" style={{background:'#0d0d0d'}}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative w-52 h-screen md:h-auto flex-shrink-0 flex flex-col z-50 transform transition-transform duration-200 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{background:'#111',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="p-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <Link to="/" className="flex items-center gap-2 flex-1">
            <Eye size={18} className="text-red-400" />
            <span className="syne font-extrabold text-sm md:text-base">Public<span className="text-red-500">Eye</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={20} className="text-white/50" />
          </button>
        </div>
        
        <div className="px-4 pt-3 pb-2">
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" style={{background:roleBg,color:roleColor,fontSize:'9px',letterSpacing:'0.04em'}}>
            {roleLabel}
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {links.map(l => {
            const active = location.pathname === l.path;
            let activeBg = 'rgba(37,99,235,0.1)';
            let activeBorder = '#2563EB';
            if (user?.role === 'superadmin') {
              activeBg = 'rgba(124,58,237,0.1)';
              activeBorder = '#7C3AED';
            }
            return (
              <Link key={l.path} to={l.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
                style={{
                  color: active ? 'white' : (l.color || 'rgba(255,255,255,0.4)'),
                  background: active ? activeBg : 'transparent',
                  borderRight: active ? `2px solid ${activeBorder}` : '2px solid transparent'
                }}>
                {l.icon}{l.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="text-xs text-white/40 mb-1 truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs text-white/25 mb-3 truncate">{user?.county}</div>
          <div className="flex gap-1 mb-2">
            <Link to="/settings" className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-all"
              style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)',color:'#93C5FD'}}>
              <Settings size={12} /> Settings
            </Link>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 py-1.5 rounded text-xs font-semibold transition-all"
            style={{background:'rgba(220,38,38,0.15)',border:'1px solid rgba(220,38,38,0.3)',color:'#fca5a5'}}>
            <LogOut size={12}/> Sign Out
          </button>
        </div>

        {/* Logout Confirmation Dialog */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowLogoutConfirm(false)}>
            <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-4" style={{border:'1px solid rgba(255,255,255,0.1)'}} onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="syne font-bold text-lg mb-2">Sign Out?</h3>
                <p className="text-white/40 text-sm mb-6">Are you sure you want to sign out of your account?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 rounded-lg font-semibold transition-all"
                    style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}>
                    Cancel
                  </button>
                  <button onClick={handleLogout} className="flex-1 py-2 rounded-lg font-semibold transition-all"
                    style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.4)',color:'#fca5a5'}}>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 w-full overflow-y-auto flex flex-col">
        {/* Header with notifications and mobile menu */}
        <div className="flex-shrink-0 p-4 border-b" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.3)'}}>
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-white/60 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <div></div>
            <div className="flex items-center gap-2">
              {(user?.role === 'superadmin' || user?.role === 'countyadmin') && <NotificationBell />}
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t" style={{borderColor:'rgba(255,255,255,0.06)',background:'rgba(0,0,0,0.5)'}}>
            <div className="max-w-7xl mx-auto">
              <div className="mb-4">
                <SocialMedia layout="horizontal" size="sm" />
              </div>
              <div className="text-center text-white/40 text-xs">
                © 2025 PublicEye Kenya · For the citizens, by the citizens
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
