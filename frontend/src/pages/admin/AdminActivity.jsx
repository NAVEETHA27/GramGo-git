import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  FiActivity, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiCheckCircle, FiXCircle, FiUser, FiShield, FiInfo,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const ACTION_CONFIG = {
  VEHICLE_APPROVED:    { icon: FiCheckCircle,  color: 'text-green-500 bg-green-50',   label: 'Vehicle Approved'   },
  VEHICLE_REJECTED:    { icon: FiXCircle,      color: 'text-red-500 bg-red-50',       label: 'Vehicle Rejected'   },
  VEHICLE_CANCELLED:   { icon: FiXCircle,      color: 'text-orange-500 bg-orange-50', label: 'Listing Cancelled'  },
  VEHICLE_PUBLISHED:   { icon: MdDirectionsCar,color: 'text-blue-500 bg-blue-50',     label: 'Vehicle Published'  },
  VEHICLE_CREATED:     { icon: MdDirectionsCar,color: 'text-teal-500 bg-teal-50',     label: 'Vehicle Listed'     },
  RENTAL_RESERVED:     { icon: FiActivity,     color: 'text-violet-500 bg-violet-50', label: 'Rental Reserved'    },
  RENTAL_CANCELLED:    { icon: FiXCircle,      color: 'text-rose-500 bg-rose-50',     label: 'Rental Cancelled'   },
  PAYMENT_SUCCESSFUL:  { icon: FiCheckCircle,  color: 'text-emerald-500 bg-emerald-50', label: 'Payment Successful' },
  ADMIN_APPROVAL_APPROVE:       { icon: FiCheckCircle, color: 'text-green-500 bg-green-50',  label: 'Admin Approved' },
  ADMIN_APPROVAL_REJECT:        { icon: FiXCircle,     color: 'text-red-500 bg-red-50',      label: 'Admin Rejected' },
  DEFAULT:             { icon: FiInfo,         color: 'text-slate-500 bg-slate-100',  label: 'Action'             },
};

function getActionConfig(action) {
  return ACTION_CONFIG[action] ?? ACTION_CONFIG.DEFAULT;
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminActivity() {
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(0);
  const [filter, setFilter]     = useState('ALL');
  const SIZE = 20;

  const FILTER_OPTIONS = [
    { label: 'All',       value: 'ALL' },
    { label: 'Vehicles',  value: 'VEHICLE' },
    { label: 'Rentals',   value: 'RENTAL' },
    { label: 'Payments',  value: 'PAYMENT' },
    { label: 'Admin',     value: 'ADMIN' },
  ];

  const load = () => {
    setLoading(true);
    adminAPI.activity({ page, size: SIZE })
      .then(res => {
        const data = res.data?.data;
        const content = data?.content ?? (Array.isArray(data) ? data : []);
        setLogs(content);
        setTotal(data?.totalElements ?? content.length);
        setTotalPages(data?.totalPages ?? 1);
      }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const filtered = filter === 'ALL'
    ? logs
    : logs.filter(log => log.action?.toUpperCase().includes(filter));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-400 mb-0.5">Audit</p>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Activity Log
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{total.toLocaleString()} events recorded</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto">
          <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-50" />
                </div>
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <FiActivity className="h-10 w-10 mb-3 text-slate-200" />
            <p className="font-semibold">No activity logs found</p>
            <p className="text-xs mt-1">Admin actions will appear here as they happen.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((log, i) => {
              const cfg = getActionConfig(log.action);
              const Icon = cfg.icon;
              const [iconColor, iconBg] = cfg.color.split(' ');
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Icon */}
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{cfg.label}</span>
                      {log.targetType && (
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          {log.targetType}
                          {log.targetId ? ` #${log.targetId}` : ''}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{log.details}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      {log.actorType && (
                        <span className="flex items-center gap-1">
                          {log.actorType === 'ADMIN' ? <FiShield className="h-3 w-3" /> : <FiUser className="h-3 w-3" />}
                          {log.actorType}
                          {log.actorId ? ` #${log.actorId}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <time className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap" title={log.createdAt}>
                    {timeAgo(log.createdAt)}
                  </time>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all">
                <FiChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all">
                Next <FiChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
