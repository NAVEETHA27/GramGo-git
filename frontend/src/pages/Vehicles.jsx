import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { vehiclesAPI } from '../services/api';
import VehicleCard from '../components/common/VehicleCard';
import Spinner from '../components/common/Spinner';
import QueryError from '../components/common/QueryError';
import { FiSearch, FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

const VEHICLE_TYPES = [
  'CAR', 'BIKE', 'SUV', 'TRUCK', 'VAN', 'LUXURY',
  'ELECTRIC', 'SCOOTER', 'MINIBUS', 'OTHER',
];
const TYPE_LABELS = {
  CAR: 'Car', BIKE: 'Bike', SUV: 'SUV', TRUCK: 'Truck', VAN: 'Van',
  LUXURY: 'Luxury', ELECTRIC: 'Electric', SCOOTER: 'Scooter',
  MINIBUS: 'Minibus', OTHER: 'Other',
};
const SORT = [
  { value: 'date_asc',   label: 'Newest First'      },
  { value: 'date_desc',  label: 'Oldest First'       },
  { value: 'popular',    label: 'Most Popular'        },
  { value: 'price_asc',  label: 'Price: Low → High'  },
  { value: 'price_desc', label: 'Price: High → Low'  },
];
const FUEL_TYPES       = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'];
const TRANSMISSION     = ['MANUAL', 'AUTOMATIC'];

export default function BrowseVehicles() {
  const [searchParams] = useSearchParams();
  const [sidebar, setSidebar] = useState(false);
  const [page, setPage]       = useState(0);
  const [filters, setFilters] = useState({
    keyword:   searchParams.get('keyword')   || '',
    category:  searchParams.get('category')  || '',
    location:  searchParams.get('location')  || '',
    eventType: '',
    priceMin:  '',
    priceMax:  '',
    freeOnly:  false,
    sortBy:    'date_asc',
  });
  const [inputKw, setInputKw] = useState(filters.keyword);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery(
    ['vehicles', filters, page],
    () => vehiclesAPI.search({ ...filters, page, size: 12 }).then((r) => r.data?.data),
    { keepPreviousData: true, retry: 1 }
  );

  const set = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(0); };
  const clear = () => {
    setFilters({ keyword: '', category: '', location: '', eventType: '', priceMin: '', priceMax: '', freeOnly: false, sortBy: 'date_asc' });
    setInputKw('');
    setPage(0);
  };
  const activeCount = [filters.category, filters.eventType, filters.location, filters.priceMin, filters.priceMax, filters.freeOnly].filter(Boolean).length;

  return (
    <div style={{ background: '#F0F4FF', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-white border-b border-blue-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Discover</p>
          <h1 className="section-title mb-1">Browse Vehicles</h1>
          <p className="text-sm text-gray-500">
            {data?.totalElements ? `${data.totalElements.toLocaleString()} vehicles available` : 'Find your perfect ride'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar */}
        <form onSubmit={(e) => { e.preventDefault(); set('keyword', inputKw); }} className="flex flex-col sm:flex-row gap-3 mb-7">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={inputKw}
              onChange={(e) => setInputKw(e.target.value)}
              placeholder="Search vehicles, brands, models…"
              className="input-field pl-10 bg-white"
            />
          </div>
          <select value={filters.sortBy} onChange={(e) => set('sortBy', e.target.value)} className="input-field bg-white w-auto min-w-[170px]">
            {SORT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
          <button
            type="button"
            onClick={() => setSidebar(!sidebar)}
            className={`btn-outline flex items-center gap-2 whitespace-nowrap ${activeCount > 0 ? 'bg-blue-50' : ''}`}
          >
            <FiFilter className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">{activeCount}</span>
            )}
          </button>
        </form>

        <div className="flex gap-7">
          {/* Sidebar */}
          <AnimatePresence>
            {sidebar && (
              <motion.aside
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '17rem' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.28 }}
                className="flex-shrink-0 overflow-hidden"
                style={{ minWidth: '17rem' }}
              >
                <div className="bg-white rounded-2xl p-5 sticky top-20 border border-blue-100 shadow-card">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-bold text-blue-900">Filters</h3>
                    <div className="flex gap-3">
                      {activeCount > 0 && <button onClick={clear} className="text-xs text-red-500 font-medium">Clear all</button>}
                      <button onClick={() => setSidebar(false)} className="text-gray-400 hover:text-gray-600"><FiX className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <FSection title="Vehicle Type">
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {VEHICLE_TYPES.map((type) => (
                        <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="radio"
                            name="vtype"
                            value={type}
                            checked={filters.category === type}
                            onChange={() => set('category', filters.category === type ? '' : type)}
                            className="accent-blue-600"
                          />
                          <span className="text-sm text-gray-600">{TYPE_LABELS[type]}</span>
                        </label>
                      ))}
                    </div>
                  </FSection>

                  <FSection title="Transmission">
                    {TRANSMISSION.map((t) => (
                      <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="transmission"
                          value={t}
                          checked={filters.eventType === t}
                          onChange={() => set('eventType', filters.eventType === t ? '' : t)}
                          className="accent-blue-600"
                        />
                        <span className="text-sm text-gray-600">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                      </label>
                    ))}
                  </FSection>

                  <FSection title="Pickup Location">
                    <input
                      value={filters.location}
                      placeholder="City or area"
                      onChange={(e) => set('location', e.target.value)}
                      className="input-field text-sm bg-gray-50"
                    />
                  </FSection>

                  <FSection title="Price per Day (Rs.)">
                    <div className="flex gap-2">
                      <input
                        value={filters.priceMin}
                        placeholder="Min"
                        type="number"
                        min="0"
                        onChange={(e) => set('priceMin', e.target.value)}
                        className="input-field text-sm bg-gray-50"
                      />
                      <input
                        value={filters.priceMax}
                        placeholder="Max"
                        type="number"
                        min="0"
                        onChange={(e) => set('priceMax', e.target.value)}
                        className="input-field text-sm bg-gray-50"
                      />
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.freeOnly}
                        onChange={(e) => set('freeOnly', e.target.checked)}
                        className="accent-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-600">Free rentals only</span>
                    </label>
                  </FSection>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Spinner />
            ) : isError ? (
              <QueryError message={error?.response?.data?.message} onRetry={refetch} />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(data?.content ?? []).map((vehicle) => (
                    <VehicleCard key={vehicle.id} event={vehicle} />
                  ))}
                </div>

                {!data?.content?.length && (
                  <div className="text-center py-24 bg-white rounded-2xl border border-blue-100">
                    <div className="text-5xl mb-4">🚗</div>
                    <h3 className="text-xl font-bold text-blue-900 mb-2">No vehicles found</h3>
                    <p className="text-gray-500 mb-6 text-sm">Try adjusting your search or filters.</p>
                    <button onClick={clear} className="btn-primary">Clear Filters</button>
                  </div>
                )}

                {(data?.totalPages ?? 0) > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-10">
                    <button onClick={() => setPage((p) => p - 1)} disabled={data.first || isFetching} className="btn-outline py-2 px-5 disabled:opacity-40 text-sm">← Prev</button>
                    <span className="text-sm font-medium text-gray-500">{data.page + 1} / {data.totalPages}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={data.last || isFetching} className="btn-outline py-2 px-5 disabled:opacity-40 text-sm">Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-5">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">{title}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-1.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

