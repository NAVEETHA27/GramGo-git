import React from 'react';
import { useQuery } from 'react-query';
import { vehiclesAPI } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { FiUsers } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

export default function FleetRenters() {
  const { data: vehicles, isLoading } = useQuery(
    'fleet-renters',
    () => vehiclesAPI.myVehicles({ page: 0, size: 100 }).then((r) => r.data.data)
  );

  if (isLoading) return <Spinner />;

  const totalRented = vehicles?.content?.reduce(
    (sum, v) => sum + (v.totalSeats - v.availableSeats), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <FiUsers className="text-teal-600 w-6 h-6" />
        <h1 className="section-title">Renters Overview</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Listings', value: vehicles?.totalElements || 0 },
          { label: 'Total Rented',   value: totalRented },
          { label: 'Avg. per Vehicle', value: vehicles?.content?.length
              ? Math.round(totalRented / vehicles.content.length) : 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-6 text-center shadow-card">
            <div className="text-3xl font-extrabold text-teal-700">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Vehicle', 'Type', 'Total Units', 'Rented', 'Available', 'Fill Rate'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles?.content?.map((v) => {
              const rented   = v.totalSeats - v.availableSeats;
              const fillRate = v.totalSeats ? Math.round((rented / v.totalSeats) * 100) : 0;
              return (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 max-w-xs truncate">{v.eventName}</td>
                  <td className="px-5 py-4">
                    <span className="badge badge-teal text-[10px]">{v.category?.replace(/_/g,' ')}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{v.totalSeats}</td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{rented}</td>
                  <td className="px-5 py-4 text-gray-500">{v.availableSeats}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${fillRate}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-10">{fillRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!vehicles?.content?.length && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No vehicles listed yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
