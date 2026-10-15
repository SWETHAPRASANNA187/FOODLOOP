import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: 'How does FoodLoop prevent food overselling?',
    a: 'Every reservation request executes an atomic Redis Lua script. The script verifies available quantity, checks the expiration timestamp against UTC epoch, and decrements the quantity atomically. No two requests can race or double-allocate inventory.',
  },
  {
    q: 'How does food expiration work?',
    a: 'Food listings are indexed into a Redis Sorted Set (food:expiry) with their expiration epoch as the score. A background worker periodically inspects candidates, updates eligible records to EXPIRED, and alerts the donor.',
  },
  {
    q: 'Is data stored in Redis persistent?',
    a: 'Yes. FoodLoop configures Redis with dual persistence: Append-Only File (AOF) with everysec sync for high durability, plus periodic RDB snapshot backups stored on a persistent volume.',
  },
  {
    q: 'How do recipients claim and collect the food?',
    a: 'Upon successful reservation, recipients receive a unique 6-digit pickup verification passcode. The courier or volunteer verifies this code at the handover point before marking the delivery as completed.',
  },
];

export const HelpPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
          Help Center & FAQs
        </h1>
        <p className="text-xs text-charcoal-500">
          Frequently asked questions and technical documentation for FoodLoop.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-charcoal-200 overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between text-xs font-bold text-charcoal-800 hover:text-forest-700"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-forest-600" /> : <ChevronDown className="w-4 h-4 text-charcoal-400" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-charcoal-600 leading-relaxed border-t border-charcoal-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Form */}
      <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-forest-600" />
          <span>Contact the FoodLoop Support Team</span>
        </h2>

        {submitted ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thank you! Your inquiry has been dispatched to the FoodLoop team.</span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.org"
                  className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1">Message</label>
              <textarea
                required
                rows={3}
                placeholder="How can we assist your shelter or kitchen?"
                className="w-full px-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
