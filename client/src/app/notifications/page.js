'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle, FiTrash2, FiClock, FiMessageSquare } from 'react-icons/fi';

export default function NotificationsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      fetchNotifications();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All messages marked as read');
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="font-playfair text-4xl font-bold text-amber-50 mb-2">Admin Messages</h1>
            <p className="text-amber-100/60 uppercase tracking-[0.2em] text-xs font-bold">Inbox & Official Communications</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllAsRead}
              className="px-6 py-2 bg-amber-900/40 text-amber-500 border border-amber-500/30 rounded-full text-xs font-bold hover:bg-amber-500 hover:text-amber-950 transition-all flex items-center gap-2"
            >
              <FiCheckCircle /> Mark All as Read
            </button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-amber-950/20 border border-white/5 rounded-3xl p-20 text-center flex flex-col items-center">
               <div className="w-20 h-20 rounded-full bg-amber-900/20 flex items-center justify-center text-amber-500/20 mb-6 border border-amber-500/10">
                 <FiBell size={40} />
               </div>
               <h3 className="text-xl font-bold text-amber-50/40 mb-2">No messages yet</h3>
               <p className="text-amber-100/20 text-sm">When the admin sends you a message, it will appear here.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n._id} 
                className={`relative bg-amber-950/20 border transition-all duration-300 rounded-3xl p-6 md:p-8 flex items-start gap-6 group hover:border-amber-500/30 ${
                  n.isRead ? 'border-white/5 opacity-60' : 'border-amber-500/20 shadow-[0_20px_50px_rgba(245,158,11,0.05)]'
                }`}
              >
                {!n.isRead && (
                  <div className="absolute top-8 left-3 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                )}
                
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                   n.isRead ? 'bg-black border-white/5 text-white/20' : 'bg-amber-950 border-amber-500/20 text-amber-500'
                }`}>
                   <FiMessageSquare size={24} />
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className={`font-bold text-lg ${n.isRead ? 'text-amber-100/60' : 'text-amber-50 group-hover:text-amber-400 transition-colors'}`}>
                        {n.title}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-amber-100/30 mt-1">
                         <span className="text-amber-500 transition-opacity">Official Message</span>
                         <span>•</span>
                         <span className="flex items-center gap-1"><FiClock /> {new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n._id)}
                        className="p-2 text-amber-100/20 hover:text-amber-500 transition-colors"
                        title="Mark as Read"
                      >
                         <FiCheckCircle size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-amber-100/70 text-sm leading-relaxed mt-4 bg-black/40 p-4 rounded-xl border border-white/5 italic">
                    "{n.message}"
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
