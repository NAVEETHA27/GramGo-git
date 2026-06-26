import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { motion } from 'framer-motion';
import {
  FiUsers, FiTruck, FiDollarSign, FiAlertCircle,
  FiCheckCircle, FiXCircle, FiRefreshCw, FiList,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const STAT_CONFIG = [
  { label: 'Total Renters',       key: 'totalUsers',        icon: FiUsers,        color: 'text-teal-600 bg-teal-50   border-teal-100'   },
  { label: 'Fleet Owners',        key: 'totalOrganizers',   icon: FiTruck,         color: 'text-violet-600 bg-violet-50 border-violet-100' },
  { label: 'Total Vehicles',      key: 'totalVehicles',     icon: MdDirectionsCar, color: 'text-blue-600 bg-blue-50   border-blue-100'   },
  { label: 'Pending Approvals',   key: 'pendingApprovals',  icon: FiAlertCircle,  color: 'text-amber-600 bg-amber-50  border-amber-100'  },
  { label: 'Total Revenue',       key: 'totalRevenue',      icon: FiDollarSign,   color: 'text-green-600 bg-green-50  border-green-100'  },
  { label: 'Refund Requests',     key: 'refundRequests',    icon: FiRefreshCw,    color: 'text-rose-600 bg-rose-50    border-rose-100'   },
  { label: 'Active Listings',     key: 'activeListings',    icon: FiCheckCircle,  color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { label: 'Cancelled Listings',  key: 'cancelledListings', icon: FiXCircle,      color: 'text-red-600 bg-red-50      border-red-100'    },
];

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then((r) => setStats(r.data?.data ?? {}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600 mb-1">Administration</p>
          <h1 className="text-3xl font-extrabold text-slate-950" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            GramGo Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">Platform overview — renters, fleet owners, listings, and revenue.</p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STAT_CONFIG.map(({ label, key, icon: Icon, color }, i) => (
            <motion.div
              key={key}
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl border ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-extrabold text-slate-950" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-slate-200" />
                ) : (
                  key === 'totalRevenue'
                    ? `Rs.${Number(stats?.[key] ?? 0).toLocaleString()}`
                    : String(stats?.[key] ?? 0)
                )}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-base font-bold text-slate-950">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Pending Approvals', href: '/admin/approvals', icon: FiAlertCircle },
              { label: 'All Listings',      href: '/admin/approvals', icon: MdDirectionsCar },
              { label: 'Refund Queue',      href: '/admin/approvals', icon: FiRefreshCw },
              { label: 'Audit Logs',        href: '/admin/approvals', icon: FiList },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

