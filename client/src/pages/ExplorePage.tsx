import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FoodListing, FoodCategory } from '../types';
import { FoodCard } from '../components/FoodCard';
import { Search, Filter, SlidersHorizontal, MapPin } from 'lucide-react';

const CATEGORIES: { label: string; value: FoodCategory | '' }[] = [
  { label: 'All Categories', value: '' },
  { label: 'Cooked Meals', value: 'COOKED_MEALS' },
  { label: 'Bakery', value: 'BAKERY' },
  { label: 'Produce', value: 'PRODUCE' },
  { label: 'Groceries', value: 'GROCERIES' },
  { label: 'Dairy', value: 'DAIRY' },
  { label: 'Beverages', value: 'BEVERAGES' },
  { label: 'Packaged', value: 'PACKAGED' },
];

export const ExplorePage: React.FC = () => {
  const [items, setItems] = useState<FoodListing[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'expiry' | 'newest'>('newest');
  const [loading, setLoading] = useState(true);

  const fetchFood = async () => {
    setLoading(true);
    try {
      let query = `/food?status=AVAILABLE&sortBy=${sortBy}`;
      if (category) query += `&category=${category}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(query);
      if (res.data.success) {
        setItems(res.data.items);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching food:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFood();
    }, 200);
    return () => clearTimeout(timer);
  }, [category, sortBy, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Explore Available Food
        </h1>
        <p className="text-charcoal-600 text-sm mt-1">
          Real-time surplus food listings ready for pickup. Claim portions before expiration.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-charcoal-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food by title, address, or donor..."
            className="w-full pl-10 pr-4 py-2 bg-charcoal-50 border border-charcoal-200 rounded-xl text-sm focus:outline-hidden focus:border-forest-600 focus:bg-white transition-all text-charcoal-800"
          />
        </div>

        {/* Category & Sorting Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-charcoal-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-charcoal-50 border border-charcoal-200 rounded-xl text-xs font-medium text-charcoal-700 focus:outline-hidden focus:border-forest-600"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-xs text-charcoal-500 ml-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-charcoal-50 border border-charcoal-200 rounded-xl text-xs font-medium text-charcoal-700 focus:outline-hidden focus:border-forest-600"
          >
            <option value="newest">Recently Added</option>
            <option value="expiry">Earliest Expiration</option>
          </select>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 bg-charcoal-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div>
          <div className="text-xs text-charcoal-500 mb-4 font-medium">
            Showing {items.length} of {total} available listings in Redis
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((listing) => (
              <FoodCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-charcoal-200 p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900 mb-1">No food listings found</h3>
          <p className="text-sm text-charcoal-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or check back later.
          </p>
        </div>
      )}
    </div>
  );
};
