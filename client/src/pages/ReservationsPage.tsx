import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Reservation } from '../types';
import { PackageCheck, AlertCircle, XCircle, Clock, CheckCircle2 } from 'lucide-react';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReservations = async () => {
    try {
      const res = await api.get('/reservations/my');
      if (res.data.success) {
        setReservations(res.data.items);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (resId: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? The reserved inventory will be atomically returned to Redis.')) {
      return;
    }

    setCancellingId(resId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/reservations/${resId}/cancel`);
      if (res.data.success) {
        setSuccessMsg(res.data.message || 'Reservation cancelled and inventory restored.');
        fetchReservations();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
          My Food Reservations
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Track active rescue reservations, handover verification codes, and collection status.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => {
            const isPending = res.status === 'PENDING';
            const isCancelled = res.status === 'CANCELLED';
            const isCompleted = res.status === 'COMPLETED';

            return (
              <div
                key={res.id}
                className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPending
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isCancelled
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {res.status}
                    </span>
                    <span className="text-[11px] text-charcoal-400">
                      ID: {res.id} • {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-charcoal-900">{res.foodTitle}</h3>
                  <p className="text-xs text-charcoal-600">
                    Quantity Reserved: <strong className="text-forest-700">{res.quantity} portions</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-end">
                  {!isCancelled && (
                    <div className="bg-forest-50/70 border border-forest-200 px-3.5 py-2 rounded-xl text-center">
                      <p className="text-[10px] text-charcoal-500 uppercase font-semibold">Pickup Passcode</p>
                      <p className="text-lg font-mono font-black text-forest-800 tracking-wider">
                        {res.pickupCode}
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      disabled={cancellingId === res.id}
                      className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{cancellingId === res.id ? 'Restoring inventory...' : 'Cancel Reservation'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-charcoal-200 text-center">
          <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center mx-auto mb-3">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-charcoal-900">No Reservations Yet</h3>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
            You have not placed any reservations yet. Browse available meals to start rescuing food!
          </p>
        </div>
      )}
    </div>
  );
};
