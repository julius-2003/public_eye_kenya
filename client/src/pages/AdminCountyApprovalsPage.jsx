import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronRight, Check, X, Clock, AlertCircle } from 'lucide-react';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminCountyApprovalsPage() {
  const { user: me } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const loadPending = async () => {
    try {
      const res = await axios.get(`${API}/admin/county-admins/pending`);
      setPending(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load pending approvals');
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approve = async (id) => {
    setLoading(true);
    try {
      await axios.put(`${API}/admin/county-admins/${id}/verify`);
      toast.success('County admin approved! Email notification sent.');
      loadPending();
      setSelectedAdmin(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id) => {
    setPending(prev => prev.filter(p => p._id !== id));
    setSelectedAdmin(null);
    toast.success('Request rejected');
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-amber-400" />
            <h1 className="syne font-extrabold text-2xl">Pending County Admin Approvals</h1>
          </div>
          <p className="text-white/40">{pending.length} county admin{pending.length !== 1 ? 's' : ''} awaiting verification</p>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="text-3xl mb-3">✅</div>
            <p className="text-white/40">All county admin applications have been processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List */}
            <div className="lg:col-span-1 space-y-3">
              {pending.map(admin => (
                <button
                  key={admin._id}
                  onClick={() => setSelectedAdmin(admin._id)}
                  className={`w-full text-left rounded-xl p-4 transition-all ${selectedAdmin === admin._id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)'}}>
                      🛡️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{admin.firstName} {admin.lastName}</div>
                      <div className="text-xs text-white/40 truncate">{admin.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail Panel */}
            {selectedAdmin && (
              <div className="lg:col-span-2">
                {(() => {
                  const admin = pending.find(a => a._id === selectedAdmin);
                  if (!admin) return null;

                  return (
                    <div className="rounded-xl p-6 space-y-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                      {/* Header */}
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl" style={{background:'rgba(37,99,235,0.15)',border:'1px solid rgba(37,99,235,0.3)'}}>
                            🛡️
                          </div>
                          <div>
                            <div className="syne font-bold text-lg">{admin.firstName} {admin.lastName}</div>
                            <div className="text-sm text-white/40">{admin.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg p-3" style={{background:'rgba(15,181,40,0.1)',border:'1px solid rgba(15,181,40,0.2)'}}>
                          <div className="text-white/40 text-xs mb-1">County</div>
                          <div className="font-semibold text-green-400">{admin.assignedCounty}</div>
                        </div>
                        <div className="rounded-lg p-3" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
                          <div className="text-white/40 text-xs mb-1">Applied</div>
                          <div className="font-semibold text-blue-400">{new Date(admin.countyAdminRequestedAt).toLocaleDateString()}</div>
                        </div>
                        <div className="col-span-2 rounded-lg p-3" style={{background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>
                          <div className="text-white/40 text-xs mb-1">Phone</div>
                          <div className="font-semibold">{admin.phone}</div>
                        </div>
                      </div>

                      {/* Photos */}
                      <div>
                        <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
                          <AlertCircle size={16} /> Identity Verification
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Profile Photo */}
                          <div>
                            <p className="text-xs text-white/40 mb-2">Profile Picture</p>
                            {admin.profilePhotoUrl ? (
                              <img
                                src={`${import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"}${admin.profilePhotoUrl}`}
                                alt="Profile"
                                className="w-full h-56 object-cover rounded-lg border border-white/10"
                              />
                            ) : (
                              <div className="w-full h-56 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <p className="text-white/30 text-sm">No profile photo</p>
                              </div>
                            )}
                          </div>

                          {/* Face Photo */}
                          <div>
                            <p className="text-xs text-white/40 mb-2">Face Enrollment {admin.hasFace ? '✓' : ''}</p>
                            {admin.facePhotoUrl ? (
                              <img
                                src={admin.facePhotoUrl}
                                alt="Face"
                                className="w-full h-56 object-cover rounded-lg border border-white/10"
                              />
                            ) : (
                              <div className="w-full h-56 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                <p className="text-white/30 text-sm">
                                  {admin.hasFace ? 'Face enrolled' : 'No face enrollment'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {admin.hasFace && (
                          <div className="mt-3 p-3 rounded-lg text-xs" style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)'}}>
                            <p className="text-green-300">✓ Face enrollment completed. Profile and face photos are available for verification.</p>
                          </div>
                        )}

                        {!admin.hasFace && (
                          <div className="mt-3 p-3 rounded-lg text-xs" style={{background:'rgba(251,146,60,0.1)',border:'1px solid rgba(251,146,60,0.2)'}}>
                            <p className="text-orange-300">⚠️ No face enrollment yet. Proceed with caution.</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-white/10">
                        <button
                          onClick={() => approve(admin._id)}
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 hover:scale-105"
                          style={{background:'rgba(15,181,40,0.2)',border:'1px solid rgba(15,181,40,0.4)',color:'#0fb528'}}
                        >
                          <Check size={16} />
                          Approve
                        </button>
                        <button
                          onClick={() => reject(admin._id)}
                          className="flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                          style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.4)',color:'#fca5a5'}}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
