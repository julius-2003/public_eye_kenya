import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/notifications')}
      className="relative p-2 rounded-lg transition-all hover:scale-110"
      style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}
      title="Notifications">
      <Bell size={18} />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: '#EF4444', color: 'white' }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </button>
  );
}
