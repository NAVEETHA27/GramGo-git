import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  FiUsers, FiTruck, FiAlertCircle, FiCheckCircle, FiXCircle,
  FiDollarSign, FiShoppingBag, FiArrowRight, FiUser,
  FiActivity, FiCheck, FiX, FiRefreshCw,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

/* ─── stat card config ─────────────────────────────────────── */
const STATS = [
  { label: 'Total Renters',     key: 'totalUsers',       icon: FiUser,         grad: 'from-blue-600 to-blue-400',    soft: 'bg-blue-50   text-blue-600',   link: '/admin/renters'     },
  { label: 'Fleet Owners',      key: 'totalOrganizers',  icon: FiUsers,        grad: 'from-violet-600 to-violet-400',soft: 'bg-violet-50 text-violet-600', link: '/admin/organizers'  },
  { label: 'Pending Approvals', key: 'pendingApprovals', icon: FiAlertCircle,  grad: 'from-amber-500 to-yellow-400', soft: 'bg-amber-50  text-amber-600',  link: '/admin/vehicles'    },
  { label: 'Approved Vehicles', key: 'approvedVehicles', icon: FiCheckCircle,  grad: 'from-emerald-600 to-teal-400', soft: 'bg-emerald-50 text-emerald-600',link: '/admin/vehicles'    },
  { label: 'Rejected Vehicles', key: 'rejectedVehicles', icon: FiXCircle,      grad: 'from-red-600 to-rose-400',     soft: 'bg-red-50    text-red-600',    link: '/admin/vehicles'    },
  { label: 'Total Vehicles',    key: 'totalVehicles',    icon: MdDirectionsCar,grad: 'from-teal-600 to-cyan-400',    soft: 'bg-teal-50   text-teal-600',   link: '/admin/vehicles'    },
  { label: 'Active Bookings',   key: 'activeBookings',   icon: FiShoppingBag,  grad: 'from-cyan-600 to-sky-400',     soft: 'bg-cyan-50   text-cyan-600',   link: null                 },
  { label: 'Total Revenue',     key: 'totalRevenue',     icon: FiDollarSign,   grad: 'from-green-600 to-emerald-400',soft: 'bg-green-50  text-green-600',  link: null                 },
];

/* ─── quick link config ────────────────────────────────────── */
const QUICK = [
  { label: 'Pending Vehicles',  to: '/admin/vehicles',   icon: FiAlertCircle,  color: 'text-amber-500',   bg: 'bg-amber-50'   },
  { label: 'All Fleet Owners',  to: '/admin/organizers', icon: FiUsers,        color: 'text-violet-500',  bg: 'bg-violet-50'  },
  { label: 'All Renters',       to: '/admin/renters',    icon: FiUser,         color: 'text-blue-500',    bg: 'bg-blue-50'    },
  { label: 'Activity Log',      to: '/admin/activity',   icon: FiActivity,     color: 'text-teal-600',    bg: 'bg-teal-50'    },
];

const CHART_COLORS = { green: '#10B981', amber: '#F59E0B', red: '#EF4444', cyan: '#06B6D4', teal: '#14B8A6', gray: '#94A3B8' };

/* ─── animated stat card ───────────────────────────────────── */
function StatCard({ label, key: k, icon: Icon, soft, link, value, loading, index }) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 12px 30px rgba(15,23,42,0.10)' }}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm cursor-default transition-all"
    >
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${soft}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
          {loading
            ? <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100" />
            : k === 'totalRevenue'
              ? `₹${Number(value ?? 0).toLocaleString('en-IN')}`
              : Number(value ?? 0).toLocaleString()
          }
        </div>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
  return link ? <Link key={k} to={link}>{card}</Link> : <div key={k}>{card}</div>;
}

/* ─── custom tooltip ───────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg text-sm">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ─── main component ───────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats,       setStats]       = useState(null);
  const [recentOrgs,  setRecentOrgs]  = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pending,     setPending]     = useState([]);
  const [recentAct,   setRecentAct]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshKey,  setRefreshKey]  = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminAPI.dashboard(),
      adminAPI.organizers({ page: 0, size: 5, sort: 'createdAt,desc' }),
      adminAPI.users(     { page: 0, size: 5, sort: 'createdAt,desc' }),
      adminAPI.pendingVehicles({ page: 0, size: 5 }),
      adminAPI.activity(  { page: 0, size: 6  }),
    ]).then(([d, o, u, p, a]) => {
      setStats(d.data?.data ?? {});
      setRecentOrgs( o.data?.data?.content ?? []);
      setRecentUsers(u.data?.data?.content ?? []);
      const pd = p.data?.data;
      setPending(pd?.content ?? (Array.isArray(pd) ? pd : []));
      const ad = a.data?.data;
      setRecentAct(ad?.content ?? (Array.isArray(ad) ? ad : []));
    }).catch(console.error).finally(() => setLoading(false));
  }, [refreshKey]);

  /* chart data */
  const approvalChart = [
    { name: 'Approved', value: Number(stats?.approvedVehicles ?? 0), fill: CHART_COLORS.green },
    { name: 'Pending',  value: Number(stats?.pendingApprovals ?? 0), fill: CHART_COLORS.amber },
    { name: 'Rejected', value: Number(stats?.rejectedVehicles ?? 0), fill: CHART_COLORS.red   },
  ];
  const bookingChart = [
    { name: 'Active',    value: Number(stats?.activeBookings    ?? 0), fill: CHART_COLORS.teal },
    { name: 'Completed', value: Number(stats?.completedBookings ?? 0), fill: CHART_COLORS.green },
    { name: 'Cancelled', value: Number(stats?.cancelledBookings ?? 0), fill: CHART_COLORS.gray  },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">

      {/* ── Hero header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#134e4a 60%,#0f766e 100%)' }}
      >
        {/* Background mesh */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(circle,#14B8A6 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-300 mb-1">Administration</p>
            <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
              Platform Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Overview of renters, fleet owners, vehicles, and bookings.
            </p>
          </div>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/20 transition-all self-start sm:self-auto"
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Stats grid ──────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, key, icon, soft, link }, i) => (
          <StatCard
            key={key}
            label={label}
            k={key}
            icon={icon}
            soft={soft}
            link={link}
            value={stats?.[key]}
            loading={loading}
            index={i}
          />
        ))}
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicle Approval */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-600">Vehicles</p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Approval Status</h3>
            </div>
            <Link to="/admin/vehicles" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              Manage <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={approvalChart} barCategoryGap="45%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[6,6,0,0]}>
                {approvalChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-600">Bookings</p>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Status Breakdown</h3>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={bookingChart} barCategoryGap="45%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" radius={[6,6,0,0]}>
                {bookingChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Quick actions ────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK.map(({ label, to, icon: Icon, color, bg }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 flex-1">{label}</span>
              <FiArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-500 transition-colors" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Bottom panels ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Pending approvals */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <FiAlertCircle className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Pending Approvals</h3>
            </div>
            <Link to="/admin/vehicles" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              Review <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3].map(i => <div key={i} className="h-14 px-5 py-3 animate-pulse bg-slate-50" />) :
             pending.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-400">
                <FiCheckCircle className="h-7 w-7 text-emerald-300 mb-2" />
                <p className="text-xs font-semibold">All caught up!</p>
              </div>
            ) : pending.map(ev => {
              const v = ev.event || ev;
              return (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 overflow-hidden">
                    {v.eventBanner
                      ? <img src={v.eventBanner} alt="" className="h-full w-full object-cover" />
                      : <MdDirectionsCar className="h-4 w-4 text-teal-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{v.eventName || '—'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{v.organizer?.organizerName || '—'}</p>
                  </div>
                  <span className="flex-shrink-0 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent fleet owners */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <FiUsers className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Fleet Owners</h3>
            </div>
            <Link to="/admin/organizers" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3].map(i => <div key={i} className="h-12 px-5 py-3 animate-pulse bg-slate-50" />) :
             recentOrgs.length === 0 ? <p className="px-5 py-6 text-center text-xs text-slate-400">No fleet owners yet.</p> :
             recentOrgs.map(org => (
              <div key={org.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-xs font-bold">
                  {org.organizerName?.charAt(0)?.toUpperCase() ?? 'O'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 truncate">{org.organizerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{org.organizationName}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  org.approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>{org.approved ? 'Active' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50">
                <FiActivity className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            </div>
            <Link to="/admin/activity" className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3,4].map(i => <div key={i} className="h-10 px-5 py-3 animate-pulse bg-slate-50" />) :
             recentAct.length === 0 ? <p className="px-5 py-6 text-center text-xs text-slate-400">No activity yet.</p> :
             recentAct.map(log => {
              const isApprove = log.action?.toUpperCase().includes('APPROVED');
              const isReject  = log.action?.toUpperCase().includes('REJECTED');
              return (
                <div key={log.id} className="flex items-center gap-2.5 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                    isApprove ? 'bg-green-50 text-green-500' :
                    isReject  ? 'bg-red-50 text-red-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {isApprove ? <FiCheck className="h-3.5 w-3.5" /> :
                     isReject  ? <FiX     className="h-3.5 w-3.5" /> :
                     <FiActivity className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate capitalize">
                      {(log.action || '').replace(/_/g, ' ').toLowerCase()}
                    </p>
                    {log.targetType && (
                      <p className="text-[10px] text-slate-400">{log.targetType} #{log.targetId}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
