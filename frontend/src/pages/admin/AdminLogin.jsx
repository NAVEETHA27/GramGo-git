import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff,
  FiShield, FiAlertCircle, FiArrowRight,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';
import { authAPI } from '../../services/api';
import { useAdminAuth } from './AdminPortal';

/* ─── tiny helpers ─────────────────────────────────────── */
function parseError(err) {
  console.error('[AdminLogin] Error:', err);
  if (err?.response) {
    // Server responded with a non-2xx status
    const msg = err.response.data?.message || err.response.data?.error;
    if (msg) return msg;
    return `Login failed (${err.response.status})`;
  }
  if (err?.request) {
    // Request was sent but no response received
    return 'Cannot connect to server. Please check your internet connection or try again later.';
  }
  // Something else
  return err?.message || 'An unexpected error occurred.';
}

export default function AdminLogin() {
  const { login }               = useAdminAuth();
  const [email, setEmail]       = useState('');
  const [pw, setPw]             = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      console.log('[AdminLogin] Attempting login for:', normalizedEmail);
      console.log('[AdminLogin] API base URL:', import.meta.env.VITE_API_BASE_URL || '(proxy /api)');

      const res = await authAPI.adminLogin({
        email:    normalizedEmail,
        password: pw,
      });

      console.log('[AdminLogin] Response status:', res.status);
      console.log('[AdminLogin] Response data:', res.data);

      const payload = res.data?.data;

      if (!payload?.accessToken) {
        setError('Server returned an unexpected response. Please try again.');
        return;
      }
      if (!payload?.user) {
        setError('User data missing from server response.');
        return;
      }
      if (payload.user?.role !== 'ADMIN') {
        setError('Access denied — this account does not have admin privileges.');
        return;
      }

      console.log('[AdminLogin] ✅ Login successful:', payload.user.email);

      // Persist token + user in AdminAuthContext (writes to localStorage)
      login(payload);

      if (remember) {
        localStorage.setItem('eb_admin_remember', '1');
      }

      // Hard navigate so AdminPageRouter re-reads localStorage fresh
      window.location.href = '/admin/dashboard';

    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-900 overflow-hidden">

      {/* ── Left panel — brand / illustration ─────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#134e4a 55%,#0f766e 100%)' }}
      >
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,#14B8A6 1px,transparent 1px)', backgroundSize: '36px 36px' }}
          />
          <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full bg-teal-400/10 blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/30">
            <MdDirectionsCar className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <p className="text-base font-extrabold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
              GramGo
            </p>
            <p className="text-[9px] font-bold tracking-[0.22em] uppercase text-teal-300">
              Rent · Ride · Return
            </p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-300">
            <FiShield className="h-3.5 w-3.5" />
            Admin Control Panel
          </div>

          <h1
            className="text-4xl xl:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: 'Space Grotesk,sans-serif' }}
          >
            Manage the<br />
            <span className="text-teal-300">entire platform</span><br />
            from one place.
          </h1>

          <p className="max-w-sm text-slate-300 text-sm leading-relaxed">
            Approve vehicles, monitor renters and fleet owners,
            track bookings, view revenue, and keep the platform running.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              'Vehicle moderation & approval workflow',
              'Fleet owner & renter management',
              'Real-time booking analytics',
              'Platform-wide activity audit logs',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                  <FiArrowRight className="h-2.5 w-2.5" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs text-slate-500">
          Restricted access · All actions are logged · GramGo © {new Date().getFullYear()}
        </p>
      </div>

      {/* ── Right panel — login form ───────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600">
              <FiShield className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>GramGo Admin</p>
              <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Control Panel</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-2xl font-extrabold text-white"
              style={{ fontFamily: 'Space Grotesk,sans-serif' }}
            >
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to your admin account</p>
          </div>

          {/* Error banner */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="mb-5 flex items-start gap-3 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"
              >
                <FiAlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                <p className="text-sm text-red-400 leading-relaxed">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@gramgo.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/70 pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 accent-teal-500"
              />
              <span className="text-sm text-slate-400">Remember me</span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02 }}
              whileTap={loading ? {} : { scale: 0.97 }}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg,#0f766e,#14b8a6)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(15,118,110,0.35)',
              }}
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Default Credentials</p>
            <p className="text-xs text-slate-400">Email: <span className="font-mono text-teal-400">admin@gramgo.com</span></p>
            <p className="text-xs text-slate-400 mt-0.5">Password: <span className="font-mono text-teal-400">Admin@GramGo1</span></p>
          </div>

          {/* Back to public site */}
          <p className="mt-5 text-center text-xs text-slate-600">
            <a href="/" className="hover:text-teal-400 transition-colors">
              ← Return to public website
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
