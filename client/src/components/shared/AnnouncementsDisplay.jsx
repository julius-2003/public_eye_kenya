import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Download, ExternalLink } from 'lucide-react';
import api from '../../api.js';

/**
 * Announcements Display Component
 * Shows announcements filtered by user role and county
 * Displays urgent/high priority announcements prominently
 */
export default function AnnouncementsDisplay({ compact = false }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCounty, setUserCounty] = useState(null);

  // Get user county from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserCounty(user.county);
  }, []);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await api.get('/announcements');
        // Handle both array and object responses
        const data = Array.isArray(response.data) ? response.data : response.data.announcements || [];
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setAnnouncements([]); // Ensure it's always an array
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Refresh every 2 minutes
    const interval = setInterval(fetchAnnouncements, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Separate announcements by priority
  const urgentAnnouncements = announcements.filter((a) => a.priority === 'urgent');
  const highAnnouncements = announcements.filter((a) => a.priority === 'high');
  const normalAnnouncements = announcements.filter((a) => a.priority === 'normal');

  const displayCount = compact ? 3 : announcements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500" />
        <span className="ml-2 text-white/50 text-sm">Loading announcements...</span>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <AlertCircle size={32} className="mx-auto mb-2 text-white/30" />
        <p className="text-white/50 text-sm">No announcements at this time</p>
      </div>
    );
  }

  const allAnnouncements = [...urgentAnnouncements, ...highAnnouncements, ...normalAnnouncements].slice(0, displayCount);

  return (
    <div className="space-y-3">
      {allAnnouncements.map((announcement) => (
        <div
          key={announcement._id}
          className="p-4 rounded-lg border transition-all hover:shadow-lg"
          style={{
            background:
              announcement.priority === 'urgent'
                ? 'rgba(239,68,68,0.1)'
                : announcement.priority === 'high'
                ? 'rgba(249,115,22,0.05)'
                : 'rgba(255,255,255,0.02)',
            border:
              announcement.priority === 'urgent'
                ? '1px solid rgba(239,68,68,0.3)'
                : announcement.priority === 'high'
                ? '1px solid rgba(249,115,22,0.2)'
                : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Header with Priority Badge */}
          <div className="flex items-start gap-3 mb-2">
            {announcement.priority === 'urgent' && (
              <div className="flex-shrink-0 mt-1">
                <AlertCircle size={18} style={{ color: '#ef4444' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-bold text-white">{announcement.title}</h3>
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                  style={{
                    background:
                      announcement.priority === 'urgent'
                        ? 'rgba(239,68,68,0.3)'
                        : announcement.priority === 'high'
                        ? 'rgba(249,115,22,0.3)'
                        : 'rgba(107,114,128,0.3)',
                    color:
                      announcement.priority === 'urgent'
                        ? '#ef4444'
                        : announcement.priority === 'high'
                        ? '#f97316'
                        : '#9ca3af',
                  }}
                >
                  {announcement.priority.toUpperCase()}
                </span>
              </div>

              {/* Scope Badge */}
              {!announcement.isGlobal && (
                <p className="text-xs text-white/40 mt-1">📍 {announcement.county}</p>
              )}
            </div>
          </div>

          {/* Message Preview */}
          <p
            className="text-white/70 text-sm mb-3 whitespace-pre-wrap break-words line-clamp-3"
            style={{ maxHeight: compact ? '60px' : 'none' }}
          >
            {announcement.message}
          </p>

          {/* Attachments */}
          {announcement.attachments?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {announcement.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    background:
                      announcement.priority === 'urgent'
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(59,130,246,0.2)',
                    color: announcement.priority === 'urgent' ? '#ef4444' : '#3b82f6',
                  }}
                  title={att.fileName}
                >
                  <Download size={12} />
                  {att.fileName ? att.fileName.substring(0, 20) : `File ${idx + 1}`}
                  {att.fileName && att.fileName.length > 20 && '...'}
                </a>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{new Date(announcement.publishedAt).toLocaleDateString()}</span>
            {announcement.expiresAt && (
              <span>
                Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* View All Link */}
      {compact && announcements.length > displayCount && (
        <a
          href="/announcements"
          className="block text-center py-2 text-sm font-semibold transition-colors hover:text-red-400"
          style={{ color: '#3b82f6' }}
        >
          View All Announcements →
        </a>
      )}
    </div>
  );
}
