/**
 * AdminPortal — self-contained admin application.
 *
 * Completely isolated from the public website:
 * - Has its own auth state (eb_admin_token / eb_admin_user in localStorage)
 * - Has its own sidebar layout
 * - Never shows the public Navbar / Footer / Header
 * - Only accessible via direct URL /admin or /admin/*
 *
 * ROUTING ARCHITECTURE:
 * App.jsx mounts AdminPortal at both:
 *   <Route path="/admin"   element={<AdminPortal />} />
 *   <Route path="/admin/*" element={<AdminPortal />} />
 *
 * AdminPortal reads window.location.pathname directly and renders
 * the correct page — no nested <Routes> needed, avoiding React Router
 * nested-route path-matching issues.
 */
import {
  useState, useEffect, useCallback,
  createContext, useContext,
} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

import AdminLogin      from './AdminLogin';
import AdminDashboard  from './AdminDashboard';
import AdminVehicles   from './AdminVehicles';
import AdminOrganizers from './AdminOrganizers';
import AdminRenters    from './AdminRenters';
import AdminActivity   from './AdminActivity';

import {
  FiHome, FiTruck, FiUsers, FiUser,
  FiLogOut, FiMenu, FiX, FiChevronRight,
  FiShield, FiActivity,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

// ─────────────────────────────────────────────────────────────────────
// Admin Auth Context
// ─────────────────────────────────────────────────────────────────────
const AdminAuthContext = createContext(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminPortal');
  return ctx;
}

function AdminAuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const token  = localStorage.getItem('eb_admin_token');
      const stored = localStorage.getItem('eb_admin_user');

      console.log('[AdminAuth] Hydrating — token:', token ? 'present' : 'absent');
      console.log('[AdminAuth] Hydrating — user:', stored);

      if (token && stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role === 'ADMIN') {
          setAdmin(parsed);
          console.log('[AdminAuth] ✅ Admin session restored:', parsed.email);
        } else {
          console.warn('[AdminAuth] ⚠️  Stored user is not ADMIN — clearing');
          localStorage.removeItem('eb_admin_token');
          localStorage.removeItem('eb_admin_user');
        }
      }
    } catch (err) {
      console.error('[AdminAuth] Hydration error:', err);
      localStorage.removeItem('eb_admin_token');
      localStorage.removeItem('eb_admin_user');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Called by AdminLogin after a successful POST /auth/admin/login.
   * authResponse = { accessToken, refreshToken, tokenType, expiresIn, user: {...} }
   */
  const login = useCallback((authResponse) => {
    const { accessToken, user: info } = authResponse;

    console.log('[AdminAuth] login() called — role:', info?.role);

    if (!accessToken) {
      throw new Error('No access token in response');
    }
    if (info?.role !== 'ADMIN') {
      throw new Error('Access denied: not an admin account');
    }

    // Store tokens — use ONLY eb_admin_token (separate from eb_token)
    localStorage.setItem('eb_admin_token', accessToken);
    localStorage.setItem('eb_admin_user', JSON.stringify(info));

    console.log('[AdminAuth] ✅ Token stored, setting admin state');
    setAdmin(info);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('eb_admin_token');
    localStorage.removeItem('eb_admin_user');
    setAdmin(null);
    console.log('[AdminAuth] Admin logged out');
    toast.info('Admin session ended.');
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',   icon: FiHome     },
  { to: '/admin/vehicles',   label: 'Vehicles',    icon: FiTruck    },
  { to: '/admin/organizers', label: 'Fleet Owners',icon: FiUsers    },
  { to: '/admin/renters',    label: 'Renters',     icon: FiUser     },
  { to: '/admin/activity',   label: 'Activity Log',icon: FiActivity },
];

function AdminSidebar({ open, onClose }) {
  const { admin, logout } = useAdminAuth();
  const navigate          = useNavigate();
  const { pathname }      = useLocation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform duration-300
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
              <FiShield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
                GramGo Admin
              </p>
              <p className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase">
                Control Panel
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Admin badge */}
        <div className="px-5 py-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600/20 text-teal-400 font-bold text-sm flex-shrink-0">
              {admin?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
                {active && <FiChevronRight className="ml-auto h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700/60">
          <button
            onClick={() => { logout(); navigate('/admin/login'); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
          >
            <FiLogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Layout wrapper (sidebar + topbar + page content)
// ─────────────────────────────────────────────────────────────────────
function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setSidebarOpen(false), [pathname]);

  const pageName = pathname
    .replace('/admin/', '')
    .replace('/admin', 'dashboard')
    .split('/')[0]
    .replace('-', ' ');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center gap-4 bg-white border-b border-slate-200 px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors lg:hidden"
          >
            <FiMenu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MdDirectionsCar className="h-4 w-4 text-teal-600" />
            <span className="font-semibold text-slate-900">GramGo</span>
            <span>/</span>
            <span className="capitalize font-medium">{pageName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Access Denied
// ─────────────────────────────────────────────────────────────────────
function AdminAccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <FiShield className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6">
          You do not have permission to access the admin portal.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-700 transition-colors"
        >
          Return to Public Site
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Page router (no nested <Routes> — uses pathname directly)
// ─────────────────────────────────────────────────────────────────────
function AdminPageRouter() {
  const { admin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Show spinner while localStorage is being read
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-teal-500" />
      </div>
    );
  }

  // ── NOT authenticated ──────────────────────────────────────────────
  if (!admin) {
    // Allow login and access-denied pages without auth
    if (pathname === '/admin/login' || pathname === '/admin' || pathname === '/admin/') {
      return <AdminLogin />;
    }
    if (pathname === '/admin/access-denied') {
      return <AdminAccessDenied />;
    }
    // Any other /admin/* path → redirect to login
    console.log('[AdminPortal] Not authenticated — redirecting to /admin/login');
    // Use window.location for a hard redirect to avoid React Router state issues
    if (pathname !== '/admin/login') {
      window.location.replace('/admin/login');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-teal-500" />
      </div>
    );
  }

  // ── Authenticated — role check ─────────────────────────────────────
  if (admin.role !== 'ADMIN') {
    return <AdminAccessDenied />;
  }

  // ── Authenticated — page routing ───────────────────────────────────
  // If on login page but already authenticated → go to dashboard
  if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/login') {
    window.location.replace('/admin/dashboard');
    return null;
  }

  if (pathname === '/admin/access-denied') return <AdminAccessDenied />;

  if (pathname === '/admin/dashboard')  return <AdminLayout><AdminDashboard /></AdminLayout>;
  if (pathname === '/admin/vehicles')   return <AdminLayout><AdminVehicles /></AdminLayout>;
  if (pathname === '/admin/organizers') return <AdminLayout><AdminOrganizers /></AdminLayout>;
  if (pathname === '/admin/renters')    return <AdminLayout><AdminRenters /></AdminLayout>;
  if (pathname === '/admin/activity')   return <AdminLayout><AdminActivity /></AdminLayout>;

  // Unknown /admin/* path → dashboard
  window.location.replace('/admin/dashboard');
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────
export default function AdminPortal() {
  return (
    <AdminAuthProvider>
      <AdminPageRouter />
    </AdminAuthProvider>
  );
}
