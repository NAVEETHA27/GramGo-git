import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { FiCheck, FiX, FiEdit, FiMapPin } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

export default function Approvals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminAPI.approvals({ page: 0, size: 20 })
      .then((r) => setRows(r.data?.data?.content ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (eventId, decision) => {
    const reason = decision === 'APPROVE'
      ? ''
      : window.prompt('Reason for fleet owner (required for rejection):') || '';
    try {
      await adminAPI.reviewEvent(eventId, { decision, reason });
      toast.success(decision === 'APPROVE' ? 'Vehicle listing approved!' : 'Review submitted.');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review.');
    }
  };

  const DECISION_BADGE = {
    PENDING:             'bg-amber-50  text-amber-700  border-amber-200',
    APPROVED:            'bg-green-50  text-green-700  border-green-200',
    REJECTED:            'bg-red-50    text-red-600    border-red-200',
    PENDING_APPROVAL:    'bg-amber-50  text-amber-700  border-amber-200',
    REQUEST_MODIFICATIONS:'bg-teal-50  text-teal-700   border-teal-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-600 mb-1">Admin</p>
          <h1 className="text-3xl font-extrabold text-slate-950" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Vehicle Listing Approvals
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve vehicle listings submitted by fleet owners.
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <MdDirectionsCar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-400">No pending approval requests.</p>
            <p className="mt-1 text-sm text-slate-400">All vehicle listings have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row, i) => {
              const vehicle = row.event || {};
              const statusCls = DECISION_BADGE[row.status] || DECISION_BADGE.PENDING;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Vehicle info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                        <MdDirectionsCar className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {vehicle.eventName || `Listing #${vehicle.id}`}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {vehicle.category && (
                            <span className="rounded-full bg-teal-50 px-2 py-0.5 font-semibold text-teal-700 border border-teal-100">
                              {vehicle.category}
                            </span>
                          )}
                          {vehicle.location && (
                            <span className="flex items-center gap-1">
                              <FiMapPin className="h-3 w-3 text-rose-400" />
                              {vehicle.location}
                            </span>
                          )}
                          {vehicle.ticketPrice !== undefined && (
                            <span className="font-semibold text-slate-700">
                              Rs.{Number(vehicle.ticketPrice).toLocaleString()}/day
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCls}`}>
                            {row.status?.replace(/_/g, ' ')}
                          </span>
                          {vehicle.organizer && (
                            <span className="text-xs text-slate-400">
                              by {vehicle.organizer.organizerName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => review(vehicle.id, 'APPROVE')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                      >
                        <FiCheck className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => review(vehicle.id, 'REQUEST_MODIFICATIONS')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 transition hover:bg-teal-100"
                      >
                        <FiEdit className="h-3.5 w-3.5" /> Request Changes
                      </button>
                      <button
                        onClick={() => review(vehicle.id, 'REJECT')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        <FiX className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
