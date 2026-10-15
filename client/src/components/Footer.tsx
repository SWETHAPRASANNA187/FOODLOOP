import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Heart, ShieldCheck, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-charcoal-200 mt-20 text-charcoal-700 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-charcoal-900">FoodLoop</span>
            </div>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              Open-source real-time food rescue and redistribution network engineered entirely on Redis. Connecting surplus meals with hungry communities safely and immediately.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-forest-700 bg-forest-50 border border-forest-200 px-2.5 py-1 rounded-md w-fit">
              <Database className="w-3.5 h-3.5" />
              <span>Redis Only Architecture</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-charcoal-900 mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/explore" className="hover:text-forest-600 transition-colors">Explore Available Food</Link></li>
              <li><Link to="/how-it-works" className="hover:text-forest-600 transition-colors">How It Works</Link></li>
              <li><Link to="/register" className="hover:text-forest-600 transition-colors">Become a Donor</Link></li>
              <li><Link to="/register" className="hover:text-forest-600 transition-colors">Volunteer as a Courier</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-charcoal-900 mb-3">Technology</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-charcoal-600">Redis Hashes & Sets</span></li>
              <li><span className="text-charcoal-600">Atomic Lua Concurrency</span></li>
              <li><span className="text-charcoal-600">Dual AOF + RDB Durability</span></li>
              <li><span className="text-charcoal-600">Redis Streams Consumer Groups</span></li>
              <li><span className="text-charcoal-600">Socket.IO & Pub/Sub</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-charcoal-900 mb-3">Support & Open Source</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/help" className="hover:text-forest-600 transition-colors">Help Center & FAQ</Link></li>
              <li><Link to="/about" className="hover:text-forest-600 transition-colors">About the Project</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-forest-600 transition-colors">GitHub Repository</a></li>
              <li><span className="text-charcoal-500">MIT Open Source License</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-charcoal-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-500">
          <p>© {new Date().getFullYear()} FoodLoop Open Source Initiative. Zero food waste mission.</p>
          <div className="flex items-center gap-1 text-charcoal-600">
            <span>Built with precision for Redis and communities</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
