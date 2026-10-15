import React, { useState } from 'react';
import { FoodListing, FoodCategory } from '../types';
import { api } from '../services/api';
import { X, AlertCircle } from 'lucide-react';

interface EditFoodModalProps {
  listing: FoodListing;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: FoodListing) => void;
}

export const EditFoodModal: React.FC<EditFoodModalProps> = ({ listing, isOpen, onClose, onUpdated }) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [category, setCategory] = useState<FoodCategory>(listing.category);
  const [quantity, setQuantity] = useState(listing.quantity);
  const [quantityUnit, setQuantityUnit] = useState(listing.quantityUnit);
  const [address, setAddress] = useState(listing.address);
  const [expirationTime, setExpirationTime] = useState(
    listing.expirationTime ? new Date(listing.expirationTime).toISOString().slice(0, 16) : ''
  );
  const [pickupStartTime, setPickupStartTime] = useState(
    listing.pickupStartTime ? new Date(listing.pickupStartTime).toISOString().slice(0, 16) : ''
  );
  const [pickupEndTime, setPickupEndTime] = useState(
    listing.pickupEndTime ? new Date(listing.pickupEndTime).toISOString().slice(0, 16) : ''
  );
  const [allergenInfo, setAllergenInfo] = useState(listing.allergenInfo || '');
  const [storageInstructions, setStorageInstructions] = useState(listing.storageInstructions || '');
  const [imageUrl, setImageUrl] = useState(listing.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.patch(`/food/${listing.id}`, {
        title,
        description,
        category,
        quantity: Number(quantity),
        quantityUnit,
        address,
        expirationTime: expirationTime ? new Date(expirationTime).toISOString() : undefined,
        pickupStartTime: pickupStartTime ? new Date(pickupStartTime).toISOString() : undefined,
        pickupEndTime: pickupEndTime ? new Date(pickupEndTime).toISOString() : undefined,
        allergenInfo: allergenInfo || undefined,
        storageInstructions: storageInstructions || undefined,
        imageUrl: imageUrl || undefined,
      });

      if (res.data.success) {
        onUpdated(res.data.food);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update food listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-charcoal-400 hover:text-charcoal-700 hover:bg-charcoal-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-charcoal-900 tracking-tight">Edit Food Listing</h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Update surplus details. Changes commit immediately to persistent Redis storage.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Food Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Available Quantity
              </label>
              <input
                type="number"
                required
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Unit
              </label>
              <input
                type="text"
                required
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Expiration Cutoff Time
              </label>
              <input
                type="datetime-local"
                required
                value={expirationTime}
                onChange={(e) => setExpirationTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Pickup Location / Address
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Pickup Start Time
              </label>
              <input
                type="datetime-local"
                value={pickupStartTime}
                onChange={(e) => setPickupStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Pickup End Time
              </label>
              <input
                type="datetime-local"
                value={pickupEndTime}
                onChange={(e) => setPickupEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Allergen Information
              </label>
              <input
                type="text"
                value={allergenInfo}
                onChange={(e) => setAllergenInfo(e.target.value)}
                placeholder="None or specify allergens"
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-charcoal-300 hover:bg-charcoal-50 text-charcoal-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {loading ? 'Saving to Redis...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
