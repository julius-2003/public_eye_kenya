import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertCircle, Download, Search } from 'lucide-react';
import api from '../api';
import AppShell from '../components/shared/AppShell.jsx';
import AnnouncementsDisplay from '../components/shared/AnnouncementsDisplay';

/**
 * Public Announcements Page
 * All users can view announcements relevant to their role/county
 * Filter by priority, search, and view attachments
 */
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // all, urgent, high, normal

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
        toast.error('Failed to load announcements');
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

  // Filter announcements
  const filteredAnnouncements = announcements
    .filter((a) => priorityFilter === 'all' || a.priority === priorityFilter)
    .filter(
      (a) =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Group by priority
  const urgentAnnouncements = filteredAnnouncements.filter((a) => a.priority === 'urgent');
  const highAnnouncements = filteredAnnouncements.filter((a) => a.priority === 'high');
  const normalAnnouncements = filteredAnnouncements.filter((a) => a.priority === 'normal');

  const displayAnnouncements = [...urgentAnnouncements, ...highAnnouncements, ...normalAnnouncements];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,30,0.9))' }}>
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <AlertCircle size={32} style={{ color: '#BB0000' }} />
            Announcements
          </h1>
          <p className="text-white/50">Important updates and notices relevant to you</p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'urgent', 'high', 'normal'].map((priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background:
                    priorityFilter === priority
                      ? priority === 'urgent'
                        ? '#ef4444'
                        : priority === 'high'
                        ? '#f97316'
                        : priority === 'normal'
                        ? '#6b7280'
                        : '#BB0000'
                      : 'rgba(255,255,255,0.1)',
                  color: priorityFilter === priority ? 'white' : 'rgba(255,255,255,0.5)',
                  border:
                    priorityFilter === priority
                      ? 'none'
                      : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        {displayAnnouncements.length > 0 && (
          <p className="text-white/50 text-sm mb-4">
            Showing <span className="font-semibold text-white">{displayAnnouncements.length}</span>{' '}
            announcement{displayAnnouncements.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Announcements List */}
        {displayAnnouncements.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle size={48} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/50 text-lg">No announcements found</p>
            {searchTerm && (
              <p className="text-white/30 text-sm mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="p-6 rounded-xl border transition-all hover:shadow-lg"
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
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  {announcement.priority === 'urgent' && (
                    <div className="flex-shrink-0 animate-pulse">
                      <AlertCircle size={24} style={{ color: '#ef4444' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h2 className="text-xl md:text-2xl font-bold text-white">{announcement.title}</h2>
                      <span
                        className="px-3 py-1 rounded text-xs font-semibold whitespace-nowrap"
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

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                      <span>📅 {new Date(announcement.publishedAt).toLocaleDateString()}</span>
                      {!announcement.isGlobal && (
                        <span>📍 {announcement.county}</span>
                      )}
                      {announcement.isGlobal && (
                        <span style={{ color: '#22c55e' }}>🌍 Global</span>
                      )}
                      {announcement.expiresAt && (
                        <span>⏰ Expires {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <p className="text-white/70 mb-4 whitespace-pre-wrap break-words leading-relaxed">
                  {announcement.message}
                </p>

                {/* Attachments */}
                {announcement.attachments?.length > 0 && (
                  <div>
                    <p className="text-white/50 text-xs font-semibold mb-2">
                      📎 Attachments ({announcement.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {announcement.attachments.map((att, idx) => {
                        const isImage = att.url?.match(/\.(jpg|jpeg|png|gif|webp)/i);
                        const isVideo = att.url?.match(/\.(mp4|webm|mov)/i);

                        const handleDownload = (e) => {
                          e.preventDefault();
                          // Create a download link
                          const link = document.createElement('a');
                          link.href = att.url;
                          link.download = att.fileName || 'file';
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        };

                        return (
                          <button
                            key={idx}
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105"
                            style={{
                              background:
                                announcement.priority === 'urgent'
                                  ? 'rgba(239,68,68,0.2)'
                                  : 'rgba(59,130,246,0.2)',
                              color: announcement.priority === 'urgent' ? '#ef4444' : '#3b82f6',
                            }}
                            title={att.fileName}
                          >
                            <Download size={14} />
                            {isImage ? '🖼️' : isVideo ? '🎬' : '📄'} {att.fileName || `File ${idx + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
