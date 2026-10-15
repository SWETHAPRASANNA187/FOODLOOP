import React from 'react';
import { Leaf, Database, ShieldCheck, Heart, Users, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
          <Leaf className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          About FoodLoop
        </h1>
        <p className="text-sm text-charcoal-600 max-w-xl mx-auto">
          An open-source technology platform engineered to bridge the gap between commercial surplus and local food insecurity.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-xs space-y-6 text-sm text-charcoal-600 leading-relaxed">
        <h2 className="text-lg font-bold text-charcoal-900">Our Mission</h2>
        <p>
          Every day, millions of tons of freshly prepared, highly nutritious food are discarded simply because restaurants and event venues lack a safe, instant mechanism to coordinate collection before food expires.
        </p>
        <p>
          FoodLoop transforms surplus food into accessible community meals. By giving donors a frictionless listing portal, verified recipients direct reservation channels, and volunteers an agile dispatch board, food waste is intercepted at the source.
        </p>

        <h2 className="text-lg font-bold text-charcoal-900 pt-4">Redis Architectural Decision</h2>
        <p>
          Unlike conventional web applications that rely on relational SQL tables or document databases with eventual consistency, FoodLoop chose <strong>Redis as its sole, primary application database</strong>.
        </p>
        <p>
          Redis provides the deterministic single-threaded atomicity needed to ensure that no two recipients can ever simultaneously claim the same final portion of food, while Redis Pub/Sub and Streams provide instantaneous event distribution across the courier network without polling delays.
        </p>
      </div>
    </div>
  );
};
