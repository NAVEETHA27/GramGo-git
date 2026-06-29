import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiMail, FiPhone, FiMapPin,
} from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';

const STATUS_FILTER = ['ALL', 'ACTIVE', 'PENDING'];

export default function AdminOrganizers() {
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');
  const [page, setPage]         = useState(0);
  const SIZE = 12;

  const load = () => {
    setLoading(true);
    adminAPI.organizers({ page, size: SIZE, sort: 'createdAt,desc' })
      .then(res => {
        const data = res.data?.data;
        const content = data?.content ?? (Array.isArray(data) ? data : []);
        setRows(content);
        setTotal(data?.totalElements ?? content.length);
        setTotalPages(data?.totalPages ?? 1);
      }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const filtered = rows.filter(o => {
    const matchSearch = !search.trim() || [
      o.organizerName, o.organizationName, o.email, o.city
    ].some(f => f?.toLowerCase().includes(search.toLowerCase()));

    const matchFilter = filter === 'ALL'
      ? true
      : filter === 'ACTIVE' ? o.approved && o.emailVerified
      : !o.approved || !o.emailVerified;

    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-400 mb-0.5">Management</p>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Fleet Owners
          </h1>
        </div>
        <span className="text-sm text-slate-500">{total.toLocaleString()} registered</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {STATUS_FILTER.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, organization, city…"
              className="rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-sm outline-none focus:border-teal-500 w-56"
            />
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-teal-600 transition-colors">
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <MdBusiness className="mx-auto mb-2 h-10 w-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400">No fleet owners found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all"
            >
              {/* Avatar + name */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 font-bold text-lg overflow-hidden">
                  {org.organizationLogo
                    ? <img src={org.organizationLogo} alt="" className="h-full w-full object-cover" />
                    : org.organizerName?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{org.organizerName}</p>
                  <p className="text-xs text-slate-500 truncate">{org.organizationName}</p>
                </div>
                {/* Status badge */}
                <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  org.approved && org.emailVerified
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {org.approved && org.emailVerified ? 'Active' : 'Pending'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FiMail className="h-3 w-3 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{org.email}</span>
                </span>
                {org.phone && (
                  <span className="flex items-center gap-1.5">
                    <FiPhone className="h-3 w-3 flex-shrink-0 text-slate-400" />
                    {org.phone}
                  </span>
                )}
                {(org.city || org.state) && (
                  <span className="flex items-center gap-1.5">
                    <FiMapPin className="h-3 w-3 flex-shrink-0 text-rose-400" />
                    {[org.city, org.state].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span>
                  Joined {org.createdAt ? new Date(org.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
                <span className={`font-semibold ${org.emailVerified ? 'text-green-600' : 'text-amber-500'}`}>
                  {org.emailVerified ? 'Email verified' : 'Unverified'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <FiChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              Next <FiChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
