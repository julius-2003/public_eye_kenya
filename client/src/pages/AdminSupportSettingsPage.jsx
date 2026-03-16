import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Settings } from 'lucide-react';
import AppShell from '../components/shared/AppShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminSupportSettingsPage() {
  const { user: me } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState({});

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/admin/support/settings`),
        axios.get(`${API}/admin/support/summary`)
      ]);
      setSettings(settingsRes.data.settings);
      setSummary(summaryRes.data);
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/support/settings`, settings);
      toast.success('Support settings updated!');
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Settings size={24} className="text-blue-400" />
            <h1 className="syne font-extrabold text-2xl">Support Payment Settings</h1>
          </div>
          <p className="text-white/40">
            {me.role === 'superadmin' ? 'Manage global support payment configuration' : 'Manage support payment for your county'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Settings Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Feature Toggle */}
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold">Support Feature Status</label>
                  <button
                    onClick={() => updateSetting('supportPaymentEnabled', !settings.supportPaymentEnabled)}
                    className="px-4 py-2 rounded-lg font-semibold transition-all"
                    style={{
                      background: settings.supportPaymentEnabled ? 'rgba(15,181,40,0.2)' : 'rgba(220,38,38,0.2)',
                      border: `1px solid ${settings.supportPaymentEnabled ? 'rgba(15,181,40,0.4)' : 'rgba(220,38,38,0.4)'}`,
                      color: settings.supportPaymentEnabled ? '#0fb528' : '#fca5a5'
                    }}
                  >
                    {settings.supportPaymentEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </button>
                </div>
                <p className="text-xs text-white/40">Toggle support/donation feature on or off for your users</p>
              </div>

              {/* Support Payment Name */}
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <label className="block text-sm font-semibold mb-2">Support Feature Name</label>
                <input
                  type="text"
                  value={settings.supportPaymentName || ''}
                  onChange={e => updateSetting('supportPaymentName', e.target.value)}
                  placeholder="e.g., Support PublicEye, Help Us, Donate"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
                <p className="text-xs text-white/40 mt-2">This is the name shown to users for the support/donation feature</p>
              </div>

              {/* Till Number */}
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <label className="block text-sm font-semibold mb-2">Till Number (M-Pesa)</label>
                <input
                  type="text"
                  value={settings.tillNumber || ''}
                  onChange={e => updateSetting('tillNumber', e.target.value)}
                  placeholder="e.g., 123456"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
                <p className="text-xs text-white/40 mt-2">Your M-Pesa till number for receiving payments</p>
              </div>

              {/* Pochi Company Name */}
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <label className="block text-sm font-semibold mb-2">Pochi Company Name</label>
                <input
                  type="text"
                  value={settings.pochiCompanyName || ''}
                  onChange={e => updateSetting('pochiCompanyName', e.target.value)}
                  placeholder="e.g., PublicEye Kenya"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
                <p className="text-xs text-white/40 mt-2">Name displayed for USSD/Pochi la biashara payments</p>
              </div>

              {/* Pochi Phone Number */}
              <div className="rounded-xl p-6" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <label className="block text-sm font-semibold mb-2">Pochi Phone Number</label>
                <input
                  type="text"
                  value={settings.pochiPhoneNumber || ''}
                  onChange={e => updateSetting('pochiPhoneNumber', e.target.value)}
                  placeholder="e.g., +254700000000"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}
                />
                <p className="text-xs text-white/40 mt-2">Phone number for USSD/Pochi la biashara</p>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:scale-105"
                style={{background:'#BB0000',color:'white'}}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Summary Panel */}
            <div className="space-y-4">
              {/* Total Donations */}
              <div className="rounded-xl p-6" style={{background:'rgba(15,181,40,0.15)',border:'1px solid rgba(15,181,40,0.3)'}}>
                <div className="text-xs text-white/40 mb-1">Total Donations</div>
                <div className="syne font-extrabold text-2xl" style={{color:'#0fb528'}}>
                  KSh {summary.totalDonations?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-white/40 mt-2">{summary.donationCount || 0} transactions</div>
              </div>

              {/* Recent Donations */}
              <div className="rounded-xl p-6 max-h-96 overflow-y-auto" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div className="text-xs font-semibold mb-3 text-white/40">RECENT DONATIONS</div>
                {summary.recentPayments?.length ? (
                  <div className="space-y-2">
                    {summary.recentPayments.map(p => (
                      <div key={p._id} className="text-xs pb-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold">{p.userId?.anonymousAlias || 'Anonymous'}</div>
                          <div style={{color:'#0fb528'}}>KSh {p.amount}</div>
                        </div>
                        <div className="text-white/30 text-xs">{p.userId?.county || 'N/A'}</div>
                        <div className="text-white/20 text-xs mt-1">
                          {new Date(p.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-center py-6">No donations yet</p>
                )}
              </div>

              {/* Info Box */}
              <div className="rounded-xl p-4 text-xs" style={{background:'rgba(59,130,246,0.1)',border:'1px solid rgba(59,130,246,0.3)',color:'#93C5FD'}}>
                <div className="font-semibold mb-2">📌 Settings Note</div>
                <p>These settings control the support payment feature shown to citizens. Only you (as {me.role === 'superadmin' ? 'Super Admin' : 'County Admin'}) and {me.role === 'superadmin' ? 'county admins' : 'super admin'} can see donation totals.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
