import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { authAPI } from '../../services/api';
import { useAdminAuth } from './AdminPortal';

export default function AdminLogin() {
  const { login }             = useAdminAuth();
  const [email, setEmail]     = useState('');
  const [pw, setPw]           = useState('');
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res     = await authAPI.adminLogin({ email: email.trim().toLowerCase(), password: pw });
      const payload = res.data?.data;

      console.log('[AdminLogin] API response payload:', payload);

      if (!payload?.accessToken) {
        throw new Error('No access token received. Check backend response.');
      }
      if (!payload?.user) {
        throw new Error('No user info in response.');
      }
      if (payload.user?.role !== 'ADMIN') {
        setError('Access denied — this account does not have admin privileges.');
        return;
      }

      // Store token + user in AdminAuthContext (which also writes localStorage)
      login(payload);

      console.log('[AdminLogin] ✅ Login successful — navigating to /admin/dashboard');

      // Hard navigate — clears any React Router state and forces a fresh page load
      // This ensures AdminPageRouter re-reads localStorage with the new token
      window.location.href = '/admin/dashboard';

    } catch (err) {
      console.error('[AdminLogin] Error:', err);
      const msg = err?.response?.data?.message || err.message || 'Login failed. Please try again.';
      if (
        msg.toLowerCase().includes('not an admin') ||
        msg.toLowerCase().includes('access denied') ||
        msg.toLowerCase().includes('invalid email or password')
      ) {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background dots */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #14B8A6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Card */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/90 backdrop-blur-sm p-8 shadow-2xl">
          {/* Gradient top bar */}
          <div
            className="h-0.5 -mx-8 -mt-8 mb-8 rounded-t-2xl"
            style={{
              background: 'linear-gradient(90deg,#0F766E,#14B8A6,#0F766E)',
              backgroundSize: '200% 100%',
            }}
          />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/20 border border-teal-500/30">
              <FiShield className="h-7 w-7 text-teal-400" />
            </div>
            <h1
              className="text-xl font-extrabold text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              GramGo Admin
            </h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to the control panel</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@gramgo.com"
                  className="w-full rounded-xl bg-slate-700/60 border border-slate-600/60 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-700/60 border border-slate-600/60 pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {show ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02 }}
              whileTap={loading ? {} : { scale: 0.97 }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{
                background: loading
                  ? 'rgba(15,118,110,0.5)'
                  : 'linear-gradient(135deg,#0F766E,#14B8A6)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(15,118,110,0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                    className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in…
                </span>
              ) : (
                'Sign In to Admin Panel'
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Restricted to authorized administrators only.
            <br />
            Unauthorized access attempts are logged.
          </p>
        </div>

        {/* Back link */}
        <p className="mt-4 text-center text-xs text-slate-500">
          <a href="/" className="hover:text-teal-400 transition-colors">
            ← Return to public website
          </a>
        </p>
      </motion.div>
    </div>
  );
}
