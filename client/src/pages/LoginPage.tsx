import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Leaf, AlertCircle, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-charcoal-900 tracking-tight">
            Sign in to FoodLoop
          </h2>
          <p className="text-xs text-charcoal-500">
            Access real-time surplus redistribution & community rescue operations
          </p>
        </div>

        {/* Demo Credentials Quick-Select Pill */}
        <div className="bg-forest-50/70 border border-forest-200 p-3.5 rounded-2xl space-y-2">
          <p className="text-[11px] font-bold text-forest-900 uppercase tracking-wider">
            Quick Demo Accounts (Password: Password123!)
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@foodloop.org')}
              className="px-2 py-1 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-forest-800 text-left font-medium truncate"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('sunrise@bakery.com')}
              className="px-2 py-1 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-forest-800 text-left font-medium truncate"
            >
              🥖 Donor (Bakery)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('shelter@hopecommunity.org')}
              className="px-2 py-1 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-forest-800 text-left font-medium truncate"
            >
              🤝 Recipient (NGO)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('alex.volunteer@gmail.com')}
              className="px-2 py-1 bg-white hover:bg-forest-100 border border-forest-200 rounded-lg text-forest-800 text-left font-medium truncate"
            >
              🚴 Volunteer
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-charcoal-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-sm focus:outline-hidden focus:border-forest-600 focus:bg-white transition-all text-charcoal-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-charcoal-50 border border-charcoal-300 rounded-xl text-sm focus:outline-hidden focus:border-forest-600 focus:bg-white transition-all text-charcoal-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-charcoal-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-forest-600 hover:text-forest-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
