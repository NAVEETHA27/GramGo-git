import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import {
  FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiMail, FiPhone, FiMapPin, FiUser,
} from 'react-icons/fi';

const STATUS_FILTER = ['ALL', 'VERIFIED', 'UNVERIFIED'];

export default function AdminRenters() {
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
    adminAPI.users({ page, size: SIZE, sort: 'createdAt,desc' })
      .then(res => {
        const data = res.data?.data;
        const content = data?.content ?? (Array.isArray(data) ? data : []);
        // Only USER role (exclude ADMIN)
        const users = content.filter(u => u.role === 'USER' || !u.role);
        setRows(users);
        setTotal(data?.totalElements ?? users.length);
        setTotalPages(data?.totalPages ?? 1);
      }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const filtered = rows.filter(u => {
    const matchSearch = !search.trim() || [u.name, u.email, u.phone, u.city].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchFilter = filter === 'ALL'
      ? true
      : filter === 'VERIFIED' ? u.emailVerified
      : !u.emailVerified;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-400 mb-0.5">Management</p>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Renters
          </h1>
        </div>
        <span className="text-sm text-slate-500">{total.toLocaleString()} registered</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {STATUS_FILTER.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, phone, city…"
              className="rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-sm outline-none focus:border-teal-500 w-52"
            />
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-teal-600 transition-colors">
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Renter', 'Email', 'Phone', 'City', 'Joined', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FiUser className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No renters found</p>
                  </td>
                </tr>
              ) : filtered.map((u, i) => (
                <motion.tr key={u.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-xs font-bold overflow-hidden">
                        {u.profilePicture
                          ? <img src={u.profilePicture} alt="" className="h-full w-full object-cover" />
                          : u.name?.charAt(0)?.toUpperCase()
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-[130px]">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.userCode || `#${u.id}`}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-600 text-xs">
                      <FiMail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{u.email}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {u.phone
                      ? <span className="flex items-center gap-1"><FiPhone className="h-3 w-3 text-slate-400" />{u.phone}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {u.city
                      ? <span className="flex items-center gap-1"><FiMapPin className="h-3 w-3 text-rose-400" />{[u.city, u.state].filter(Boolean).join(', ')}</span>
                      : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      u.emailVerified
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {u.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <FiChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page + 1 >= totalPages}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                Next <FiChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
