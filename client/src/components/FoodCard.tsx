import React from 'react';
import { Link } from 'react-router-dom';
import { FoodListing } from '../types';
import { MapPin, Clock, Tag, User, ShieldCheck } from 'lucide-react';

interface FoodCardProps {
  listing: FoodListing;
}

export const FoodCard: React.FC<FoodCardProps> = ({ listing }) => {
  const isAvailable = listing.status === 'AVAILABLE' && listing.quantity > 0;
  const expiryDate = new Date(listing.expirationTime);
  const now = new Date();
  const hoursLeft = Math.max(0, Math.round((expiryDate.getTime() - now.getTime()) / 3600000));

  return (
    <div className="bg-white rounded-2xl border border-charcoal-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Food Image */}
      <div className="relative h-48 bg-charcoal-100 overflow-hidden">
        <img
          src={listing.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-charcoal-800 text-xs font-semibold rounded-full shadow-sm border border-charcoal-100 flex items-center gap-1">
            <Tag className="w-3 h-3 text-forest-600" />
            {listing.category.replace('_', ' ')}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm border ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isAvailable ? `${listing.quantity} ${listing.quantityUnit} left` : listing.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mb-1">
            <User className="w-3.5 h-3.5 text-charcoal-400" />
            <span className="font-medium text-charcoal-700 truncate">{listing.donorOrg || listing.donorName}</span>
          </div>

          <h3 className="text-base font-bold text-charcoal-900 group-hover:text-forest-600 transition-colors line-clamp-1 mb-1.5">
            {listing.title}
          </h3>

          <p className="text-xs text-charcoal-500 line-clamp-2 leading-relaxed mb-4">
            {listing.description}
          </p>
        </div>

        <div>
          <div className="space-y-1.5 border-t border-charcoal-100 pt-3 text-xs text-charcoal-600">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
              <span className="truncate">{listing.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className={hoursLeft < 3 ? 'text-amber-700 font-medium' : ''}>
                {hoursLeft > 0 ? `Expires in ~${hoursLeft} hours` : 'Expiring soon'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-charcoal-100 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-charcoal-400">Available: </span>
              <span className="font-bold text-forest-700">{listing.quantity} {listing.quantityUnit}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                to={`/food/${listing.id}`}
                className="px-3.5 py-1.5 bg-forest-50 hover:bg-forest-600 hover:text-white text-forest-700 rounded-lg text-xs font-semibold transition-colors duration-150"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
