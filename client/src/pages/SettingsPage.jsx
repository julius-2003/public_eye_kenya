import { useState, useEffect, useCallback } from 'react';
import api from '../api.js';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { User, Edit, Save, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import AppShell from '../components/shared/AppShell.jsx';
import SimpleFaceEnroll from '../components/auth/SimpleFaceEnroll.jsx';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user: meFromAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [enrollingFace, setEnrollingFace] = useState(false);
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });

  const updateForm = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/auth/profile`);
      setProfile(res.data.user);
      
      setForm({
        firstName: res.data.user.firstName || '',
        lastName: res.data.user.lastName || '',
        phone: res.data.user.phone || '',
        bio: res.data.user.bio || ''
      });
      
      // Check face enrollment status
      try {
        const faceRes = await api.get('/auth/face/status');
        setFaceEnrolled(faceRes.data.hasFace);
      } catch (err) {
        console.warn('Could not check face status:', err.message);
      }
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      // Only save text fields - profile picture is set via face enrollment
      const response = await api.put('/auth/profile', {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        bio: form.bio
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.data.user) {
        setProfile(response.data.user);
        setForm({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          phone: response.data.user.phone || '',
          bio: response.data.user.bio || ''
        });
      }
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [form]);

  // Handle face enrollment
  const handleFaceEnroll = async (faceData) => {
    setEnrollingFace(true);
    try {
      // Simplified version: photo-only verification
      if (!faceData.facePhotoUrl) {
        toast.error('Please capture a photo first');
        setEnrollingFace(false);
        return;
      }

      toast.loading('Uploading your profile picture...');
      
      // Send as JSON with base64-encoded face photo
      const payload = {
        faceDescriptor: faceData.faceDescriptor || [], // Empty array for photo-only verification
        facePhotoData: faceData.facePhotoUrl // Base64 data URL
      };

      const res = await api.post('/auth/face/store', payload);

      toast.dismiss();
      toast.success('✓ Profile picture updated successfully!');
      setFaceEnrolled(true);
      setShowFaceEnroll(false);
      
      // Reload profile to show new picture
      setTimeout(() => loadProfile(), 500);
    } catch (err) {
      toast.dismiss();
      console.error('Face enroll error:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Failed to update profile picture. Please try again.';
      toast.error(errorMsg);
    } finally {
      setEnrollingFace(false);
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

  return (
    <AppShell>
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="syne font-extrabold text-2xl">My Profile</h1>
            </div>
            <p className="text-white/40 text-sm">Manage your account information and preferences</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            style={{background: isEditing ? 'rgba(220,38,38,0.2)' : 'rgba(37,99,235,0.2)', color: isEditing ? '#fca5a5' : '#93C5FD', border: `1px solid ${isEditing ? 'rgba(220,38,38,0.4)' : 'rgba(37,99,235,0.4)'}`}}
          >
            <Edit size={16} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Photo Section - Only when editing */}
          {isEditing && (
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="aspect-square rounded-xl overflow-hidden mb-4" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
              {profile?.profilePhotoUrl ? (
                <img src={`${import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"}${profile.profilePhotoUrl}?t=${Date.now()}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={64} className="text-white/20" />
                </div>
              )}
            </div>
            
            <div className="text-xs text-white/40 text-center mb-4">
              {profile?.profilePhotoUrl ? '🔒 Verified via Face Enrollment' : '⏳ Set up face verification'}
            </div>

            {/* User Badge */}
            <div className="mt-4 rounded-lg p-3" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.2)'}}>
              <div className="text-xs text-white/40 mb-1">Anonymous Alias</div>
              <div className="syne font-bold text-sm" style={{color:'#93C5FD'}}>{profile?.anonymousAlias}</div>
              <div className="text-xs text-white/30 mt-2">Your unique anonymous identifier</div>
            </div>

            {/* Face Enrollment Section */}
            <div className="rounded-lg p-3" style={{background: faceEnrolled ? 'rgba(15,181,40,0.1)' : 'rgba(251,146,60,0.1)', border: `1px solid ${faceEnrolled ? 'rgba(15,181,40,0.2)' : 'rgba(251,146,60,0.2)'}`}}>
              <div className="flex items-center gap-2 mb-2">
                {faceEnrolled ? (
                  <CheckCircle size={16} style={{color:'#0fb528'}} />
                ) : (
                  <AlertCircle size={16} style={{color:'#fca5a5'}} />
                )}
                <div className="text-xs font-semibold" style={{color: faceEnrolled ? '#0fb528' : '#fca5a5'}}>
                  {faceEnrolled ? 'Profile Picture Verified' : 'Set Profile Picture'}
                </div>
              </div>
              <p className="text-xs text-white/40 mb-3">
                {faceEnrolled ? '✓ Your face photo is your profile picture. Only you and admins can see it.' : 'Upload a face photo to set your profile picture. Only you and admins can view it.'}
              </p>
              {!faceEnrolled && (
                <button
                  onClick={() => setShowFaceEnroll(!showFaceEnroll)}
                  className="w-full px-3 py-2 rounded text-xs font-semibold transition-all"
                  style={{background:'rgba(251,146,60,0.2)',color:'#fed7aa',border:'1px solid rgba(251,146,60,0.3)'}}
                >
                  {showFaceEnroll ? '← Cancel' : '→ Upload Face Photo'}
                </button>
              )}
            </div>
            </div>
          )}
          
          {/* Profile Information */}
          <div className={`space-y-4 ${isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {/* First Name */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => updateForm('firstName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
              ) : (
                <div className="text-white/70">{profile?.firstName}</div>
              )}
            </div>

            {/* Last Name */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => updateForm('lastName', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
              ) : (
                <div className="text-white/70">{profile?.lastName}</div>
              )}
            </div>

            {/* Email */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">Email</label>
              <div className="text-white/70">{profile?.email}</div>
              <div className="text-xs text-white/30 mt-2">
                {profile?.emailVerified ? '✓ Verified' : '⚠ Not verified'}
              </div>
            </div>

            {/* Phone */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
              ) : (
                <div className="text-white/70">{profile?.phone}</div>
              )}
            </div>

            {/* County */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">County</label>
              <div className="text-white/70">{profile?.county}</div>
            </div>

            {/* Bio */}
            <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <label className="block text-sm font-semibold mb-2">About You</label>
              {isEditing ? (
                <textarea
                  value={form.bio}
                  onChange={e => updateForm('bio', e.target.value)}
                  placeholder="Tell us a bit about yourself (optional)"
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
              ) : (
                <div className="text-white/70">{form.bio || 'No bio added yet'}</div>
              )}
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="syne font-bold text-lg">{profile?.totalReports || 0}</div>
                <div className="text-white/35 text-xs">Reports Submitted</div>
              </div>
              <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="syne font-bold text-lg" style={{color:'#34D399'}}>KSh {profile?.totalDonated || 0}</div>
                <div className="text-white/35 text-xs">Donated</div>
              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                style={{background:'#BB0000',color:'white'}}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 pt-8" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            style={{background:'rgba(220,38,38,0.15)',color:'#fca5a5',border:'1px solid rgba(220,38,38,0.3)'}}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Face Enrollment Modal */}
        {showFaceEnroll && !faceEnrolled && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-black rounded-2xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto" style={{border:'1px solid rgba(255,255,255,0.1)'}}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="syne font-bold text-xl">Face Verification</h2>
                <button onClick={() => setShowFaceEnroll(false)} className="text-white/40 hover:text-white/60 text-2xl">×</button>
              </div>
              
              <p className="text-white/50 text-sm mb-6">
                Take a clear selfie so admins can verify you're a real person. This prevents fraud and duplicate accounts.
              </p>

              <SimpleFaceEnroll 
                onEnroll={handleFaceEnroll}
              />

              {enrollingFace && (
                <div className="mt-4 text-center">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                  </div>
                  <p className="text-white/60 text-sm mt-2">Processing...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
