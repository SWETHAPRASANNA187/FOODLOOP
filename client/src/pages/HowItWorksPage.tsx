import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, HeartHandshake, Truck, ShieldCheck, Database, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
          FoodLoop Workflow Architecture
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          How FoodLoop Rescues Meals in Real Time
        </h1>
        <p className="text-sm text-charcoal-600 leading-relaxed">
          From donor excess to recipient table in hours — powered by Redis atomic data structures, sub-millisecond Pub/Sub events, and verified volunteer logistics.
        </p>
      </div>

      {/* Step by Step Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <h3 className="text-base font-bold text-charcoal-900">Donors List Surplus</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Bakeries, banquet halls, catering companies, and university dining centers post surplus meals. FoodLoop indexes the items by status, category, donor, and UTC expiration time in Redis.
          </p>
          <ul className="text-xs text-charcoal-500 space-y-1 list-disc list-inside">
            <li>Expiration cutoff monitoring</li>
            <li>Allergen labeling & packaging guidance</li>
            <li>Stored in persistent Redis Hashes</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-lg">
            2
          </div>
          <h3 className="text-base font-bold text-charcoal-900">Atomic Reservation</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Verified NGO shelters and community organizations discover available food and submit a claim. A single Redis Lua script evaluates expiry and inventory atomically.
          </p>
          <ul className="text-xs text-charcoal-500 space-y-1 list-disc list-inside">
            <li>Zero overselling race conditions</li>
            <li>Generates a secure 6-digit pickup passcode</li>
            <li>Idempotency prevents double booking</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center font-bold text-lg">
            3
          </div>
          <h3 className="text-base font-bold text-charcoal-900">Courier Dispatch</h3>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            A pickup task is published to the volunteer network via Redis Pub/Sub. When a volunteer claims the task, atomic claiming ensures only one driver can accept.
          </p>
          <ul className="text-xs text-charcoal-500 space-y-1 list-disc list-inside">
            <li>Live in-transit tracking</li>
            <li>Digital verification at handover</li>
            <li>Automatic donor impact reporting</li>
          </ul>
        </div>
      </div>

      {/* Redis Role Explanation */}
      <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">Why Redis is the Primary Database</h2>
            <p className="text-xs text-charcoal-500">Durability, Atomicity, and Ultra-low Latency</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-charcoal-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-charcoal-800">Atomic Inventory Protection</h4>
            <p>
              Traditional relational or document databases require distributed locks or high transaction isolation levels to prevent overselling perishable inventory. In FoodLoop, Redis executes custom Lua scripts that atomically decrement remaining portions, transition listing statuses, and record reservations in a single sub-millisecond atomic step.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-charcoal-800">Dual Persistence (AOF + RDB)</h4>
            <p>
              Redis is configured with Append-Only File (<code className="bg-charcoal-100 px-1 py-0.5 rounded">appendfsync everysec</code>) and regular RDB point-in-time snapshots to ensure that all user registrations, food listings, and reservations survive container restarts and system reboots.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
