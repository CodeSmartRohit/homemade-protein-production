'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiUsers, FiShoppingBag, FiDollarSign, FiActivity, FiTrendingUp, FiMessageSquare, FiPhone, FiMail, FiCheckCircle, FiClock, FiMapPin } from 'react-icons/fi';
import { socket, connectSocket } from '@/lib/socket';

export default function AdminDashboard() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, all-orders, requests
  
  // Data States
  const [stats, setStats] = useState({ 
    totalRevenue: 0, totalOrders: 0, activeUsers: 0, pendingRequests: 0,
    paymentStats: { pending: 0, paid: 0, failed: 0 }
  });
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, pending, paid, failed

  useEffect(() => {
    connectSocket();
    
    socket.on('new-order', (data) => {
      toast.success(`New Order! #${data.order.orderNumber || data.order._id.slice(-6)}`, {
        duration: 5000,
        position: 'top-right',
        icon: '🥡'
      });
      setOrders(prev => [data.order, ...prev]);
      setStats(prev => ({ ...prev, totalOrders: prev.totalOrders + 1 }));
    });

    socket.on('payment-received', (data) => {
       toast.success(`Payment Received for Order #${data.orderNumber}`, { icon: '💰' });
       setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, paymentStatus: 'paid' } : o));
    });

    return () => {
      socket.off('new-order');
      socket.off('payment-received');
    };
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/');
        return;
      }
      fetchAdminData();
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ordersRes, requestsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'), 
        api.get('/orders/all'),
        api.get('/requests/all')
      ]);
      setUsers(usersRes.data.data.users || []);
      setOrders(ordersRes.data.data.orders || []);
      setRequests(requestsRes.data.data.requests || []);
      
      if (statsRes.data.data.stats) {
        setStats({
          totalRevenue: statsRes.data.data.stats.totalRevenue,
          totalOrders: statsRes.data.data.stats.totalOrders,
          activeUsers: statsRes.data.data.stats.totalUsers,
          pendingRequests: statsRes.data.data.stats.pendingRequests || 0,
          paymentStats: statsRes.data.data.paymentStats || { pending: 0, paid: 0, failed: 0 }
        });
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/payment-status`, { paymentStatus: newStatus });
      toast.success(`Payment updated to ${newStatus}`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, paymentStatus: newStatus } : o));
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleRequestStatus = async (requestId, newStatus) => {
    try {
      await api.patch(`/requests/${requestId}/status`, { status: newStatus });
      toast.success(`Request marked as ${newStatus}`);
      setRequests(requests.map(r => r._id === requestId ? { ...r, status: newStatus } : r));
    } catch (err) {
      toast.error('Failed to update request');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
       await api.patch(`/admin/users/${userId}/role`, { role: newRole });
       toast.success('User role updated');
       setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
       toast.error('Failed to update role');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-950/20 pt-6 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-amber-50 mb-1">Admin Panel</h1>
            <p className="text-amber-100/60">Platform Overview & Management</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-amber-900/50 mb-8 overflow-x-auto scrollbar-hide">
          {['overview', 'users', 'all-orders', 'requests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold transition-all whitespace-nowrap capitalize flex items-center gap-2 ${
                activeTab === tab
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-amber-100/60 hover:text-amber-400 hover:bg-amber-900/20'
              }`}
            >
              {tab.replace('-', ' ')}
              {tab === 'requests' && stats.pendingRequests > 0 && (
                <span className="bg-amber-500 text-amber-950 text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-amber-950">
                  {stats.pendingRequests}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in relative z-10 w-full mb-8">
           
           {/* OVERVIEW TAB */}
           {activeTab === 'overview' && (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-lg flex items-center justify-between">
                     <div>
                       <p className="text-amber-100/60 text-sm font-bold uppercase tracking-wider mb-1">Total Revenue</p>
                       <h3 className="font-playfair text-3xl font-bold text-amber-400">₹{stats.totalRevenue.toLocaleString()}</h3>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 text-xl border border-amber-800"><FiDollarSign /></div>
                   </div>
                   <div 
                     onClick={() => setActiveTab('all-orders')}
                     className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-lg flex items-center justify-between cursor-pointer hover:border-amber-500 hover:bg-amber-900/40 transition-all group"
                   >
                     <div>
                       <p className="text-amber-100/60 text-sm font-bold uppercase tracking-wider mb-1 group-hover:text-amber-400">Total Orders</p>
                       <h3 className="font-playfair text-3xl font-bold text-amber-50">{stats.totalOrders}</h3>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 text-xl border border-amber-800 group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all"><FiShoppingBag /></div>
                   </div>
                   <div 
                     onClick={() => setActiveTab('users')}
                     className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-lg flex items-center justify-between cursor-pointer hover:border-amber-500 hover:bg-amber-900/40 transition-all group"
                   >
                     <div>
                       <p className="text-amber-100/60 text-sm font-bold uppercase tracking-wider mb-1 group-hover:text-amber-400">Registered Users</p>
                       <h3 className="font-playfair text-3xl font-bold text-amber-50">{stats.activeUsers}</h3>
                     </div>
                     <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500 text-xl border border-amber-800 group-hover:border-amber-500 group-hover:bg-amber-500 group-hover:text-amber-950 transition-all"><FiUsers /></div>
                   </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                   <FiTrendingUp className="text-amber-500/30 w-16 h-16 mb-4" />
                   <p className="text-amber-100/50 text-lg">Analytics charts and deeper insights coming in v2.0</p>
                </div>
             </div>
           )}

           {/* USERS TAB */}
           {activeTab === 'users' && (
             <div className="bg-amber-950/50 border border-amber-900 rounded-2xl overflow-hidden shadow-xl">
               <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-amber-900/50 text-amber-400 text-xs uppercase tracking-wider border-b border-amber-800">
                      <th className="p-4 font-bold">Name</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Joined</th>
                      <th className="p-4 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/50">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-amber-900/20 transition-colors">
                        <td className="p-4 font-bold text-amber-50">{u.name}</td>
                        <td className="p-4 text-amber-100/70 text-sm">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                             u.role === 'admin' ? 'bg-purple-900/50 text-purple-400 border border-purple-800' :
                             u.role === 'chef' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                             'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-amber-100/50 text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="p-4">
                           <select
                               value={u.role}
                               onChange={(e) => handleRoleChange(u._id, e.target.value)}
                               disabled={u.email === 'rp111monster@gmail.com' && u.role === 'admin'} // protect super admin
                               className="bg-amber-950 border border-amber-800 text-amber-50 text-xs p-2 rounded outline-none focus:border-amber-500 disabled:opacity-50"
                           >
                              <option value="customer">Customer</option>
                              <option value="chef">Chef</option>
                              <option value="admin">Admin</option>
                           </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
             </div>
           )}

           {/* ALL ORDERS TAB */}
           {activeTab === 'all-orders' && (
             <div className="space-y-4">
               {/* Order Filters */}
               <div className="flex flex-wrap items-center gap-4 bg-amber-950/50 p-4 rounded-2xl border border-amber-900/50 backdrop-blur-sm">
                 <span className="text-amber-100/60 text-sm font-bold uppercase tracking-wider">Filter Payment:</span>
                 <div className="flex gap-2">
                   {['all', 'pending', 'paid', 'failed'].map((f) => (
                     <button
                       key={f}
                       onClick={() => setPaymentFilter(f)}
                       className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                         paymentFilter === f
                           ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                           : 'bg-amber-900/20 text-amber-100/60 border-amber-800 hover:border-amber-500'
                       }`}
                     >
                       {f.toUpperCase()}
                       {f !== 'all' && (
                         <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                           paymentFilter === f ? 'bg-amber-950/20 text-amber-950' : 'bg-amber-800 text-amber-400'
                         }`}>
                           {stats.paymentStats[f] || 0}
                         </span>
                       )}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="bg-amber-950/50 border border-amber-900 rounded-2xl overflow-hidden shadow-xl">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse whitespace-nowrap">
                     <thead>
                       <tr className="bg-amber-900/50 text-amber-400 text-xs uppercase tracking-wider border-b border-amber-800">
                         <th className="p-4 font-bold">Order #</th>
                         <th className="p-4 font-bold">Date</th>
                         <th className="p-4 font-bold">Customer Info</th>
                         <th className="p-4 font-bold">Items</th>
                         <th className="p-4 font-bold">Status Action</th>
                         <th className="p-4 font-bold">Total</th>
                         <th className="p-4 font-bold">Payment</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-amber-900/50 text-sm">
                       {orders
                         .filter(o => paymentFilter === 'all' || o.paymentStatus === paymentFilter)
                         .slice(0, 50).map(o => (
                         <tr key={o._id} className="hover:bg-amber-900/20 transition-colors">
                           <td className="p-4 font-mono text-amber-400 font-bold">{o.orderNumber || o._id.substring(o._id.length-6)}</td>
                           <td className="p-4 text-amber-100/70">{new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                           <td className="p-4 max-w-xs whitespace-normal">
                              <div className="font-medium text-amber-50">{o.customer?.name || 'Unknown'}</div>
                              <div className="text-xs text-amber-100/40 flex flex-col gap-1 mt-1">
                                 <span className="flex items-center gap-1"><FiMail className="flex-shrink-0" /> <span className="truncate">{o.customer?.email}</span></span>
                                 {o.customer?.phone && <span className="flex items-center gap-1"><FiPhone className="flex-shrink-0" /> {o.customer.phone}</span>}
                                 {o.deliveryAddress && (
                                   <span className="flex items-start gap-1 font-bold text-amber-400 mt-1">
                                      <FiMapPin className="mt-0.5 flex-shrink-0" /> 
                                      <span className="leading-tight text-left">
                                         {o.deliveryAddress.street}, {o.deliveryAddress.city}, {o.deliveryAddress.state} {o.deliveryAddress.pincode}
                                         {o.deliveryAddress.label && <span className="ml-1 opacity-60">({o.deliveryAddress.label})</span>}
                                      </span>
                                   </span>
                                 )}
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="max-w-[200px] truncate text-amber-100/60 text-xs">
                                 {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                              </div>
                           </td>
                           <td className="p-4">
                              <select 
                                value={o.status}
                                onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                                className={`bg-amber-950 border border-amber-800 text-xs p-1.5 rounded outline-none w-32 ${
                                  o.status === 'delivered' ? 'text-green-400 border-green-800/50' : 
                                  o.status === 'cancelled' ? 'text-red-400 border-red-800/50' : 
                                  'text-amber-400 border-amber-800'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="preparing">Preparing</option>
                                <option value="ready">Ready</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                           </td>
                           <td className="p-4 font-bold text-amber-50">₹{o.totalAmount?.toFixed(2)}</td>
                           <td className="p-4">
                             <select 
                               value={o.paymentStatus}
                               onChange={(e) => handlePaymentStatusUpdate(o._id, e.target.value)}
                               className={`bg-amber-950 border border-amber-800 text-xs p-1.5 rounded outline-none w-28 font-bold ${
                                 o.paymentStatus === 'paid' ? 'text-green-400 border-green-800/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 
                                 o.paymentStatus === 'failed' ? 'text-red-400 border-red-800/50' : 
                                 'text-amber-400 border-amber-800 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                               }`}
                             >
                               <option value="pending">Pending</option>
                               <option value="paid">Paid</option>
                               <option value="failed">Failed</option>
                             </select>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
                 {orders.length === 0 && (
                   <div className="p-10 text-center text-amber-100/50">No orders found.</div>
                 )}
                 {orders.length > 50 && (
                   <div className="p-4 text-center border-t border-amber-900/50 text-xs text-amber-100/50 bg-amber-900/10">
                     Showing latest 50 orders
                   </div>
                 )}
               </div>
             </div>
           )}

           {/* REQUESTS TAB */}
           {activeTab === 'requests' && (
             <div className="grid gap-6">
                {requests.length === 0 ? (
                  <div className="p-20 text-center bg-amber-950/30 rounded-2xl border border-amber-900/50">
                     <FiMessageSquare className="w-12 h-12 text-amber-900 mx-auto mb-4" />
                     <p className="text-amber-100/50">No custom messages or requests yet.</p>
                  </div>
                ) : (
                  requests.map(req => (
                    <div key={req._id} className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-lg hover:border-amber-800 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-amber-50 underline decoration-amber-500/30">{req.title || 'Custom Protein Request'}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                   req.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                                   req.status === 'accepted' ? 'bg-emerald-900/40 text-emerald-400' :
                                   req.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                                   'bg-amber-500/20 text-amber-500'
                                }`}>
                                   {req.status}
                                </span>
                             </div>
                             <div className="text-xs text-amber-100/40 flex items-center gap-3">
                                <span>From: **{req.customer?.name}**</span>
                                <span className="flex items-center gap-1"><FiMail /> {req.customer?.email}</span>
                                <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                            {req.status === 'pending' && (
                              <>
                                <button onClick={() => handleRequestStatus(req._id, 'accepted')} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-500 transition-colors" title="Approve"><FiCheckCircle /></button>
                                <button onClick={() => handleRequestStatus(req._id, 'rejected')} className="bg-red-900/50 text-red-400 p-2 rounded-lg hover:bg-red-900 transition-colors" title="Decline"><FiActivity /></button>
                              </>
                            )}
                          </div>
                       </div>
                       <div className="bg-amber-950/80 p-4 rounded-xl border border-amber-900 text-amber-100/80 text-sm italic leading-relaxed">
                          "{req.description || req.message}"
                       </div>
                    </div>
                  ))
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
