import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, X, Eye, EyeOff, Upload, Trash2, AlertCircle } from 'lucide-react';
import api from '../api';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Admin Announcements Management
 * Only accessible to County Admins and Super Admins
 * Create, view, edit, and delete announcements with file attachments
 */
export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    message: '',
    priority: 'normal', // normal, high, urgent
    isGlobal: false,
    county: '',
    attachments: [],
  });

  const [files, setFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Fetch announcements
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

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user]);

  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  // Remove file from form
  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Reset form
  const resetForm = () => {
    setForm({
      title: '',
      message: '',
      priority: 'normal',
      isGlobal: false,
      county: '',
      attachments: [],
    });
    setFiles([]);
    setEditingId(null);
    setFileInputKey(prev => prev + 1);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    if (!form.isGlobal && !form.county) {
      toast.error('Select county or mark as global');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('message', form.message);
      formData.append('priority', form.priority);
      formData.append('isGlobal', form.isGlobal);
      if (form.county) formData.append('county', form.county);

      // Add file attachments
      files.forEach((file) => {
        formData.append('attachments', file);
      });

      if (editingId) {
        // Update existing
        await api.put(`/announcements/${editingId}`, formData);
        toast.success('Announcement updated');
      } else {
        // Create new
        await api.post('/announcements', formData);
        toast.success('Announcement published');
      }

      resetForm();
      setShowForm(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast.error(err.response?.data?.message || 'Failed to save announcement');
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;

    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast.error('Failed to delete announcement');
    }
  };

  // Edit announcement
  const handleEdit = (announcement) => {
    setForm({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      isGlobal: announcement.isGlobal,
      county: announcement.county || '',
      attachments: announcement.attachments || [],
    });
    setEditingId(announcement._id);
    setShowForm(true);
  };

  const counties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita Taveta',
    'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Samburu',
    'Turkana', 'West Pokot', 'Baringo', 'Laikipia', 'Nakuru', 'Nairobi',
    'Kiambu', 'Murang\'a', 'Nyeri', 'Kirinyaga', 'Embu', 'Meru',
    'Tharaka Nithi', 'Uasin Gishu', 'Elgeyo Marakwet', 'Nandi', 'Kisumu',
    'Siaya', 'Kisii', 'Nyamira', 'Narok', 'Kajiado', 'Kericho',
    'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia'
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,30,0.9))' }}>
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <AlertCircle size={32} style={{ color: '#BB0000' }} />
            Announcements
          </h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (!showForm) resetForm();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{ background: '#BB0000' }}
          >
            <Plus size={18} />
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Voter Registration Deadline"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Announcement details..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Priority Level</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="normal" style={{ color: '#000' }}>Normal</option>
                  <option value="high" style={{ color: '#000' }}>High</option>
                  <option value="urgent" style={{ color: '#000' }}>Urgent</option>
                </select>
              </div>

              {/* Scope */}
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-3">Scope</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.isGlobal}
                      onChange={() => setForm({ ...form, isGlobal: true, county: '' })}
                      className="accent-red-500"
                      disabled={user?.role !== 'superadmin'}
                    />
                    <span className="text-white/70">
                      Global {user?.role !== 'superadmin' && <span className="text-xs text-white/40">(Super Admin only)</span>}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!form.isGlobal}
                      onChange={() => setForm({ ...form, isGlobal: false })}
                      className="accent-red-500"
                    />
                    <span className="text-white/70">County-Specific</span>
                  </label>
                </div>
              </div>

              {/* County Selection */}
              {!form.isGlobal && (
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">
                    County <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="" style={{ color: '#000' }}>Select County</option>
                    {counties.map((county) => (
                      <option key={county} value={county} style={{ color: '#000' }}>
                        {county}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* File Attachments */}
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-red-500/50 transition-colors">
                  <input
                    key={fileInputKey}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="fileInput"
                  />
                  <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={24} style={{ color: '#BB0000' }} />
                    <span className="text-white/70 font-semibold">Click to upload files</span>
                    <span className="text-white/40 text-xs">Images, videos, PDFs, or documents</span>
                  </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <span className="text-white/70 text-sm truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-[1.02]"
                style={{ background: '#22c55e' }}
              >
                {editingId ? 'Update Announcement' : 'Publish Announcement'}
              </button>
            </form>
          </div>
        )}

        {/* Announcement List */}
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle size={48} style={{ color: 'rgba(255,255,255,0.2)' }} className="mx-auto mb-4" />
            <p className="text-white/50">No announcements yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className="p-6 rounded-xl border transition-all hover:border-red-500/50"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Priority Badge */}
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold text-white"
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

                      {/* Scope Badge */}
                      <span
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          background: announcement.isGlobal ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)',
                          color: announcement.isGlobal ? '#22c55e' : '#3b82f6',
                        }}
                      >
                        {announcement.isGlobal ? 'GLOBAL' : announcement.county}
                      </span>

                      {/* Date */}
                      <span className="text-white/40 text-xs">
                        {new Date(announcement.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/10"
                      title="Edit"
                    >
                      <Eye size={18} style={{ color: '#3b82f6' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/10"
                      title="Delete"
                    >
                      <Trash2 size={18} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>

                {/* Message */}
                <p className="text-white/70 mb-4 whitespace-pre-wrap break-words">{announcement.message}</p>

                {/* Attachments */}
                {announcement.attachments?.length > 0 && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white/50 text-xs font-semibold mb-2">Attachments ({announcement.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {announcement.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded text-xs font-semibold text-white transition-all hover:scale-105"
                          style={{ background: 'rgba(59,130,246,0.3)', color: '#3b82f6' }}
                        >
                          📎 {att.fileName || `File ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posted By */}
                <p className="text-white/30 text-xs mt-3">
                  Posted by {announcement.postedByRole} • {new Date(announcement.publishedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
