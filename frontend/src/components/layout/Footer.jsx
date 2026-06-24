import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiInstagram, FiMail } from 'react-icons/fi';
import { MdDirectionsCar } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ background: 'linear-gradient(135deg,#0F172A,#134E4A)', color: '#fff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0F766E,#14B8A6)' }}>
                <MdDirectionsCar className="text-white w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white" style={{ fontFamily: 'Space Grotesk,sans-serif' }}>GramGo</div>
                <div className="text-[9px] tracking-widest text-teal-300">RENT · RIDE · RETURN</div>
              </div>
            </Link>
            <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
              The premier platform for vehicle rentals — cars, bikes, SUVs, trucks and more. Drive your journey.
            </p>
            <div className="flex gap-3 mt-5">
              {[FiGithub, FiTwitter, FiInstagram, FiMail].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:bg-white/15 hover:text-white transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                { label: 'Browse Vehicles',    to: '/events' },
                { label: 'Renter Sign Up',     to: '/register' },
                { label: 'Fleet Owner Sign Up',to: '/register?role=organizer' },
                { label: 'Sign In',            to: '/login' },
              ].map((l) => (
                <li key={l.to}><Link to={l.to} className="hover:text-teal-300 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Vehicle Types</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              {[
                ['Cars',       'CAR'],
                ['Bikes',      'BIKE'],
                ['SUVs',       'SUV'],
                ['Trucks',     'TRUCK'],
                ['Vans',       'VAN'],
              ].map(([label, cat]) => (
                <li key={cat}><Link to={`/events?category=${cat}`} className="hover:text-teal-300 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} GramGo. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

