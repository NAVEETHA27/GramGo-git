import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { bookingsAPI } from '../../services/api';
import Spinner from '../../components/common/Spinner';
import { QRCodeSVG } from 'qrcode.react';
import { FiArrowLeft, FiCalendar, FiCreditCard, FiMapPin, FiUsers } from 'react-icons/fi';
import { format } from 'date-fns';

export default function BookingDetail() {
  const { id } = useParams();
  const { data, isLoading } = useQuery(['booking', id],
    () => bookingsAPI.getById(id).then(r => r.data?.data));

  if (isLoading) return <Spinner full />;
  if (!data) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-blue-900">Booking not found</h2>
      <Link to="/bookings" className="btn-primary inline-block mt-4">My Bookings</Link>
    </div>
  );

  const b = data;
  const isFree = !b.totalAmount || Number(b.totalAmount) === 0;

  return (
    <div style={{ background:'#F0F4FF', minHeight:'100vh' }} className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/bookings" className="p-2 rounded-xl hover:bg-blue-100 transition-colors text-blue-700">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-blue-900" style={{ fontFamily:'Space Grotesk,sans-serif' }}>
            Rental Details
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-card space-y-6">
          {/* QR */}
          <div className="flex flex-col items-center py-5 border-b border-blue-100">
            <QRCodeSVG value={b.ticketId} size={180} />
            <code className="text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-xl mt-4 font-mono border border-blue-100">
              {b.ticketId}
            </code>
            <span className={`badge mt-3 ${b.bookingStatus === 'CONFIRMED' ? 'badge-green' : 'badge-red'}`}>
              {b.bookingStatus}
            </span>
          </div>

          {/* Event info */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-blue-900">{b.event?.eventName}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <FiCalendar className="text-blue-400" />
                Booked: {b.bookedAt ? new Date(b.bookedAt).toLocaleDateString('en-IN') : '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <FiMapPin className="text-red-400" />
                {b.event?.venueName || b.event?.location || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <FiUsers className="text-blue-400" />
                {b.quantity} day{b.quantity > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-blue-50 rounded-2xl p-5 space-y-2 border border-blue-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rate per Day</span>
              <span className="font-medium text-gray-700">
                {isFree ? 'Free' : `Rs.${(Number(b.totalAmount) / b.quantity).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Days</span>
              <span className="font-medium text-gray-700">{b.quantity}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
              <span className="font-bold text-blue-900">Total Paid</span>
              <span className="text-xl font-extrabold text-blue-700">
                {isFree ? 'Free' : `Rs.${Number(b.totalAmount).toLocaleString()}`}
              </span>
            </div>
          </div>

          {b.bookingStatus === 'PENDING' && !isFree && (
            <Link
              to={`/checkout/${b.id}`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800"
            >
              <FiCreditCard /> Complete Payment
            </Link>
          )}

          <p className="text-xs text-gray-400 text-center">
            Present this QR code at the pickup point to collect your vehicle.
          </p>
        </div>
      </div>
    </div>
  );
}
