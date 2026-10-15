import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Bell, User as UserIcon, LogOut, PlusCircle, LayoutDashboard, UtensilsCrossed } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-charcoal-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 group-hover:bg-forest-600 group-hover:text-white transition-colors duration-200">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-charcoal-900">Food<span className="text-forest-600">Loop</span></span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-mint-50 text-forest-800 rounded-full border border-forest-200">
              Redis-Powered
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-charcoal-700">
          <Link to="/" className="hover:text-forest-600 transition-colors">Home</Link>
          <Link to="/explore" className="hover:text-forest-600 transition-colors">Explore Food</Link>
          <Link to="/how-it-works" className="hover:text-forest-600 transition-colors">How It Works</Link>
          <Link to="/about" className="hover:text-forest-600 transition-colors">About</Link>
          <Link to="/help" className="hover:text-forest-600 transition-colors">Help</Link>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'DONOR' && (
                <Link
                  to="/listings/new"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Donate Food</span>
                </Link>
              )}

              {user.role === 'RECIPIENT' && (
                <Link
                  to="/reservations"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>My Reservations</span>
                </Link>
              )}

              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-charcoal-50 hover:bg-charcoal-100 text-charcoal-800 border border-charcoal-200 rounded-lg text-sm font-medium transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-forest-600" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/notifications"
                className="p-2 text-charcoal-700 hover:text-forest-600 hover:bg-charcoal-100 rounded-lg transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </Link>

              <div className="h-6 w-px bg-charcoal-200 mx-1" />

              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm text-charcoal-800 font-medium hover:text-forest-600"
                >
                  <div className="w-8 h-8 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700 font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.name.split(' ')[0]}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-charcoal-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-charcoal-700 hover:text-forest-600 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
