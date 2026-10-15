import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { FoodListing } from '../types';
import { FoodCard } from '../components/FoodCard';
import { Leaf, ArrowRight, ShieldCheck, HeartHandshake, Zap, Clock, Users, Database } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [featuredFood, setFeaturedFood] = useState<FoodListing[]>([]);
  const [metrics, setMetrics] = useState({
    activeDonations: 0,
    portionsRescued: 0,
    partnerDonors: 0,
    successfulPickups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodRes, metricsRes] = await Promise.all([
          api.get('/food?status=AVAILABLE&limit=4'),
          api.get('/analytics/public'),
        ]);

        if (foodRes.data.success) {
          setFeaturedFood(foodRes.data.items);
        }
        if (metricsRes.data.success) {
          setMetrics(metricsRes.data.metrics);
        }
      } catch (err) {
        console.error('Error fetching landing data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-forest-600 animate-pulse" />
                Live Food Rescue Powered Strictly by Redis
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 tracking-tight leading-[1.15]">
                Good Food Deserves <br />
                <span className="text-forest-600 underline decoration-forest-200 underline-offset-8">
                  Another Chance.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-charcoal-600 max-w-2xl leading-relaxed">
                Connect surplus food with people who need it. Rescue meals, support communities, and reduce food waste through real-time food sharing.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/explore"
                  className="w-full sm:w-auto px-7 py-3.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Find Food</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/register"
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-charcoal-50 text-charcoal-800 border border-charcoal-300 rounded-xl font-semibold shadow-xs hover:border-charcoal-400 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <HeartHandshake className="w-4 h-4 text-forest-600" />
                  <span>Donate Food</span>
                </Link>
              </div>

              {/* Redis Architecture Trust Pill */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-charcoal-500">
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-forest-600" />
                  <span>Atomic Lua Concurrency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-forest-600" />
                  <span>AOF + RDB Durability</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Illustration/Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white">
                  <img
                    src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
                    alt="Volunteers rescuing and redistributing fresh meals"
                    className="w-full h-80 object-cover"
                  />
                  <div className="p-5 bg-gradient-to-br from-forest-50/50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-forest-600 text-white flex items-center justify-center font-bold">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs text-charcoal-500">Sub-millisecond latency</p>
                          <h4 className="text-sm font-bold text-charcoal-900">Zero Inventory Overselling</h4>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Redis Verified Impact Statistics */}
      <section className="bg-white border-y border-charcoal-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Live Redis Counters & Verified Impact
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 rounded-xl bg-forest-50/40 border border-forest-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 tracking-tight">
                {metrics.activeDonations}
              </p>
              <p className="text-xs sm:text-sm font-medium text-charcoal-600 mt-1">Active Donations</p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50/40 border border-forest-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 tracking-tight">
                {metrics.portionsRescued}
              </p>
              <p className="text-xs sm:text-sm font-medium text-charcoal-600 mt-1">Portions Rescued</p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50/40 border border-forest-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 tracking-tight">
                {metrics.partnerDonors}
              </p>
              <p className="text-xs sm:text-sm font-medium text-charcoal-600 mt-1">Partner Donors</p>
            </div>

            <div className="p-4 rounded-xl bg-forest-50/40 border border-forest-100">
              <p className="text-3xl sm:text-4xl font-extrabold text-forest-700 tracking-tight">
                {metrics.successfulPickups}
              </p>
              <p className="text-xs sm:text-sm font-medium text-charcoal-600 mt-1">Pickups Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Available Food */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-forest-600 text-xs font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Available Right Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 mt-1">
              Fresh Listings Awaiting Rescue
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-sm font-semibold text-forest-600 hover:text-forest-700 flex items-center gap-1 group"
          >
            <span>View all listings</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 bg-charcoal-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : featuredFood.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFood.map((listing) => (
              <FoodCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-charcoal-200">
            <p className="text-charcoal-500 text-sm">No food listings active right now. Check back shortly!</p>
          </div>
        )}
      </section>

      {/* Three Step How It Works Section */}
      <section className="bg-forest-50/50 py-20 border-y border-forest-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-700">Simple & Rapid</span>
            <h2 className="text-3xl font-extrabold text-charcoal-900 mt-1">
              How FoodLoop Works in 3 Steps
            </h2>
            <p className="text-charcoal-600 text-sm mt-3">
              Designed for restaurants, bakeries, hostels, shelters and volunteers to rescue food before it expires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-charcoal-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xl mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2">Donors List Surplus</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Bakeries, cafeterias, and hotels list extra edible meals with quantity, dietary details, and pickup windows.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-charcoal-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xl mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2">Atomic Reservation</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                NGOs, community kitchens, or hostels claim portions instantly. Redis Lua scripts guarantee no inventory overselling.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-charcoal-200 shadow-xs flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-xl mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-charcoal-900 mb-2">Volunteer Delivery</h3>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                Volunteer dispatch coordinates collection and verifies handover with a secure digital verification code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-forest-700 to-forest-800 rounded-3xl p-8 sm:p-14 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to eliminate food waste in your community?
            </h3>
            <p className="text-forest-100 text-sm leading-relaxed">
              Join local businesses, student hostels, and shelters already redistributing surplus meals safely every day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              to="/register"
              className="px-6 py-3.5 bg-white text-forest-800 hover:bg-forest-50 font-bold rounded-xl text-center text-sm shadow-md transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              to="/how-it-works"
              className="px-6 py-3.5 bg-forest-600/50 hover:bg-forest-600 border border-forest-400 text-white font-medium rounded-xl text-center text-sm transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
