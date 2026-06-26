import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiMail } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [role, setRole]       = useState('USER');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.sendOtp({ email, role });
      setSent(true);
      toast.success('OTP sent to your email!');
      navigate(
        `/reset-password?email=${encodeURIComponent(email)}&role=${role}&otp=true`
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F6F8FB' }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden border border-teal-100">
        {/* Top gradient bar */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,#0F766E,#D32F2F)' }} />

        <div className="p-8">
          {sent ? (
            /* ── Success state ──────────────────────────────── */
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="text-gray-500 text-sm">
                We sent a 6-digit OTP to <strong>{email}</strong>.
                Use it on the next screen to reset your password.
              </p>
              <Link to="/login" className="btn-primary inline-block mt-4">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ─────────────────────────────────── */
            <>
              {/* Logo + heading */}
              <div className="text-center mb-7">
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
                  style={{ background: 'linear-gradient(135deg,#0F766E,#D32F2F)' }}
                >
                  <MdDirectionsCar className="text-white w-7 h-7" />
                </div>
                <h1
                  className="text-2xl font-extrabold text-slate-900"
                  style={{ fontFamily: 'Space Grotesk,sans-serif' }}
                >
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email to receive a password reset OTP
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Role toggle — Vehicle Rental labels */}
                <div className="flex p-1 rounded-xl bg-teal-50 border border-teal-100">
                  {[
                    { value: 'USER',      label: '🚗 Renter'      },
                    { value: 'ORGANIZER', label: '🔑 Fleet Owner'  },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                      style={{
                        background:
                          role === value
                            ? 'linear-gradient(135deg,#0F766E,#14B8A6)'
                            : 'transparent',
                        color: role === value ? '#fff' : '#546E7A',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Email field */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      required
                      placeholder="your@email.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-bold disabled:opacity-50"
                >
                  {loading ? 'Sending OTP…' : 'Send OTP to Email'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-5">
                <Link to="/login" className="text-teal-600 font-medium hover:underline">
                  ← Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
