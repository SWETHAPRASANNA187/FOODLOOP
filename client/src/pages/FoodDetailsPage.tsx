import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FoodListing } from '../types';
import { MapPin, Clock, Tag, User, ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, Lock, Edit3, Trash2 } from 'lucide-react';
import { EditFoodModal } from '../components/EditFoodModal';

export const FoodDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [food, setFood] = useState<FoodListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserveQty, setReserveQty] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ pickupCode: string } | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!food) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${food.title}"? This cannot be undone and will be removed immediately from Redis.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await api.delete(`/food/${food.id}`);
      if (res.data.success) {
        navigate('/explore');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete food listing');
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await api.get(`/food/${id}`);
        if (res.data.success) {
          setFood(res.data.food);
        }
      } catch (err: any) {
        setErrorMsg('Food listing could not be found.');
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'RECIPIENT' && user.role !== 'ADMIN') {
      setErrorMsg('Only registered RECIPIENT organizations or ADMINs can reserve food.');
      return;
    }

    setReserving(true);
    setErrorMsg('');

    try {
      // Send atomic reservation request to backend Redis Lua processor
      const idempotencyKey = `user_${user.id}_food_${id}_${Date.now()}`;
      const res = await api.post('/reservations', {
        foodId: id,
        quantity: reserveQty,
        idempotencyKey,
      });

      if (res.data.success) {
        setSuccessInfo({ pickupCode: res.data.reservation.pickupCode });
        // Refresh local listing quantity
        if (food) {
          setFood({
            ...food,
            quantity: Math.max(0, food.quantity - reserveQty),
            status: food.quantity - reserveQty === 0 ? 'RESERVED' : food.status,
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to complete reservation.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-charcoal-600">Listing not found or expired.</p>
      </div>
    );
  }

  const isAvailable = food.status === 'AVAILABLE' && food.quantity > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl overflow-hidden border border-charcoal-200 bg-charcoal-100 h-80 relative shadow-sm">
            <img
              src={food.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'}
              alt={food.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-charcoal-800 text-xs font-semibold rounded-full shadow-sm border border-charcoal-100 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-forest-600" />
                {food.category.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-charcoal-500 mb-1">
                <User className="w-4 h-4 text-charcoal-400" />
                <span>Donated by <strong className="text-charcoal-800">{food.donorOrg || food.donorName}</strong></span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                {food.title}
              </h1>
            </div>

            {/* Donor Ownership & Admin Controls */}
            {(user?.id === food.donorId || user?.role === 'ADMIN') && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="px-3.5 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Listing</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleting ? 'Deleting...' : 'Delete Listing'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-charcoal-200 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">About this Donation</h3>
            <p className="text-sm text-charcoal-600 leading-relaxed whitespace-pre-line">
              {food.description}
            </p>

            {food.allergenInfo && (
              <div className="pt-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <strong>Allergen Notice:</strong> {food.allergenInfo}
              </div>
            )}

            {food.storageInstructions && (
              <div className="text-xs text-charcoal-700 bg-charcoal-50 p-3 rounded-xl border border-charcoal-200">
                <strong>Storage Instructions:</strong> {food.storageInstructions}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-charcoal-200 space-y-3 shadow-xs text-xs text-charcoal-600">
            <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider mb-2">Location & Schedule</h3>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-charcoal-400 shrink-0 mt-0.5" />
              <span>{food.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-forest-600 shrink-0 mt-0.5" />
              <span>Pickup Window: {new Date(food.pickupStartTime).toLocaleString()} – {new Date(food.pickupEndTime).toLocaleString()}</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>Expiration Date: {new Date(food.expirationTime).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Reservation Action Card */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-md sticky top-24 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-charcoal-100">
              <div>
                <p className="text-xs text-charcoal-500">Currently Available</p>
                <p className="text-2xl font-extrabold text-forest-700">
                  {food.quantity} <span className="text-sm font-semibold text-charcoal-600">{food.quantityUnit}</span>
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700'
                }`}
              >
                {food.status}
              </span>
            </div>

            {successInfo ? (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">Reservation Confirmed!</h4>
                <p className="text-xs text-emerald-800">
                  Your reservation was atomically allocated in Redis. An automated courier pickup task has been created.
                </p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-charcoal-500 uppercase font-bold tracking-wider">Pickup Verification Code</p>
                  <p className="text-2xl font-mono font-black text-charcoal-900 tracking-widest">{successInfo.pickupCode}</p>
                </div>
                <button
                  onClick={() => navigate('/reservations')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  View in My Reservations
                </button>
              </div>
            ) : isAvailable ? (
              <form onSubmit={handleReserve} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5">
                    Quantity to Reserve ({food.quantityUnit})
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={food.quantity}
                      value={reserveQty}
                      onChange={(e) => setReserveQty(Math.max(1, Math.min(food.quantity, parseInt(e.target.value) || 1)))}
                      className="w-full px-3.5 py-2.5 border border-charcoal-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:border-forest-600"
                    />
                    <button
                      type="button"
                      onClick={() => setReserveQty(food.quantity)}
                      className="px-3 py-2.5 bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 text-xs font-semibold rounded-xl"
                    >
                      Max
                    </button>
                  </div>
                  <p className="text-[11px] text-charcoal-400 mt-1">
                    Atomic reservation with Lua guarantees zero overselling.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={reserving}
                  className="w-full py-3.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{reserving ? 'Processing in Redis...' : `Reserve ${reserveQty} ${food.quantityUnit}`}</span>
                </button>

                {!user && (
                  <p className="text-xs text-center text-charcoal-500">
                    You will be prompted to log in as a recipient to complete this reservation.
                  </p>
                )}
              </form>
            ) : (
              <div className="p-4 bg-charcoal-50 rounded-2xl text-center text-xs text-charcoal-500">
                This food listing has already been completely reserved or expired.
              </div>
            )}

            <div className="pt-4 border-t border-charcoal-100 space-y-2 text-xs text-charcoal-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-forest-600" />
                <span>Verified hygienic standards & food safety</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-forest-600" />
                <span>Immediate volunteer dispatch notification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Food Modal */}
      {food && (
        <EditFoodModal
          listing={food}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdated={(updated) => setFood(updated)}
        />
      )}
    </div>
  );
};
