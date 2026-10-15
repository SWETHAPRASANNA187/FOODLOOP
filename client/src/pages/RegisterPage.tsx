import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Leaf, AlertCircle, ArrowRight, User, Mail, Lock, Building, Phone, MapPin } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('RECIPIENT');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        organizationName,
        phone,
        address,
      });

      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Join the FoodLoop Network
          </h2>
          <p className="text-xs text-charcoal-500">
            Select your role to start donating, rescuing, or delivering food
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Role Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
                I want to join as a:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'DONOR', label: 'Donor', desc: 'Bakery / Kitchen' },
                  { value: 'RECIPIENT', label: 'Recipient', desc: 'Shelter / NGO' },
                  { value: 'VOLUNTEER', label: 'Volunteer', desc: 'Courier / Driver' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRole(item.value as UserRole)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      role === item.value
                        ? 'border-forest-600 bg-forest-50/60 ring-2 ring-forest-500/20'
                        : 'border-charcoal-200 hover:border-charcoal-300'
                    }`}
                  >
                    <p className={`text-xs font-bold ${role === item.value ? 'text-forest-900' : 'text-charcoal-800'}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-charcoal-500 mt-0.5 leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Full Name / Contact
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.org"
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                Password (min 6 chars)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                />
              </div>
            </div>

            {(role === 'DONOR' || role === 'RECIPIENT') && (
              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Organization / Business Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Hope Community Shelter or Green Bakery"
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0199"
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 River Street, City"
                    className="w-full pl-9 pr-3 py-2 bg-charcoal-50 border border-charcoal-300 rounded-xl text-xs focus:outline-hidden focus:border-forest-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account in Redis...' : 'Create FoodLoop Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-charcoal-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-forest-600 hover:text-forest-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
