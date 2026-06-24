import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { vehiclesAPI } from '../../services/api';
import { toast } from 'react-toastify';
import Spinner from '../../components/common/Spinner';
import { FiEdit2, FiTrash2, FiXCircle, FiCheckCircle, FiPlus } from 'react-icons/fi';

const STATUS_BADGE = { PUBLISHED:'badge-green',DRAFT:'badge-yellow',CANCELLED:'badge-red',COMPLETED:'badge-gray',UPCOMING:'badge-blue' };

export default function MyFleet() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(0);
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery(['fleet-vehicles', page, filter],
    () => vehiclesAPI.myVehicles({ page, size:10, status:filter||undefined }).then(r => r.data?.data),
    { keepPreviousData:true });

  const cancelMutation  = useMutation((id) => vehiclesAPI.cancel(id),  { onSuccess:() => { toast.success('Listing cancelled'); qc.invalidateQueries('fleet-vehicles'); } });
  const publishMutation = useMutation((id) => vehiclesAPI.publish(id), { onSuccess:() => { toast.success('Vehicle published!'); qc.invalidateQueries('fleet-vehicles'); } });
  const deleteMutation  = useMutation((id) => vehiclesAPI.delete(id),  { onSuccess:() => { toast.success('Listing deleted'); qc.invalidateQueries('fleet-vehicles'); } });

  if (isLoading) return <Spinner />;

  return (
    <div style={{ background:'#F6F8FB', minHeight:'100vh' }} className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily:'Space Grotesk,sans-serif' }}>My Fleet</h1>
          <Link to="/organizer/events/create" className="btn-primary flex items-center gap-2">
            <FiPlus /> Add Vehicle
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['','DRAFT','PUBLISHED','COMPLETED','CANCELLED'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter===s ? 'bg-teal-600 text-white shadow-blue' : 'bg-white text-gray-600 border border-teal-100 hover:bg-teal-50'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {!data?.content?.length ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-teal-100 shadow-card">
            <div className="text-5xl mb-4">🚗</div>
            <p className="text-gray-500 mb-4">No vehicles listed yet.</p>
            <Link to="/organizer/events/create" className="btn-primary">List your first vehicle</Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl overflow-hidden border border-teal-100 shadow-card">
              <table className="data-table">
                <thead>
                  <tr>{['Vehicle','Type','Price/Day','Rented','Revenue','Status','Actions'].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.content.map(v => {
                    const rented  = v.totalSeats - v.availableSeats;
                    const revenue = (rented * Number(v.ticketPrice)).toLocaleString();
                    return (
                      <tr key={v.id}>
                        <td className="font-semibold text-slate-900 max-w-xs truncate">{v.eventName}</td>
                        <td><span className="badge badge-blue text-[10px]">{v.category?.replace(/_/g,' ')}</span></td>
                        <td className="text-gray-500 whitespace-nowrap">Rs.{Number(v.ticketPrice||0).toLocaleString()}</td>
                        <td className="text-gray-500">{rented}/{v.totalSeats}</td>
                        <td className="font-semibold text-slate-900">Rs.{revenue}</td>
                        <td><span className={`badge ${STATUS_BADGE[v.status]||'badge-gray'}`}>{v.status}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link to={`/organizer/events/${v.id}/edit`} title="Edit"
                              className="p-1.5 rounded-lg text-teal-500 hover:bg-teal-50 transition-colors">
                              <FiEdit2 className="w-4 h-4" />
                            </Link>
                            {v.status === 'DRAFT' && (
                              <button onClick={() => publishMutation.mutate(v.id)} title="Publish"
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {['PUBLISHED','DRAFT'].includes(v.status) && (
                              <button onClick={() => { if(window.confirm('Remove listing?')) cancelMutation.mutate(v.id); }} title="Remove"
                                className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 transition-colors">
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            )}
                            {v.status === 'DRAFT' && (
                              <button onClick={() => { if(window.confirm('Delete this listing?')) deleteMutation.mutate(v.id); }} title="Delete"
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => setPage(p => p-1)} disabled={data.first} className="btn-outline py-2 px-5 text-sm disabled:opacity-40">← Prev</button>
                <span className="px-4 py-2 text-sm text-gray-500 font-medium">{data.page+1}/{data.totalPages}</span>
                <button onClick={() => setPage(p => p+1)} disabled={data.last}  className="btn-outline py-2 px-5 text-sm disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
