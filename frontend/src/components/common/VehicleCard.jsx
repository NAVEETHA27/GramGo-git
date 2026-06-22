import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiUsers, FiShield } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

// Vehicle type → style mapping
const VTYPE = {
  CAR:          { cls: 'cat-hackathon',  label: 'Car',         emoji: '🚗' },
  BIKE:         { cls: 'cat-workshop',   label: 'Bike',        emoji: '🏍️' },
  SUV:          { cls: 'cat-symposium',  label: 'SUV',         emoji: '🚙' },
  TRUCK:        { cls: 'cat-coding',     label: 'Truck',       emoji: '🚛' },
  VAN:          { cls: 'cat-seminar',    label: 'Van',         emoji: '🚐' },
  LUXURY:       { cls: 'cat-cultural',   label: 'Luxury',      emoji: '🏎️' },
  ELECTRIC:     { cls: 'cat-sports',     label: 'Electric',    emoji: '⚡' },
  SCOOTER:      { cls: 'cat-workshop',   label: 'Scooter',     emoji: '🛵' },
  MINIBUS:      { cls: 'cat-symposium',  label: 'Minibus',     emoji: '🚌' },
  OTHER:        { cls: 'cat-default',    label: 'Vehicle',     emoji: '🚘' },
};

const STATUS_CLS = {
  PUBLISHED:  'badge-green',
  UPCOMING:   'badge-blue',
  DRAFT:      'badge-yellow',
  CANCELLED:  'badge-red',
  COMPLETED:  'badge-gray',
};

export default function VehicleCard({ event: vehicle, compact = false }) {
  const pricePerDay = Number(vehicle.ticketPrice ?? 0);
  const isFree = pricePerDay === 0;
  const vtype = VTYPE[vehicle.category] ?? VTYPE.OTHER;
  const availableUnits = vehicle.availableSeats ?? 0;
  // brand from collegeName, model from departmentName (reusing backend fields)
  const brand = vehicle.collegeName || '';
  const model = vehicle.departmentName || '';
  const transmission = vehicle.tags?.includes('AUTOMATIC') ? 'Automatic' : vehicle.tags?.includes('MANUAL') ? 'Manual' : '';
  const fuelType = vehicle.tags?.includes('ELECTRIC') ? 'Electric' : vehicle.tags?.includes('DIESEL') ? 'Diesel' : vehicle.tags?.includes('PETROL') ? 'Petrol' : '';

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 46px rgba(15,23,42,0.14)' }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="h-full rounded-xl"
    >
      <Link
        to={`/events/${vehicle.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-white"
        style={{ border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
      >
        {/* Image */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: compact ? '130px' : '185px' }}>
          {vehicle.eventBanner ? (
            <img
              src={vehicle.eventBanner}
              alt={vehicle.eventName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#E0F2FE,#F8FAFC,#CCFBF1)' }}
            >
              <span className="text-5xl">{vtype.emoji}</span>
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className={`badge ${STATUS_CLS[vehicle.status] ?? 'badge-blue'}`}>{vehicle.status}</span>
          </div>
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {isFree && <span className="badge badge-green">FREE</span>}
            {vehicle.hasCertificate && <span className="badge badge-blue"><FiShield className="inline w-2.5 h-2.5 mr-0.5" />Insured</span>}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <span className={`badge w-fit text-[10px] ${vtype.cls}`}>{vtype.label}</span>

          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-950 transition-colors group-hover:text-teal-700">
            {vehicle.eventName}
          </h3>

          {(brand || model) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MdDirectionsCar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{[brand, model].filter(Boolean).join(' · ')}</span>
            </div>
          )}

          <div className="space-y-1 text-xs text-slate-500">
            {vehicle.location && (
              <div className="flex items-center gap-1.5">
                <FiMapPin className="h-3 w-3 flex-shrink-0 text-rose-500" />
                <span className="truncate">{vehicle.venueName || vehicle.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <FiUsers className="h-3 w-3 flex-shrink-0 text-cyan-600" />
              <span>{availableUnits} unit{availableUnits !== 1 ? 's' : ''} available</span>
            </div>
            {(transmission || fuelType) && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>{[transmission, fuelType].filter(Boolean).join(' · ')}</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
            {isFree ? (
              <span className="text-sm font-extrabold text-green-600">Free</span>
            ) : (
              <div>
                <span className="text-sm font-extrabold text-slate-950">
                  Rs. {pricePerDay.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400"> /day</span>
              </div>
            )}
            <span className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal-700 transition-all duration-200 group-hover:bg-teal-600 group-hover:text-white">
              Rent Now
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

