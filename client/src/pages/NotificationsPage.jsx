import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AppShell from '../components/shared/AppShell.jsx';
import { Bell, Trash2, Check, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user, token } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all'); // all | unread | read

  // Filter notifications
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const getIconForType = (type) => {
    const icons = {
      'new_report': <FileText size={16} />,
      'report_message': <MessageSquare size={16} />,
      'urgent_flag': <AlertCircle size={16} />,
      'chat_flagged': <AlertCircle size={16} />,
      'new_chat': <MessageSquare size={16} />,
      'admin_action': <Bell size={16} />
    };
    return icons[type] || <Bell size={16} />;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'critical': { bg: 'rgba(220,38,38,0.15)', text: '#fca5a5', border: 'rgba(220,38,38,0.3)' },
      'high': { bg: 'rgba(234,88,12,0.15)', text: '#fdba74', border: 'rgba(234,88,12,0.3)' },
      'normal': { bg: 'rgba(37,99,235,0.15)', text: '#93C5FD', border: 'rgba(37,99,235,0.3)' }
    };
    return colors[priority] || colors['normal'];
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-blue-400" />
            <div>
              <h1 className="syne font-extrabold text-2xl">Notifications</h1>
              <p className="text-xs text-white/40">{unreadCount} unread</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          {['all', 'unread', 'read'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize"
              style={{
                background: filter === f ? '#2563EB' : 'rgba(255,255,255,0.06)',
                border: filter === f ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: filter === f ? 'white' : 'rgba(255,255,255,0.5)'
              }}>
              {f} ({notifications.filter(n => f === 'all' || (f === 'unread' ? !n.isRead : n.isRead)).length})
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={32} className="mx-auto mb-3 text-white/20" />
              <p className="text-white/40">No {filter === 'unread' ? 'unread ' : filter === 'read' ? 'read ' : ''}notifications</p>
            </div>
          ) : (
            filtered.map(notif => (
              <div 
                key={notif._id} 
                className="p-4 rounded-xl transition-all border"
                style={{
                  background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(37,99,235,0.08)',
                  borderColor: notif.isRead ? 'rgba(255,255,255,0.08)' : getPriorityColor(notif.priority).border,
                  opacity: notif.isRead ? 0.7 : 1
                }}>
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{ background: getPriorityColor(notif.priority).bg, color: getPriorityColor(notif.priority).text }}>
                    {getIconForType(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-white/80">{notif.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markAsRead(notif._id)}
                            className="p-1 rounded-lg hover:scale-110 transition-transform"
                            style={{ background: 'rgba(37,99,235,0.15)', color: '#93C5FD' }}>
                            <Check size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(notif._id)}
                          className="p-1 rounded-lg hover:scale-110 transition-transform"
                          style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-white/60 mb-2">{notif.message}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="capitalize px-2 py-0.5 rounded" 
                        style={{ background: getPriorityColor(notif.priority).bg, color: getPriorityColor(notif.priority).text }}>
                        {notif.priority}
                      </span>
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                      {notif.actionUrl && (
                        <a 
                          href={notif.actionUrl}
                          className="ml-auto px-2 py-0.5 rounded text-xs font-semibold transition-all hover:scale-105"
                          style={{ background: 'rgba(37,99,235,0.15)', color: '#93C5FD' }}>
                          View
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
