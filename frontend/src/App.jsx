import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Vehicles from './pages/Vehicles';
import VehicleDetail from './pages/VehicleDetail';
import HelpCenter from './pages/HelpCenter';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OtpVerify from './pages/auth/OtpVerify';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import UserDashboard from './pages/user/Dashboard';
import MyBookings from './pages/user/MyBookings';
import BookingDetail from './pages/user/BookingDetail';
import PaymentCheckout from './pages/user/PaymentCheckout';
import PaymentHistory from './pages/user/PaymentHistory';
import RefundTracking from './pages/user/RefundTracking';
import QueueStatus from './pages/user/QueueStatus';
import Notifications from './pages/user/Notifications';
import UserProfile from './pages/user/Profile';
import OrganizerDashboard from './pages/organizer/Dashboard';
import OrganizerVehicles from './pages/organizer/MyVehicles';
import CreateVehicle from './pages/organizer/CreateVehicle';
import EditVehicle from './pages/organizer/EditVehicle';
import Attendees from './pages/organizer/Attendees';
import OrganizerProfile from './pages/organizer/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminApprovals from './pages/admin/Approvals';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Access denied</h1>
        <p className="mt-3 text-sm text-slate-500">Your account does not have permission to open this portal.</p>
      </div>
    </div>
  );
}

function roleHome(role) {
  if (role === 'ADMIN') return '/admin/dashboard';
  if (role === 'ORGANIZER') return '/organizer/dashboard';
  return '/dashboard';
}

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles?.length && !roles.includes(user.role)) return <AccessDenied />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/verify-otp/user" element={<OtpVerify defaultRole="user" />} />
      <Route path="/verify-otp/organizer" element={<OtpVerify defaultRole="organizer" />} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<Vehicles />} />
        <Route path="/events/:id" element={<VehicleDetail />} />
        <Route path="/help" element={<HelpCenter />} />

        <Route path="/dashboard" element={<ProtectedRoute roles={['USER']}><UserDashboard /></ProtectedRoute>} />
        <Route path="/user/*" element={<ProtectedRoute roles={['USER']}><UserDashboard /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute roles={['USER']}><MyBookings /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute roles={['USER']}><BookingDetail /></ProtectedRoute>} />
        <Route path="/checkout/:bookingId" element={<ProtectedRoute roles={['USER']}><PaymentCheckout /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={['USER']}><PaymentHistory /></ProtectedRoute>} />
        <Route path="/refunds" element={<ProtectedRoute roles={['USER']}><RefundTracking /></ProtectedRoute>} />
        <Route path="/queue" element={<ProtectedRoute roles={['USER']}><QueueStatus /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute roles={['USER', 'ORGANIZER', 'ADMIN']}><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['USER']}><UserProfile /></ProtectedRoute>} />

        <Route path="/organizer/dashboard" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/organizer/events" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerVehicles /></ProtectedRoute>} />
        <Route path="/organizer/events/create" element={<ProtectedRoute roles={['ORGANIZER']}><CreateVehicle /></ProtectedRoute>} />
        <Route path="/organizer/events/:id/edit" element={<ProtectedRoute roles={['ORGANIZER']}><EditVehicle /></ProtectedRoute>} />
        <Route path="/organizer/attendees" element={<ProtectedRoute roles={['ORGANIZER']}><Attendees /></ProtectedRoute>} />
        <Route path="/organizer/profile" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerProfile /></ProtectedRoute>} />
        <Route path="/organizer/*" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerDashboard /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute roles={['ADMIN']}><AdminApprovals /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

