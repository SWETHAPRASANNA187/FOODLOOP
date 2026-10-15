import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User as UserIcon, Building, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.patch('/auth/profile', {
        name,
        organizationName,
        phone,
        address,
      });

      if (res.data.success) {
        updateUser(res.data.user);
        setSuccessMsg('Profile updated successfully in Redis.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            User Profile & Settings
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage your organization information and contact details.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Account Role
            </label>
            <div className="inline-block px-3 py-1 bg-forest-50 border border-forest-200 text-forest-700 text-xs font-bold rounded-lg">
              {user?.role}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Email (Immutable Primary Key Index)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-charcoal-100 border border-charcoal-200 rounded-xl text-xs text-charcoal-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Full Name / Primary Contact
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Hope Community Shelter"
              className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, City"
                className="w-full px-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
