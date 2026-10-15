import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';
import { Bell, Check, CheckCheck, Clock, ShieldAlert, Info, AlertTriangle } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.items);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-forest-600" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-forest-600 text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Real-time rescue and task alerts persisted in Redis.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3 py-1.5 bg-white hover:bg-charcoal-50 border border-charcoal-200 text-charcoal-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-forest-600" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                item.read
                  ? 'bg-white border-charcoal-200 text-charcoal-700'
                  : 'bg-forest-50/40 border-forest-200 text-charcoal-900 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 rounded-xl bg-white border border-charcoal-100 shadow-xs">
                  {item.type === 'SUCCESS' && <Check className="w-4 h-4 text-emerald-600" />}
                  {item.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {item.type === 'ALERT' && <ShieldAlert className="w-4 h-4 text-red-600" />}
                  {item.type === 'INFO' && <Info className="w-4 h-4 text-blue-600" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-forest-600" />
                    )}
                  </div>
                  <p className="text-xs text-charcoal-600 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-charcoal-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => handleMarkAsRead(item.id)}
                  className="px-2.5 py-1 text-xs text-charcoal-500 hover:text-forest-700 hover:bg-forest-100 rounded-lg shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-charcoal-200 text-center">
          <Bell className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-charcoal-800">Inbox is Clear</h3>
          <p className="text-xs text-charcoal-500 mt-1">You have no new alerts at the moment.</p>
        </div>
      )}
    </div>
  );
};
