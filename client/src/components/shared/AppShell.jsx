import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LayoutDashboard, AlertTriangle, MessageSquare, Map, Trophy, Users, Heart, Shield, LogOut, Eye } from 'lucide-react';

const navLinks = [
  { path: '/dashboard', icon: <LayoutDashboard size={16}/>, label: 'Overview' },
  { path: '/report', icon: <AlertTriangle size={16}/>, label: 'My Reports' },
  { path: '/chat', icon: <MessageSquare size={16}/>, label: 'County Chat' },
  { path: '/heatmap', icon: <Map size={16}/>, label: 'Heatmap' },
  { path: '/scoreboard', icon: <Trophy size={16}/>, label: 'Scoreboard' },
  { path: '/taskforce', icon: <Users size={16}/>, label: 'Task Force' },
  { path: '/support', icon: <Heart size={16}/>, label: 'Support Us', color: '#34D399' },
];

const adminLinks = [
  { path: '/admin', icon: <LayoutDashboard size={16}/>, label: 'Overview' },
  { path: '/admin/users', icon: <Users size={16}/>, label: 'Users' },
  { path: '/admin/reports', icon: <AlertTriangle size={16}/>, label: 'Reports' },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = ['countyadmin', 'superadmin'].includes(user?.role);

  const handleLogout = () => { logout(); navigate('/'); };

  const links = isAdmin ? adminLinks : navLinks;
  const roleColor = user?.role === 'superadmin' ? '#A78BFA' : user?.role === 'countyadmin' ? '#93C5FD' : 'rgba(255,255,255,0.5)';
  const roleBg = user?.role === 'superadmin' ? 'rgba(124,58,237,0.2)' : user?.role === 'countyadmin' ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.05)';
  const roleLabel = user?.role === 'superadmin' ? '👑 SUPER ADMIN' : user?.role === 'countyadmin' ? `🛡️ ${user.assignedCounty?.toUpperCase()} ADMIN` : `🧑 CITIZEN`;

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#0d0d0d'}}>
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 flex flex-col" style={{background:'#111',borderRight:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="p-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <Link to="/" className="flex items-center gap-2">
            <Eye size={18} className="text-red-400" />
            <span className="syne font-extrabold">Public<span className="text-red-500">Eye</span></span>
          </Link>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" style={{background:roleBg,color:roleColor,fontSize:'9px',letterSpacing:'0.04em'}}>
            {roleLabel}
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {links.map(l => {
            const active = location.pathname === l.path;
            return (
              <Link key={l.path} to={l.path}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all"
                style={{
                  color: active ? 'white' : (l.color || 'rgba(255,255,255,0.4)'),
                  background: active ? (isAdmin ? 'rgba(124,58,237,0.1)' : 'rgba(37,99,235,0.1)') : 'transparent',
                  borderRight: active ? `2px solid ${isAdmin ? '#7C3AED' : '#2563EB'}` : '2px solid transparent'
                }}>
                {l.icon}{l.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="text-xs text-white/40 mb-1">{user?.anonymousAlias}</div>
          <div className="text-xs text-white/25 mb-3">{user?.county}</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
            <LogOut size={13}/> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
