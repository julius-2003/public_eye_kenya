import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { PaymentProvider } from './context/PaymentContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import SupportWidget from './components/support/SupportWidget.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import HeatmapPage from './pages/HeatmapPage.jsx';
import ScoreboardPage from './pages/ScoreboardPage.jsx';
import TaskForcePage from './pages/TaskForcePage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
import AdminCountyApprovalsPage from './pages/AdminCountyApprovalsPage.jsx';
import AdminSupportSettingsPage from './pages/AdminSupportSettingsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminProfilePage from './pages/AdminProfilePage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import AdminAnnouncementsPage from './pages/AdminAnnouncementsPage.jsx';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!['countyadmin', 'superadmin'].includes(user.role)) return <Navigate to="/dashboard" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/admin" />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'superadmin') return <Navigate to="/dashboard" />;
  return children;
};

function AppInner() {
  const { user, token } = useAuth();
  return (
    <NotificationProvider token={token} user={user}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Forgot password and verify email disabled */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/report" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/heatmap" element={<PrivateRoute><HeatmapPage /></PrivateRoute>} />
        <Route path="/scoreboard" element={<PrivateRoute><ScoreboardPage /></PrivateRoute>} />
        <Route path="/taskforce" element={<PrivateRoute><TaskForcePage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/announcements" element={<PrivateRoute><AnnouncementsPage /></PrivateRoute>} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/admin" element={<AdminRoute><AdminOverviewPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/users/:id/profile" element={<AdminRoute><AdminProfilePage /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
        <Route path="/admin/counties" element={<SuperAdminRoute><AdminOverviewPage /></SuperAdminRoute>} />
        <Route path="/admin/admins" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
        <Route path="/admin/county-admins/pending" element={<SuperAdminRoute><AdminCountyApprovalsPage /></SuperAdminRoute>} />
        <Route path="/admin/support-settings" element={<AdminRoute><AdminSupportSettingsPage /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <SupportWidget />}
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a1a', color: 'white', border: '1px solid #333' } }} />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <AppInner />
      </PaymentProvider>
    </AuthProvider>
  );
}
