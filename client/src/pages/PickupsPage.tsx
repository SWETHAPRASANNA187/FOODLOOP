import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PickupTask } from '../types';
import { Truck, MapPin, CheckCircle2, AlertCircle, ArrowRight, User } from 'lucide-react';

export const PickupsPage: React.FC = () => {
  const { user } = useAuth();
  const [availableTasks, setAvailableTasks] = useState<PickupTask[]>([]);
  const [myTasks, setMyTasks] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTasks = async () => {
    try {
      const [availRes, myRes] = await Promise.all([
        api.get('/pickups/available'),
        api.get('/pickups/my'),
      ]);

      if (availRes.data.success) {
        setAvailableTasks(availRes.data.items);
      }
      if (myRes.data.success) {
        setMyTasks(myRes.data.items);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (taskId: string) => {
    setClaimingId(taskId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/pickups/${taskId}/accept`);
      if (res.data.success) {
        setSuccessMsg('Task accepted! You are now assigned to collect and deliver this donation.');
        fetchTasks();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to claim task. Another volunteer may have claimed it.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.patch(`/pickups/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        setSuccessMsg(`Status updated to ${newStatus}`);
        fetchTasks();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update delivery status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
          Courier & Volunteer Delivery Center
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Atomic single-volunteer task claiming and real-time status dispatch.
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

      {/* Assigned to me */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
          <Truck className="w-4 h-4 text-forest-600" />
          <span>My Active Deliveries ({myTasks.length})</span>
        </h2>

        {myTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTasks.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-forest-50 text-forest-700 border border-forest-200">
                    {t.status}
                  </span>
                  <span className="text-[11px] text-charcoal-400">ID: {t.id}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">{t.foodTitle}</h3>
                  <p className="text-xs text-charcoal-600 mt-0.5">Recipient: {t.recipientName}</p>
                </div>

                <div className="text-xs space-y-1.5 text-charcoal-600 border-t border-charcoal-100 pt-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Pickup from:</strong> {t.donorAddress}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
                    <span><strong>Deliver to:</strong> {t.recipientAddress}</span>
                  </div>
                </div>

                {t.status !== 'DELIVERED' && (
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    {t.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'IN_TRANSIT')}
                        disabled={updatingId === t.id}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Start Transit (Food Collected)
                      </button>
                    )}
                    {t.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'DELIVERED')}
                        disabled={updatingId === t.id}
                        className="w-full py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Confirm Handover & Delivery
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const confirmed = window.confirm('Release this delivery task back to the available volunteer pool?');
                        if (!confirmed) return;
                        setUpdatingId(t.id);
                        try {
                          const res = await api.patch(`/pickups/${t.id}/cancel`);
                          if (res.data.success) {
                            setSuccessMsg('Pickup task released back to available pool.');
                            fetchTasks();
                          }
                        } catch (err: any) {
                          setErrorMsg(err.response?.data?.error || 'Failed to release pickup');
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                      disabled={updatingId === t.id}
                      className="py-2 px-3 border border-charcoal-200 hover:bg-charcoal-50 text-charcoal-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Release Task
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-charcoal-200 text-center text-xs text-charcoal-500">
            You do not have any active pickups assigned.
          </div>
        )}
      </div>

      {/* Available for claiming */}
      <div className="space-y-4 pt-4">
        <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
          <span>Available Tasks in Redis Ready for Pickup ({availableTasks.length})</span>
        </h2>

        {availableTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableTasks.map((task) => (
              <div key={task.id} className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-charcoal-400">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                      OPEN FOR VOLUNTEER
                    </span>
                    <span>{new Date(task.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <h3 className="text-sm font-bold text-charcoal-900">{task.foodTitle}</h3>

                  <div className="text-xs space-y-1.5 text-charcoal-600 border-t border-charcoal-100 pt-3">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>From:</strong> {task.donorAddress}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0 mt-0.5" />
                      <span><strong>To:</strong> {task.recipientAddress}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claimingId === task.id}
                  className="w-full py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{claimingId === task.id ? 'Claiming in Redis...' : 'Accept Pickup Task'}</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-charcoal-200 text-center text-xs text-charcoal-500">
            No pending pickups available right now. Check back as new reservations are placed!
          </div>
        )}
      </div>
    </div>
  );
};
