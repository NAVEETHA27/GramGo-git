import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import {
  FiSearch, FiFilter, FiCheck, FiX, FiEye, FiMapPin,
  FiRefreshCw, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const STATUS_STYLES = {
  PENDING_APPROVAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Pending'  },
  APPROVED:         { cls: 'bg-green-50 text-green-700 border-green-200',   label: 'Approved' },
  PUBLISHED:        { cls: 'bg-green-50 text-green-700 border-green-200',   label: 'Published' },
  REJECTED:         { cls: 'bg-red-50   text-red-600   border-red-200',     label: 'Rejected' },
  DRAFT:            { cls: 'bg-slate-50 text-slate-600 border-slate-200',   label: 'Draft'    },
  CANCELLED:        { cls: 'bg-slate-50 text-slate-500 border-slate-200',   label: 'Cancelled' },
};

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

// Confirmation modal
function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel, danger = false, withReason = false }) {
  const [reason, setReason] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{message}</p>
        {withReason && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection (required)"
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 resize-none mb-4"
          />
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={withReason && !reason.trim()}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Vehicle detail modal
function VehicleDetailModal({ vehicle, onClose }) {
  if (!vehicle) return null;
  const ev = vehicle.event || vehicle;
  const st = STATUS_STYLES[ev.status] ?? { cls: 'bg-slate-50 text-slate-600 border-slate-200', label: ev.status };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Banner */}
        <div className="relative h-44 bg-slate-100 rounded-t-2xl overflow-hidden">
          {ev.eventBanner
            ? <img src={ev.eventBanner} alt={ev.eventName} className="w-full h-full object-cover" />
            : <div className="flex h-full items-center justify-center text-6xl">🚗</div>
          }
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors">
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">{ev.eventName}</h2>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Type',          ev.category],
              ['Brand',         ev.collegeName],
              ['Model',         ev.departmentName],
              ['Price/Day',     ev.ticketPrice ? `₹${Number(ev.ticketPrice).toLocaleString()}` : '—'],
              ['Fleet Qty',     ev.totalSeats],
              ['Available',     ev.availableSeats],
              ['Location',      ev.location],
              ['Pickup Area',   ev.venueName],
              ['Insurance',     ev.hasCertificate ? 'Yes' : 'No'],
              ['Tags',          ev.tags || '—'],
            ].map(([label, val]) => val ? (
              <div key={label}>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-slate-700 font-medium mt-0.5 truncate">{val}</p>
              </div>
            ) : null)}
          </div>

          {ev.description && (
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-slate-600 leading-relaxed">{ev.description}</p>
            </div>
          )}

          {/* Owner */}
          {ev.organizer && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Fleet Owner</p>
              <p className="text-sm font-semibold text-slate-900">{ev.organizer.organizerName}</p>
              <p className="text-xs text-slate-500">{ev.organizer.organizationName}</p>
            </div>
          )}

          <button onClick={onClose} className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminVehicles() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('status')?.toUpperCase() || 'PENDING');
  const [page, setPage]         = useState(0);
  const [detail, setDetail]     = useState(null);
  const [confirm, setConfirm]   = useState(null); // { type:'approve'|'reject', vehicleId, vehicleName }
  const SIZE = 10;

  const load = () => {
    setLoading(true);
    const params = { page, size: SIZE, sort: 'createdAt,desc' };
    const call = activeFilter === 'PENDING'
      ? adminAPI.pendingVehicles(params)
      : adminAPI.vehicles(params);

    call.then(res => {
      const data = res.data?.data;
      // Handle both paged and raw responses
      const content = data?.content ?? (Array.isArray(data) ? data : []);
      setRows(content);
      setTotal(data?.totalElements ?? content.length);
      setTotalPages(data?.totalPages ?? 1);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeFilter, page]);

  const filtered = search.trim()
    ? rows.filter(v => {
        const ev = v.event || v;
        return (ev.eventName?.toLowerCase().includes(search.toLowerCase()) ||
                ev.location?.toLowerCase().includes(search.toLowerCase()) ||
                ev.category?.toLowerCase().includes(search.toLowerCase()) ||
                ev.organizer?.organizerName?.toLowerCase().includes(search.toLowerCase()));
      })
    : rows;

  const handleApprove = async (vehicleId) => {
    try {
      await adminAPI.approveVehicle(vehicleId);
      toast.success('Vehicle approved — now visible to renters.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve.');
    }
    setConfirm(null);
  };

  const handleReject = async (vehicleId, reason) => {
    try {
      await adminAPI.rejectVehicle(vehicleId, { reason });
      toast.success('Vehicle rejected. Fleet owner has been notified.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject.');
    }
    setConfirm(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-400 mb-0.5">Vehicle Moderation</p>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Vehicles
          </h1>
        </div>
        <span className="text-sm text-slate-500">{total.toLocaleString()} listings total</span>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setActiveFilter(f); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
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
              placeholder="Search vehicles…"
              className="rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2 text-sm outline-none focus:border-teal-500 w-48"
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
                {['Vehicle', 'Type', 'Price/Day', 'Location', 'Fleet Owner', 'Status', 'Actions'].map(h => (
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
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-4 py-4"><div className="h-4 animate-pulse rounded bg-slate-100" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <MdDirectionsCar className="mx-auto mb-2 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-400">No vehicles found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeFilter === 'PENDING' ? 'No vehicles awaiting approval.' : 'Try adjusting the filter or search.'}
                    </p>
                  </td>
                </tr>
              ) : filtered.map((row, i) => {
                const ev = row.event || row;
                const st = STATUS_STYLES[ev.status] ?? { cls: 'bg-slate-50 text-slate-600 border-slate-200', label: ev.status };
                const isPending = ev.status === 'PENDING_APPROVAL';
                return (
                  <motion.tr
                    key={ev.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 overflow-hidden">
                          {ev.eventBanner
                            ? <img src={ev.eventBanner} alt="" className="h-full w-full object-cover" />
                            : <MdDirectionsCar className="h-4 w-4 text-teal-600" />
                          }
                        </div>
                        <span className="font-semibold text-slate-900 truncate max-w-[140px]">{ev.eventName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-teal-50 border border-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {ev.ticketPrice ? `₹${Number(ev.ticketPrice).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[120px]">
                      <span className="flex items-center gap-1 truncate">
                        <FiMapPin className="h-3 w-3 flex-shrink-0 text-rose-400" />
                        {ev.location || ev.venueName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[130px]">
                      <p className="truncate font-medium">{ev.organizer?.organizerName || '—'}</p>
                      <p className="truncate text-xs text-slate-400">{ev.organizer?.organizationName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View details */}
                        <button
                          onClick={() => setDetail(row)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-teal-600 transition-colors"
                          title="View details"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        {/* Approve */}
                        {isPending && (
                          <button
                            onClick={() => setConfirm({ type: 'approve', vehicleId: ev.id, vehicleName: ev.eventName })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                            title="Approve"
                          >
                            <FiCheck className="h-4 w-4" />
                          </button>
                        )}
                        {/* Reject */}
                        {isPending && (
                          <button
                            onClick={() => setConfirm({ type: 'reject', vehicleId: ev.id, vehicleName: ev.eventName })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Reject"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
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

      {/* Modals */}
      <VehicleDetailModal vehicle={detail} onClose={() => setDetail(null)} />

      <ConfirmModal
        open={confirm?.type === 'approve'}
        title="Approve Vehicle"
        message={`Approve "${confirm?.vehicleName}"? It will immediately become visible to renters.`}
        confirmLabel="Approve"
        onConfirm={() => handleApprove(confirm.vehicleId)}
        onCancel={() => setConfirm(null)}
      />

      <ConfirmModal
        open={confirm?.type === 'reject'}
        title="Reject Vehicle"
        message={`Reject "${confirm?.vehicleName}"? The fleet owner will be notified and can resubmit after edits.`}
        confirmLabel="Reject"
        withReason
        danger
        onConfirm={(reason) => handleReject(confirm.vehicleId, reason)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
