import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiMapPin,
  FiSearch,
  FiShield,
  FiStar,
  FiUsers,
  FiKey,
} from 'react-icons/fi';
import { MdDirectionsCar, MdElectricCar } from 'react-icons/md';
import { vehiclesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VehicleCard from '../components/common/VehicleCard';
import Spinner from '../components/common/Spinner';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const vehicleTypes = [
  { label: 'Cars',     value: 'CAR',     icon: MdDirectionsCar, tone: 'blue' },
  { label: 'Bikes',    value: 'BIKE',    icon: FiBarChart2,     tone: 'green' },
  { label: 'SUVs',     value: 'SUV',     icon: FiShield,        tone: 'violet' },
  { label: 'Trucks',   value: 'TRUCK',   icon: FiAward,         tone: 'orange' },
  { label: 'Vans',     value: 'VAN',     icon: FiUsers,         tone: 'rose' },
  { label: 'Electric', value: 'ELECTRIC',icon: MdElectricCar,   tone: 'teal' },
];

const journey = [
  { title: 'Discover', text: 'Filter verified vehicles by type, location, price, and availability.' },
  { title: 'Book',     text: 'Reserve your vehicle instantly and manage your rental history in one place.' },
  { title: 'Drive',    text: 'Get clear pickup details, vehicle info, and rental agreement before the day.' },
  { title: 'Return',   text: 'Track your rentals, payments, and refunds from your dashboard.' },
];

const ownerFeatures = [
  'List vehicles with pricing, availability, location, and insurance details',
  'Monitor bookings, renters, and fleet performance in real time',
  'Keep customers informed through the notification system',
];

const quickTags = ['Cars', 'Bikes', 'SUV', 'Electric'];

function Reveal({ children, className = '' }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const { data, isLoading } = useQuery(
    'vehicles-landing',
    () => vehiclesAPI.search({ size: 8, status: 'PUBLISHED' }).then((r) => r.data?.data),
    { staleTime: 60_000, retry: 1 }
  );

  const vehicles = useMemo(() => data?.content ?? [], [data]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim())    params.set('keyword', search.trim());
    if (location.trim())  params.set('location', location.trim());
    navigate(`/events?${params.toString()}`);
  };

  return (
    <div className="landing-shell">
      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=80"
            alt=""
          />
          <div className="hero-overlay" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8"
        >
          <div className="max-w-3xl text-white">
            <motion.div variants={fadeUp} className="hero-kicker">
              <FiCheckCircle className="h-4 w-4" />
              Trusted vehicle rental platform
            </motion.div>
            <motion.h1 variants={fadeUp} className="hero-title">
              Rent any vehicle, anywhere — fast, simple, and reliable.
            </motion.h1>
            <motion.p variants={fadeUp} className="hero-copy">
              A polished rental hub for customers and fleet owners: find available vehicles, confirm your booking, and hit the road without friction.
            </motion.p>

            <motion.form variants={fadeUp} onSubmit={handleSearch} className="hero-search">
              <label className="search-field">
                <FiSearch className="h-4 w-4" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicle type or brand" />
              </label>
              <label className="search-field">
                <FiMapPin className="h-4 w-4" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pickup location" />
              </label>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} type="submit" className="search-button">
                Search
                <FiArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.form>

            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <button key={tag} onClick={() => navigate(`/events?keyword=${encodeURIComponent(tag)}`)} className="quick-chip">
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="hero-panel">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Live Overview</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Fleet Activity</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Active</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['1200+', 'Vehicles listed'],
                ['50K+',  'Rentals completed'],
                ['300+',  'Cities covered'],
                ['98%',   'Satisfaction'],
              ].map(([value, label]) => (
                <div key={label} className="metric-tile">
                  <div className="text-2xl font-black text-slate-950">{value}</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3">
              {journey.slice(0, 3).map((item, index) => (
                <div key={item.title} className="timeline-row">
                  <span>{index + 1}</span>
                  <div>
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Roles */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="section-heading">
            <p>For Everyone on the Road</p>
            <h2>Two clear paths, one seamless rental flow.</h2>
          </Reveal>
          <div className="mt-9 grid gap-5 lg:grid-cols-2">
            <Reveal className="role-card role-card-student">
              <div className="role-icon"><FiUsers /></div>
              <h3>Renters</h3>
              <p>Browse vehicles, compare options, confirm a booking, and return to your dashboard for rental history.</p>
              <Link to={user ? '/events' : '/register'} className="role-link">
                Start browsing <FiArrowRight />
              </Link>
            </Reveal>
            <Reveal className="role-card role-card-organizer">
              <div className="role-icon"><FiKey /></div>
              <h3>Fleet Owners</h3>
              <p>List your vehicles, set pricing and availability, then manage bookings and renters in the same system.</p>
              <Link to={user ? '/organizer/dashboard' : '/register?role=organizer'} className="role-link">
                List your fleet <FiArrowRight />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Vehicle types */}
      <section className="landing-band py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="section-heading">
            <p>Browse By Vehicle Type</p>
            <h2>Find the right vehicle without the hassle.</h2>
          </Reveal>
          <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {vehicleTypes.map((vt, index) => {
              const Icon = vt.icon;
              return (
                <motion.button
                  key={vt.value}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04, duration: 0.42 }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/events?category=${vt.value}`)}
                  className={`category-card tone-${vt.tone}`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{vt.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <Reveal className="section-heading text-left">
            <p>Built for the Journey</p>
            <h2>Professional pages for browsing, booking, and managing rentals.</h2>
            <span>
              The interface keeps key decisions visible: price, location, availability, insurance, and vehicle specs.
            </span>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: FiSearch, title: 'Fast discovery',     text: 'Search and filters help you find the right vehicle in seconds.' },
              { icon: FiMapPin, title: 'Location-aware',     text: 'Pickup location and drop-off details stay easy to scan.' },
              { icon: FiShield, title: 'Insurance info',     text: 'Insurance status and vehicle condition clearly presented.' },
              { icon: FiKey,    title: 'Managed access',     text: 'Authentication and role flows remain secure underneath.' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} className="feature-card">
                  <Icon className="h-5 w-5" />
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured vehicles */}
      <section id="vehicles" className="landing-band py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="section-heading m-0 text-left">
              <p>Featured Vehicles</p>
              <h2>Available now and ready to roll.</h2>
            </div>
            <Link to="/events" className="view-all-link">
              View all vehicles <FiArrowRight />
            </Link>
          </Reveal>

          {isLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : vehicles.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {vehicles.slice(0, 8).map((vehicle, index) => (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.45 }}
                >
                  <VehicleCard event={vehicle} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <MdDirectionsCar className="h-8 w-8" />
              <p>No vehicles are available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <Reveal className="closing-panel">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Fleet Owner Toolkit</p>
            <h2>List your vehicles with a clean, professional front door.</h2>
            <ul>
              {ownerFeatures.map((f) => (
                <li key={f}><FiCheckCircle /> {f}</li>
              ))}
            </ul>
            <Link to="/register?role=organizer" className="closing-cta">
              List your fleet <FiArrowRight />
            </Link>
          </Reveal>
          <Reveal className="quote-panel">
            <FiStar className="h-8 w-8 text-amber-400" />
            <p>
              Clear vehicle listings reduce uncertainty. Renters see what matters, fleet owners keep control, and the
              system does exactly what it was built to do.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

