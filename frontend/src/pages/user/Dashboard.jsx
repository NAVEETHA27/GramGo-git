import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { rentalsAPI, vehiclesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VehicleCard from '../../components/common/VehicleCard';
import Spinner from '../../components/common/Spinner';
import {
  FiArrowRight, FiBell, FiCheckCircle, FiSearch,
  FiUser, FiXCircle, FiKey,
} from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: rentals, isLoading: rLoading } = useQuery('dash-rentals',
    () => rentalsAPI.myRentals({ page: 0, size: 5 }).then((r) => r.data?.data));

  const { data: vehicles, isLoading: vLoading } = useQuery('dash-vehicles',
    () => vehiclesAPI.search({ sortBy: 'date_asc', size: 4 }).then((r) => r.data?.data));

  const rentalList = rentals?.content ?? [];
  const total      = rentals?.totalElements ?? 0;
  const confirmed  = rentalList.filter((b) => b.bookingStatus === 'CONFIRMED').length;
  const cancelled  = rentalList.filter((b) => b.bookingStatus === 'CANCELLED').length;
  const insured    = rentalList.filter((b) => b.event?.hasCertificate && b.bookingStatus === 'CONFIRMED').length;

  const stats = [
    { label: 'Total Rentals',   value: total,     icon: <MdDirectionsCar />, cls: 'text-teal-600 bg-teal-50 border-teal-100' },
    { label: 'Active',          value: confirmed,  icon: <FiCheckCircle />,   cls: 'text-green-600 bg-green-50 border-green-100' },
    { label: 'Cancelled',       value: cancelled,  icon: <FiXCircle />,       cls: 'text-rose-600 bg-rose-50 border-rose-100' },
    { label: 'Insured Rentals', value: insured,    icon: <FiKey />,           cls: 'text-amber-600 bg-amber-50 border-amber-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-2xl bg-gradient-to-br from-slate-950 to-teal-800 p-8 text-white shadow-card"
        >
          <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-teal-200">Renter Dashboard</p>
          <h1 className="mb-1 text-3xl font-extrabold" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Renter'}
          </h1>
          <p className="text-slate-200">Track your rentals, browse vehicles, and keep your profile ready for the next trip.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { to: '/events',       label: 'Browse Vehicles',  icon: <FiSearch /> },
              { to: '/bookings',     label: 'My Rentals',       icon: <MdDirectionsCar /> },
              { to: '/notifications',label: 'Notifications',    icon: <FiBell /> },
              { to: '/profile',      label: 'Profile',          icon: <FiUser /> },
            ].map((action) => (
              <Link key={action.to} to={action.to} className="inline-flex items-center gap-2 rounded-xl bg-white/12 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20">
                {action.icon} {action.label}
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-5 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} {...fadeUp} transition={{ delay: index * 0.05 }} className="rounded-xl border bg-white p-5 shadow-card">
              <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl border ${stat.cls}`}>{stat.icon}</div>
              <div className="text-3xl font-extrabold text-slate-950" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>{stat.value}</div>
              <div className="mt-0.5 text-xs font-semibold text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Getting started guide */}
        <motion.div {...fadeUp} className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Getting Started</h2>
              <p className="mt-0.5 text-sm text-slate-500">Three quick steps to your next ride.</p>
            </div>
            <Link to="/help" className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 sm:flex">
              Help Center <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: <FiSearch />,      title: 'Find a vehicle',  text: 'Browse and filter verified vehicles by type, price, and location.' },
              { icon: <FiCheckCircle />, title: 'Book instantly',  text: 'Reserve online with clear pricing and instant confirmation.' },
              { icon: <FiKey />,         title: 'Pick up & drive', text: 'Get pickup details and your rental agreement, then hit the road.' },
            ].map((step, index) => (
              <div key={step.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white">{step.icon}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm font-black text-teal-700 ring-1 ring-teal-100">{index + 1}</span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-950">{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent rentals + Featured vehicles */}
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Recent Rentals</h2>
              <Link to="/bookings" className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900">
                View all <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {rLoading ? <Spinner /> : (
              <div className="space-y-3">
                {rentalList.slice(0, 5).map((rental) => (
                  <Link
                    key={rental.id}
                    to={`/bookings/${rental.id}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-teal-200"
                  >
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                      <MdDirectionsCar />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{rental.event?.eventName}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{rental.ticketId}</p>
                    </div>
                    <span className={`badge ${rental.bookingStatus === 'CONFIRMED' ? 'badge-green' : 'badge-red'}`}>
                      {rental.bookingStatus}
                    </span>
                  </Link>
                ))}
                {!rentalList.length && (
                  <p className="rounded-xl border border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
                    No rentals yet. Browse vehicles to get started!
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-950">Available Vehicles</h2>
              <Link to="/events" className="flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900">
                Browse all <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {vLoading ? <Spinner /> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(vehicles?.content ?? []).slice(0, 4).map((vehicle) => (
                  <VehicleCard key={vehicle.id} event={vehicle} compact />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

