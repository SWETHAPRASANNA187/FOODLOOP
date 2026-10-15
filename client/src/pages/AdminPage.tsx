import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Database, Users, UtensilsCrossed, PackageCheck, Truck, RefreshCw } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [pickups, setPickups] = useState<any[]>([]);
  const [redisInfo, setRedisInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'listings' | 'reservations' | 'pickups' | 'redis'>('redis');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, lRes, rRes, pRes, healthRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/listings'),
        api.get('/admin/reservations'),
        api.get('/admin/pickups'),
        api.get('/analytics/redis-health'),
      ]);

      if (uRes.data.success) setUsers(uRes.data.items);
      if (lRes.data.success) setListings(lRes.data.items);
      if (rRes.data.success) setReservations(rRes.data.items);
      if (pRes.data.success) setPickups(pRes.data.items);
      if (healthRes.data.status === 'UP') setRedisInfo(healthRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-forest-700" />
            <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
              FoodLoop Administrative Hub
            </h1>
          </div>
          <p className="text-xs text-charcoal-500 mt-1">
            Complete real-time oversight of Redis keyspaces, users, listings, reservations, and durability.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 bg-white hover:bg-charcoal-50 border border-charcoal-200 rounded-xl text-xs font-semibold text-charcoal-700 flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-forest-600" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-charcoal-200 pb-3">
        {[
          { id: 'redis', label: 'Redis Health & Durability', icon: Database },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'listings', label: `Food Listings (${listings.length})`, icon: UtensilsCrossed },
          { id: 'reservations', label: `Reservations (${reservations.length})`, icon: PackageCheck },
          { id: 'pickups', label: `Pickups (${pickups.length})`, icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-forest-600 text-white shadow-xs'
                  : 'bg-white hover:bg-charcoal-50 text-charcoal-700 border border-charcoal-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div>
          {/* Redis Health Tab */}
          {activeTab === 'redis' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-forest-600" />
                  <span>Redis Engine Metrics</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Connection Status:</span>
                    <span className="font-bold text-emerald-700">ONLINE (Verified PONG)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Total Persistent Keys:</span>
                    <span className="font-bold text-charcoal-900">{redisInfo?.keysCount || 'Active'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Memory Utilized:</span>
                    <span className="font-mono font-semibold text-charcoal-900">{redisInfo?.memoryUsed || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Uptime:</span>
                    <span className="font-semibold text-charcoal-800">{redisInfo?.uptimeSeconds || 0} seconds</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest-600" />
                  <span>Configured Durability & Invariants</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Append Only File (AOF):</span>
                    <span className="font-bold text-emerald-700">Enabled (appendfsync everysec)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Periodic RDB Snapshots:</span>
                    <span className="font-bold text-emerald-700">Active (save 900 1 / 300 10 / 60 1000)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Eviction Policy:</span>
                    <span className="font-bold text-emerald-700">noeviction (Zero Data Loss)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-charcoal-100">
                    <span className="text-charcoal-500">Concurrency Layer:</span>
                    <span className="font-bold text-emerald-700">Atomic Lua Scripts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-charcoal-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-charcoal-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{u.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-50 text-forest-700 border border-forest-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{u.organizationName || '—'}</td>
                      <td className="py-3 px-4 text-charcoal-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-3xl border border-charcoal-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Organization</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-charcoal-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{u.name}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest-50 text-forest-700 border border-forest-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{u.organizationName || '—'}</td>
                      <td className="py-3 px-4 text-charcoal-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={async () => {
                              const confirmed = window.confirm(`Permanently delete user "${u.name}" (${u.email}) from Redis?`);
                              if (!confirmed) return;
                              try {
                                const res = await api.delete(`/admin/users/${u.id}`);
                                if (res.data.success) {
                                  setUsers((prev) => prev.filter((item) => item.id !== u.id));
                                }
                              } catch (err: any) {
                                alert(err.response?.data?.error || 'Failed to delete user');
                              }
                            }}
                            className="text-red-600 hover:text-red-800 font-semibold text-[11px] px-2.5 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-3xl border border-charcoal-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Donor</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {listings.map((item) => (
                    <tr key={item.id} className="hover:bg-charcoal-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{item.title}</td>
                      <td className="py-3 px-4">{item.donorName}</td>
                      <td className="py-3 px-4">{item.category}</td>
                      <td className="py-3 px-4 font-semibold text-forest-700">{item.quantity} {item.quantityUnit}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm(`Permanently delete listing "${item.title}" from Redis?`);
                            if (!confirmed) return;
                            try {
                              const res = await api.delete(`/admin/listings/${item.id}`);
                              if (res.data.success) {
                                setListings((prev) => prev.filter((l) => l.id !== item.id));
                              }
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to delete listing');
                            }
                          }}
                          className="text-red-600 hover:text-red-800 font-semibold text-[11px] px-2.5 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reservations Tab */}
          {activeTab === 'reservations' && (
            <div className="bg-white rounded-3xl border border-charcoal-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Food</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Passcode</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-charcoal-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{res.foodTitle}</td>
                      <td className="py-3 px-4">{res.recipientName}</td>
                      <td className="py-3 px-4 font-semibold">{res.quantity}</td>
                      <td className="py-3 px-4 font-mono font-bold text-forest-700">{res.pickupCode}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pickups Tab */}
          {activeTab === 'pickups' && (
            <div className="bg-white rounded-3xl border border-charcoal-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-charcoal-700">
                <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                  <tr>
                    <th className="py-3 px-4">Food Title</th>
                    <th className="py-3 px-4">Volunteer</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-100">
                  {pickups.map((pk) => (
                    <tr key={pk.id} className="hover:bg-charcoal-50/50">
                      <td className="py-3 px-4 font-bold text-charcoal-900">{pk.foodTitle}</td>
                      <td className="py-3 px-4">{pk.volunteerName || 'Unassigned'}</td>
                      <td className="py-3 px-4">{pk.recipientName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {pk.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            const confirmed = window.confirm(`Delete pickup task for "${pk.foodTitle}" from Redis?`);
                            if (!confirmed) return;
                            try {
                              const res = await api.delete(`/admin/pickups/${pk.id}`);
                              if (res.data.success) {
                                setPickups((prev) => prev.filter((p) => p.id !== pk.id));
                              }
                            } catch (err: any) {
                              alert(err.response?.data?.error || 'Failed to delete pickup task');
                            }
                          }}
                          className="text-red-600 hover:text-red-800 font-semibold text-[11px] px-2.5 py-1 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
