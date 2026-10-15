import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  PackageCheck,
  Truck,
  ShieldCheck,
  TrendingUp,
  PlusCircle,
  Clock,
  CheckCircle,
  Database,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [redisHealth, setRedisHealth] = useState<any>(null);
  const [donorListings, setDonorListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const requests: Promise<any>[] = [
          api.get('/analytics/dashboard'),
          api.get('/notifications/activity?limit=6'),
          api.get('/analytics/redis-health'),
        ];

        if (user?.role === 'DONOR') {
          requests.push(api.get(`/food?donorId=${user.id}&limit=50`));
        } else if (user?.role === 'ADMIN') {
          requests.push(api.get(`/food?limit=50`));
        }

        const [dashRes, actRes, healthRes, listingsRes] = await Promise.all(requests);

        if (dashRes.data.success) {
          setStats(dashRes.data.stats);
          setRoleData(dashRes.data.roleSpecificData);

          const catData = Object.entries(dashRes.data.categoryDistribution).map(([name, count]) => ({
            name: name.replace('_', ' '),
            value: count,
          }));
          setCategories(catData);
        }

        if (actRes.data.success) {
          setRecentActivity(actRes.data.items);
        }

        if (healthRes.data.status === 'UP') {
          setRedisHealth(healthRes.data);
        }

        if (listingsRes && listingsRes.data.success) {
          setDonorListings(listingsRes.data.items);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const COLORS = ['#16a34a', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-200">
              Role: {user?.role}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 mt-1">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            {user?.organizationName ? `${user.organizationName} • ` : ''}FoodLoop Live Control Console
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user?.role === 'DONOR' && (
            <Link
              to="/listings/new"
              className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List New Surplus</span>
            </Link>
          )}

          {user?.role === 'RECIPIENT' && (
            <div className="flex items-center gap-2">
              <Link
                to="/reservations"
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <PackageCheck className="w-4 h-4" />
                <span>My Reservations</span>
              </Link>
              <Link
                to="/explore"
                className="px-4 py-2 bg-charcoal-50 hover:bg-charcoal-100 border border-charcoal-300 text-charcoal-800 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <UtensilsCrossed className="w-4 h-4 text-forest-600" />
                <span>Browse Food</span>
              </Link>
            </div>
          )}

          {user?.role === 'VOLUNTEER' && (
            <Link
              to="/pickups"
              className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Truck className="w-4 h-4" />
              <span>Available Delivery Tasks</span>
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Center</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-charcoal-500">
            <span>Available Listings</span>
            <UtensilsCrossed className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
            {stats?.availableListings || 0}
          </p>
          <p className="text-[11px] text-forest-700 font-medium mt-1">Ready for pickup</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-charcoal-500">
            <span>Active Reservations</span>
            <PackageCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
            {stats?.activeReservations || 0}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">Pending collection</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-charcoal-500">
            <span>Rescued Portions</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-2">
            {stats?.totalPortionsRescued || 0}
          </p>
          <p className="text-[11px] text-teal-700 font-medium mt-1">Meals saved from waste</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-charcoal-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-charcoal-500">
            <span>Redis Health</span>
            <Database className="w-4 h-4 text-forest-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-forest-700 mt-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-500" />
            {redisHealth?.status || 'HEALTHY'}
          </p>
          <p className="text-[11px] text-charcoal-500 mt-1">
            Memory: {redisHealth?.memoryUsed || '0B'} • AOF on
          </p>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Categories breakdown chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Rescued Food by Category
              </h3>
              <p className="text-xs text-charcoal-500">Live inventory breakdown stored in Redis</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                No categorical listings recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Live Redis Activity Log */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider">
                Live Audit Activity
              </h3>
              <p className="text-xs text-charcoal-500">Real-time Redis event stream</p>
            </div>
            <Activity className="w-4 h-4 text-forest-600 animate-pulse" />
          </div>

          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <div key={act.id} className="p-3 bg-charcoal-50 rounded-xl border border-charcoal-100 text-xs">
                  <div className="flex items-center justify-between text-charcoal-400 text-[10px] mb-1">
                    <span className="font-bold text-forest-700">{act.action}</span>
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-charcoal-800 leading-snug">{act.details}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-charcoal-400 text-center py-8">No recent activity logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Donor Listings Management Section */}
      {(user?.role === 'DONOR' || user?.role === 'ADMIN') && donorListings.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal-900">My Managed Food Listings</h3>
              <p className="text-xs text-charcoal-500">Edit or delete your surplus listings in Redis</p>
            </div>
            <Link
              to="/listings/new"
              className="px-3.5 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              + Add Listing
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-700">
              <thead className="bg-charcoal-50 text-charcoal-500 font-bold uppercase tracking-wider border-b border-charcoal-200">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available Qty</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {donorListings.map((item) => (
                  <tr key={item.id} className="hover:bg-charcoal-50/50">
                    <td className="py-3 px-4 font-bold text-charcoal-900">
                      <Link to={`/food/${item.id}`} className="hover:text-forest-600 transition-colors">
                        {item.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{item.category}</td>
                    <td className="py-3 px-4 font-semibold text-forest-700">{item.quantity} {item.quantityUnit}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/food/${item.id}`}
                          className="px-2.5 py-1 bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Edit / Delete
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipient Reservations Management Section */}
      {(user?.role === 'RECIPIENT' || user?.role === 'ADMIN') && (
        <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal-900">My Active Reservations</h3>
              <p className="text-xs text-charcoal-500">View passcodes or cancel reservations to return inventory to Redis</p>
            </div>
            <Link
              to="/reservations"
              className="px-3.5 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 rounded-xl text-xs font-bold transition-colors"
            >
              View All
            </Link>
          </div>

          <Link
            to="/reservations"
            className="block p-4 rounded-2xl bg-forest-50/60 border border-forest-200 hover:bg-forest-100/70 transition-all text-xs text-forest-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">Manage & Cancel Reservations →</span>
                <p className="text-charcoal-600 mt-0.5 text-[11px]">
                  Go to the dedicated Reservations page to cancel claims and restore food inventory to Redis.
                </p>
              </div>
              <span className="px-3 py-1.5 bg-forest-600 text-white font-bold rounded-xl text-xs shadow-xs">
                Open Reservations
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};
