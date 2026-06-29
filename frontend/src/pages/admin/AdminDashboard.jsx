import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  FiUsers, FiTruck, FiAlertCircle, FiCheckCircle, FiXCircle,
  FiDollarSign, FiShoppingBag, FiArrowRight, FiUser,
  FiActivity, FiCheck, FiX,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const STAT_CONFIG = [
  { label: 'Total Renters',     key: 'totalUsers',       icon: FiUser,         color: 'bg-blue-50    text-blue-500    border-blue-100',    link: '/admin/renters'     },
  { label: 'Fleet Owners',      key: 'totalOrganizers',  icon: FiUsers,        color: 'bg-violet-50  text-violet-500  border-violet-100',  link: '/admin/organizers'  },
  { label: 'Pending Approvals', key: 'pendingApprovals', icon: FiAlertCircle,  color: 'bg-amber-50   text-amber-500   border-amber-100',   link: '/admin/vehicles'    },
  { label: 'Approved Vehicles', key: 'approvedVehicles', icon: FiCheckCircle,  color: 'bg-green-50   text-green-500   border-green-100',   link: '/admin/vehicles'    },
  { label: 'Rejected Vehicles', key: 'rejectedVehicles', icon: FiXCircle,      color: 'bg-red-50     text-red-500     border-red-100',     link: '/admin/vehicles'    },
  { label: 'Total Vehicles',    key: 'totalVehicles',    icon: MdDirectionsCar,color: 'bg-teal-50    text-teal-500    border-teal-100',    link: '/admin/vehicles'    },
  { label: 'Active Bookings',   key: 'activeBookings',   icon: FiShoppingBag,  color: 'bg-cyan-50    text-cyan-500    border-cyan-100',    link: null                 },
  { label: 'Total Revenue',     key: 'totalRevenue',     icon: FiDollarSign,   color: 'bg-emerald-50 text-emerald-500 border-emerald-100', link: null                 },
];

const QUICK_LINKS = [
  { label: 'Pending Vehicles',  to: '/admin/vehicles',    icon: FiAlertCircle,  color: 'text-amber-500'  },
  { label: 'All Fleet Owners',  to: '/admin/organizers',  icon: FiUsers,        color: 'text-violet-500' },
  { label: 'All Renters',       to: '/admin/renters',     icon: FiUser,         color: 'text-blue-500'   },
  { label: 'Activity Log',      to: '/admin/activity',    icon: FiActivity,     color: 'text-teal-500'   },
];

// Approval decision badge styling
const STATUS_BADGE = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:         'bg-green-50 text-green-700 border-green-200',
  REJECTED:         'bg-red-50 text-red-600 border-red-200',
};

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [recentOrgs,  setRecentOrgs]  = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [pending,     setPending]     = useState([]);
  const [recentAct,   setRecentAct]   = useState([]);

  useEffect(() => {
    Promise.all([
      adminAPI.dashboard(),
      adminAPI.organizers({ page: 0, size: 5, sort: 'createdAt,desc' }),
      adminAPI.users({ page: 0, size: 5, sort: 'createdAt,desc' }),
      adminAPI.pendingVehicles({ page: 0, size: 5 }),
      adminAPI.activity({ page: 0, size: 6 }),
    ]).then(([dashRes, orgRes, userRes, pendRes, actRes]) => {
      setStats(dashRes.data?.data ?? {});
      setRecentOrgs(orgRes.data?.data?.content ?? []);
      setRecentUsers(userRes.data?.data?.content ?? []);
      const pendData = pendRes.data?.data;
      setPending(pendData?.content ?? (Array.isArray(pendData) ? pendData : []));
      const actData = actRes.data?.data;
      setRecentAct(actData?.content ?? (Array.isArray(actData) ? actData : []));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Simple monthly chart data from stats
  const approvalChartData = [
    { name: 'Approved', value: Number(stats?.approvedVehicles ?? 0), fill: '#10B981' },
    { name: 'Pending',  value: Number(stats?.pendingApprovals ?? 0), fill: '#F59E0B' },
    { name: 'Rejected', value: Number(stats?.rejectedVehicles ?? 0), fill: '#EF4444' },
  ];

  const bookingChartData = [
    { name: 'Active',    value: Number(stats?.activeBookings    ?? 0), fill: '#06B6D4' },
    { name: 'Completed', value: Number(stats?.completedBookings ?? 0), fill: '#10B981' },
    { name: 'Cancelled', value: Number(stats?.cancelledBookings ?? 0), fill: '#6B7280' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} initial="initial" animate="animate">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-500 mb-1">Administration</p>
        <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Platform overview — renters, fleet owners, vehicles, and bookings.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CONFIG.map(({ label, key, icon: Icon, color, link }, i) => {
          const card = (
            <motion.div
              variants={fadeUp} initial="initial" animate="animate"
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-default"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
                {loading ? (
                  <div className="h-7 w-14 animate-pulse rounded bg-slate-100" />
                ) : key === 'totalRevenue' ? (
                  `₹${Number(stats?.[key] ?? 0).toLocaleString('en-IN')}`
                ) : (
                  Number(stats?.[key] ?? 0).toLocaleString()
                )}
              </div>
              <p className="mt-0.5 text-xs font-semibold text-slate-500">{label}</p>
            </motion.div>
          );
          return link
            ? <Link key={key} to={link}>{card}</Link>
            : <div key={key}>{card}</div>;
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vehicle Approval Status */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.35 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Vehicle Approval Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={approvalChartData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {approvalChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Booking Summary */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.4 }}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Booking Summary</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bookingChartData} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {bookingChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.45 }}>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map(({ label, to, icon: Icon, color }) => (
            <Link key={to} to={to}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 hover:bg-teal-50/40 transition-all group">
              <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
              <span className="text-sm font-semibold text-slate-700 group-hover:text-teal-700">{label}</span>
              <FiArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-teal-500 transition-all" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Bottom panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Vehicle Approvals */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.5 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FiAlertCircle className="h-4 w-4 text-amber-500" />
              Pending Approvals
            </h3>
            <Link to="/admin/vehicles" className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              Review all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3].map(i => (
              <div key={i} className="px-5 py-3 h-14 animate-pulse bg-slate-50" />
            )) : pending.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FiCheckCircle className="mx-auto mb-2 h-7 w-7 text-green-300" />
                <p className="text-xs text-slate-400">All caught up!</p>
              </div>
            ) : pending.map(ev => {
              const v = ev.event || ev;
              return (
                <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 overflow-hidden">
                    {v.eventBanner
                      ? <img src={v.eventBanner} alt="" className="h-full w-full object-cover" />
                      : <MdDirectionsCar className="h-4 w-4 text-teal-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{v.eventName || '—'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{v.organizer?.organizerName || '—'}</p>
                  </div>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200 flex-shrink-0">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Fleet Owners */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.55 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Fleet Owners</h3>
            <Link to="/admin/organizers" className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3].map(i => <div key={i} className="px-5 py-3 h-12 animate-pulse bg-slate-50" />)
              : recentOrgs.length === 0
              ? <p className="px-5 py-6 text-center text-xs text-slate-400">No fleet owners yet.</p>
              : recentOrgs.map(org => (
                <div key={org.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 text-xs font-bold">
                    {org.organizerName?.charAt(0)?.toUpperCase() ?? 'O'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 truncate">{org.organizerName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{org.organizationName}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold flex-shrink-0 ${
                    org.approved ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{org.approved ? 'Active' : 'Pending'}</span>
                </div>
              ))
            }
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} initial="initial" animate="animate" transition={{ delay: 0.6 }}
          className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FiActivity className="h-4 w-4 text-teal-500" />
              Recent Activity
            </h3>
            <Link to="/admin/activity" className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1">
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? [1,2,3,4].map(i => <div key={i} className="px-5 py-3 h-10 animate-pulse bg-slate-50" />)
              : recentAct.length === 0
              ? <p className="px-5 py-6 text-center text-xs text-slate-400">No activity yet.</p>
              : recentAct.map(log => (
                <div key={log.id} className="flex items-center gap-2.5 px-5 py-3">
                  <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs ${
                    log.action?.includes('APPROVED') ? 'bg-green-50 text-green-500' :
                    log.action?.includes('REJECTED') ? 'bg-red-50 text-red-500' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {log.action?.includes('APPROVED') ? <FiCheck className="h-3.5 w-3.5" /> :
                     log.action?.includes('REJECTED') ? <FiX className="h-3.5 w-3.5" /> :
                     <FiActivity className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {log.action?.replace(/_/g, ' ')?.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                    {log.targetType && (
                      <p className="text-[10px] text-slate-400">{log.targetType} #{log.targetId}</p>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
}
