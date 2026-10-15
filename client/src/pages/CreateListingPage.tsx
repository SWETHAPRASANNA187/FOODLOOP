import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { FoodCategory } from '../types';
import { PlusCircle, AlertCircle, ArrowRight, Utensils, Calendar, MapPin, Info } from 'lucide-react';

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();

  const now = new Date();
  const defaultPrep = now.toISOString().slice(0, 16);
  const defaultExp = new Date(now.getTime() + 12 * 3600000).toISOString().slice(0, 16);
  const defaultPickupStart = new Date(now.getTime() + 30 * 60000).toISOString().slice(0, 16);
  const defaultPickupEnd = new Date(now.getTime() + 8 * 3600000).toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('COOKED_MEALS');
  const [quantity, setQuantity] = useState<number>(20);
  const [quantityUnit, setQuantityUnit] = useState('portions');
  const [preparedTime, setPreparedTime] = useState(defaultPrep);
  const [expirationTime, setExpirationTime] = useState(defaultExp);
  const [pickupStartTime, setPickupStartTime] = useState(defaultPickupStart);
  const [pickupEndTime, setPickupEndTime] = useState(defaultPickupEnd);
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [allergenInfo, setAllergenInfo] = useState('');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/food', {
        title,
        description,
        category,
        quantity: Number(quantity),
        quantityUnit,
        preparedTime: new Date(preparedTime).toISOString(),
        expirationTime: new Date(expirationTime).toISOString(),
        pickupStartTime: new Date(pickupStartTime).toISOString(),
        pickupEndTime: new Date(pickupEndTime).toISOString(),
        address,
        imageUrl: imageUrl || undefined,
        allergenInfo: allergenInfo || undefined,
        storageInstructions: storageInstructions || undefined,
      });

      if (res.data.success) {
        navigate(`/food/${res.data.food.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create food listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs font-semibold mb-2">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Donor Surplus Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            List Edible Surplus Food
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Publish freshly prepared meals or surplus baked items directly into Redis for immediate community claiming.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Food Title / Description Headline
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Portions of Steamed Vegetable Dumplings"
              className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-forest-600"
              >
                <option value="COOKED_MEALS">Cooked Meals</option>
                <option value="BAKERY">Bakery</option>
                <option value="GROCERIES">Groceries</option>
                <option value="PRODUCE">Fresh Produce</option>
                <option value="DAIRY">Dairy</option>
                <option value="BEVERAGES">Beverages</option>
                <option value="PACKAGED">Packaged Items</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Unit (portions, kg, boxes)
              </label>
              <input
                type="text"
                required
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                placeholder="portions"
                className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Detailed Food Description & Packaging
            </label>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe ingredients, packaging type, temperature handling, etc."
              className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Pickup Start Window
              </label>
              <input
                type="datetime-local"
                required
                value={pickupStartTime}
                onChange={(e) => setPickupStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Pickup End Window
              </label>
              <input
                type="datetime-local"
                required
                value={pickupEndTime}
                onChange={(e) => setPickupEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Prepared Time
              </label>
              <input
                type="datetime-local"
                required
                value={preparedTime}
                onChange={(e) => setPreparedTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Food Expiration Cutoff
              </label>
              <input
                type="datetime-local"
                required
                value={expirationTime}
                onChange={(e) => setExpirationTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Pickup Address & Instructions
            </label>
            <input
              type="text"
              required
              minLength={5}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 42 Baker Street, Kitchen Service Entrance"
              className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Allergen Notices (Optional)
              </label>
              <input
                type="text"
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                placeholder="Contains nuts, dairy, gluten, etc."
                className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Committing to Redis...' : 'Publish Surplus Food Listing'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
