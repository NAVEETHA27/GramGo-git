import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { motion } from 'framer-motion';
import { vehiclesAPI, rentalsAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import QueryError from '../components/common/QueryError';
import { toast } from 'react-toastify';
import {
  FiMapPin, FiUsers, FiMinus, FiPlus, FiShare2, FiExternalLink,
  FiShield, FiKey, FiInfo,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const TYPE_LABELS = {
  CAR: '🚗 Car', BIKE: '🏍️ Bike', SUV: '🚙 SUV', TRUCK: '🚛 Truck',
  VAN: '🚐 Van', LUXURY: '🏎️ Luxury', ELECTRIC: '⚡ Electric',
  SCOOTER: '🛵 Scooter', MINIBUS: '🚌 Minibus', OTHER: '🚘 Vehicle',
};

export default function VehicleDetail() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [qty, setQty] = useState(1); // number of days

  const { data, isLoading, isError, error, refetch } = useQuery(
    ['vehicle', id],
    () => vehiclesAPI.getById(id).then((r) => r.data?.data)
  );

  const bookMutation = useMutation(
    () => rentalsAPI.book({ eventId: Number(id), quantity: qty }).then((r) => r.data),
    {
      onSuccess: async (res) => {
        const booking = res.data;
        if (!booking?.id) {
          toast.error('Booking was created but checkout could not be opened.');
          navigate('/bookings');
          return;
        }

        if (!booking.totalAmount || Number(booking.totalAmount) === 0) {
          try {
            await paymentsAPI.createRazorpayOrder(booking.id);
            toast.success(`Free rental confirmed! Booking: ${booking.ticketId}`);
            navigate(`/bookings/${booking.id}`);
          } catch {
            navigate(`/checkout/${booking.id}`);
          }
          return;
        }

        toast.success('Vehicle reserved. Complete payment to confirm your rental.');
        navigate(`/checkout/${booking.id}`);
      },
      onError: (err) => {
        toast.error(err?.response?.data?.message || 'Could not reserve vehicle. Please try again.');
      },
    }
  );

  if (isLoading) return <Spinner full />;
  if (isError)   return (
    <div className="max-w-lg mx-auto py-20 px-4">
      <QueryError message={error?.response?.data?.message} onRetry={refetch} />
    </div>
  );
  if (!data) return (
    <div className="text-center py-20 text-slate-900">
      <div className="text-5xl mb-4">🚗</div>
      <h2 className="text-2xl font-bold">Vehicle not found</h2>
      <Link to="/events" className="btn-primary inline-block mt-4">Browse Vehicles</Link>
    </div>
  );

  const vehicle     = data;
  const pricePerDay = Number(vehicle.ticketPrice ?? 0);
  const isFree      = pricePerDay === 0;
  const totalPrice  = isFree ? 0 : pricePerDay * qty;
  const canRent     = vehicle.availableSeats > 0 && vehicle.status !== 'CANCELLED' && vehicle.status !== 'COMPLETED';
  const typeLabel   = TYPE_LABELS[vehicle.category] || '🚘 Vehicle';
  // brand / model stored in collegeName / departmentName
  const brand       = vehicle.collegeName || '';
  const model       = vehicle.departmentName || '';
  // parse tags for fuel, transmission, seats, mileage
  const tags        = (vehicle.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const fuelType    = tags.find((t) => ['PETROL','DIESEL','ELECTRIC','HYBRID'].includes(t)) || '';
  const transmission= tags.find((t) => ['MANUAL','AUTOMATIC'].includes(t)) || '';
  const seatsTag    = tags.find((t) => t.startsWith('SEATS_'));
  const seatsCount  = seatsTag ? seatsTag.replace('SEATS_', '') + ' seats' : '';

  return (
    <div style={{ background: '#F6F8FB', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left */}
          <div className="lg:col-span-2 space-y-7">
            {/* Banner */}
            <div className="rounded-3xl overflow-hidden h-72 md:h-96 bg-gradient-to-br from-teal-100 to-indigo-100 shadow-card">
              {vehicle.eventBanner
                ? <img src={vehicle.eventBanner} alt={vehicle.eventName} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-9xl opacity-30">🚗</div>}
            </div>

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge badge-blue">{typeLabel}</span>
                {vehicle.hasCertificate && <span className="badge badge-green"><FiShield className="inline w-3 h-3 mr-0.5" />Insured</span>}
                {vehicle.priority === 'HIGH' && <span className="badge badge-red">🔥 Premium</span>}
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
                {vehicle.eventName}
              </h1>

              {/* Specs grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  brand && { icon: <MdDirectionsCar className="text-teal-500" />, label: `Brand: ${brand}` },
                  model && { icon: <MdDirectionsCar className="text-indigo-400" />, label: `Model: ${model}` },
                  vehicle.location && { icon: <FiMapPin className="text-red-400" />, label: vehicle.venueName || vehicle.location },
                  { icon: <FiUsers className="text-teal-500" />, label: `${vehicle.availableSeats} / ${vehicle.totalSeats} units available` },
                  fuelType && { icon: <FiInfo className="text-teal-400" />, label: `Fuel: ${fuelType}` },
                  transmission && { icon: <FiKey className="text-teal-400" />, label: `Transmission: ${transmission}` },
                  seatsCount && { icon: <FiUsers className="text-teal-400" />, label: seatsCount },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 border border-teal-100">
                    <span className="mt-0.5 text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="bg-white rounded-2xl p-6 border border-teal-100 shadow-card">
                <h2 className="text-lg font-bold text-slate-900 mb-3">About This Vehicle</h2>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{vehicle.description}</p>
              </div>
            )}

            {/* Owner info */}
            {vehicle.organizer && (
              <div className="bg-white rounded-2xl p-5 flex items-center gap-4 border border-teal-100 shadow-card">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#0F766E,#D32F2F)' }}>
                  {vehicle.organizer.organizationLogo
                    ? <img src={vehicle.organizer.organizationLogo} alt="" className="w-full h-full object-cover" />
                    : vehicle.organizer.organizerName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{vehicle.organizer.organizerName}</p>
                  <p className="text-sm text-gray-500">{vehicle.organizer.organizationName}</p>
                </div>
              </div>
            )}

            {vehicle.googleMapsUrl && (
              <a href={vehicle.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-teal-600 hover:text-teal-800 text-sm font-medium">
                <FiExternalLink /> View pickup location on Google Maps
              </a>
            )}
          </div>

          {/* Right — booking card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sticky top-24 space-y-5 border border-teal-100 shadow-blue">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Rental Price</p>
                {isFree
                  ? <p className="text-3xl font-extrabold text-green-600">Free</p>
                  : <p className="text-3xl font-extrabold text-slate-900">
                      Rs.{pricePerDay.toLocaleString()}
                      <span className="text-sm font-normal text-gray-400"> / day</span>
                    </p>
                }
              </div>

              {canRent && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Number of Days</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-xl border border-teal-200 flex items-center justify-center hover:bg-teal-50 transition-colors text-teal-700"
                    >
                      <FiMinus />
                    </button>
                    <span className="text-xl font-bold text-slate-900 w-8 text-center">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(30, q + 1))}
                      className="w-10 h-10 rounded-xl border border-teal-200 flex items-center justify-center hover:bg-teal-50 transition-colors text-teal-700"
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              )}

              {!isFree && canRent && (
                <div className="flex items-center justify-between pt-3 border-t border-teal-100">
                  <span className="font-semibold text-gray-700">Total ({qty} day{qty > 1 ? 's' : ''})</span>
                  <span className="text-2xl font-extrabold text-slate-900">Rs.{totalPrice.toLocaleString()}</span>
                </div>
              )}

              {canRent ? (
                <motion.button
                  onClick={() => {
                    if (!user) return navigate('/login');
                    if (user.role !== 'USER') return toast.error('Only registered users can rent vehicles');
                    bookMutation.mutate();
                  }}
                  disabled={bookMutation.isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 text-base font-bold disabled:opacity-60"
                >
                  {bookMutation.isLoading ? '⏳ Processing…' : '🚗 Rent Now'}
                </motion.button>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 text-center py-4 rounded-2xl font-semibold text-sm">
                  {vehicle.status === 'CANCELLED' ? '❌ Listing Cancelled' : vehicle.status === 'COMPLETED' ? '✅ No Longer Available' : '⚠️ No units available'}
                </div>
              )}

              <button
                onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'))}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-teal-200 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors"
              >
                <FiShare2 /> Share This Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
