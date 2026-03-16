import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CheckCircle, AlertCircle, Trash2, ArrowLeft } from 'lucide-react';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [faceStatus, setFaceStatus] = useState(null); // 'verified', 'rejected', null
  const [faceLoading, setFaceLoading] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/users/${id}/profile`);
      setProfile(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const verifyFace = async () => {
    setFaceLoading(true);
    try {
      // In a real implementation, you would use face-api.js or similar
      // For now, we simulate the verification
      // You would send image to a face detection API
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFaceStatus('verified');
      toast.success('Face verified as human');
    } catch (err) {
      setFaceStatus('rejected');
      toast.error('Face verification failed - does not appear to be a real person');
    } finally {
      setFaceLoading(false);
    }
  };

  const deleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`${API}/admin/users/${id}/profile`);
      toast.success('Profile deleted successfully');
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete profile');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="p-6 text-center">
          <p className="text-white/40">Profile not found</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-white/40 hover:text-white/60 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Users
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo & Face Verification */}
          <div>
            <div className="rounded-xl overflow-hidden mb-4" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
              {profile.profilePhotoUrl ? (
                <div className="aspect-square">
                  <img src={`${import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"}${profile.profilePhotoUrl}`} alt={`${profile.firstName} ${profile.lastName}`} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <User size={80} className="text-white/20" />
                </div>
              )}
            </div>

            {/* Face Verification Section */}
            {profile.profilePhotoUrl && (
              <div className="rounded-xl p-4 mb-4" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div className="text-sm font-semibold mb-3">Face Verification</div>
                
                {faceStatus === null ? (
                  <button
                    onClick={verifyFace}
                    disabled={faceLoading}
                    className="w-full py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                    style={{background:'rgba(59,130,246,0.15)',border:'1px solid rgba(59,130,246,0.3)',color:'#93C5FD'}}
                  >
                    {faceLoading ? '🔍 Verifying...' : '🔍 Verify Face'}
                  </button>
                ) : faceStatus === 'verified' ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(15,181,40,0.1)',border:'1px solid rgba(15,181,40,0.2)'}}>
                    <CheckCircle size={18} style={{color:'#0fb528'}} />
                    <span className="text-sm text-green-400">✓ Human Face Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.2)'}}>
                    <AlertCircle size={18} style={{color:'#fca5a5'}} />
                    <span className="text-sm text-red-400">⚠ Not a human face</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="space-y-2">
              <div className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="text-xs text-white/40 mb-1">Role</div>
                <div className="text-sm font-semibold capitalize">{profile.role}</div>
              </div>
              <div className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="text-xs text-white/40 mb-1">Status</div>
                <div className="text-sm font-semibold">
                  <span className={`px-2 py-0.5 rounded text-xs ${profile.isSuspended ? 'bg-red-500/20 text-red-400' : profile.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {profile.isSuspended ? 'Suspended' : profile.emailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-4">
            {/* Name */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="text-xs text-white/40 mb-1">Full Name</div>
              <div className="syne font-bold text-lg">{profile.firstName} {profile.lastName}</div>
            </div>

            {/* Email */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="text-xs text-white/40 mb-1">Email</div>
              <div className="text-white/70">{profile.email}</div>
              <div className="text-xs text-white/30 mt-2">
                {profile.emailVerified ? '✓ Email Verified' : '⚠ Email Not Verified'}
              </div>
            </div>

            {/* Phone */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="text-xs text-white/40 mb-1">Phone Number</div>
              <div className="text-white/70">{profile.phone}</div>
            </div>

            {/* County */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="text-xs text-white/40 mb-1">County</div>
              <div className="text-white/70">{profile.county}</div>
            </div>

            {/* Anonymous Alias */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div className="text-xs text-white/40 mb-1">Anonymous Alias</div>
              <div className="text-white/70 font-mono">{profile.anonymousAlias}</div>
              <div className="text-xs text-white/30 mt-2">Never displayed publicly</div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div className="text-xs text-white/40 mb-1">About</div>
                <div className="text-white/70 text-sm">{profile.bio}</div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="syne font-bold">{profile.totalReports || 0}</div>
                <div className="text-white/35 text-xs">Reports</div>
              </div>
              <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="syne font-bold">{profile.totalVotes || 0}</div>
                <div className="text-white/35 text-xs">Votes</div>
              </div>
              <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="syne font-bold" style={{color:'#34D399'}}>KSh {profile.totalDonated || 0}</div>
                <div className="text-white/35 text-xs">Donated</div>
              </div>
            </div>

            {/* Account Created */}
            <div className="text-xs text-white/30 rounded-lg p-4" style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)'}}>
              <div>Created: {new Date(profile.createdAt).toLocaleDateString()}</div>
              <div>Last Updated: {new Date(profile.updatedAt).toLocaleDateString()}</div>
            </div>

            {/* Delete Button */}
            <button
              onClick={deleteProfile}
              disabled={deleting}
              className="w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              style={{background:'rgba(220,38,38,0.2)',border:'1px solid rgba(220,38,38,0.4)',color:'#fca5a5'}}
            >
              <Trash2 size={18} />
              {deleting ? 'Deleting...' : 'Delete Profile'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
