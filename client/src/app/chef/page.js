'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { socket } from '@/lib/socket';
import toast from 'react-hot-toast';
import { FiList, FiClock, FiCheckSquare, FiPackage, FiTruck, FiHome, FiEdit, FiPlus, FiTrash2, FiMessageSquare } from 'react-icons/fi';

const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out for delivery', 'delivered', 'cancelled'];

export default function ChefDashboard() {
  const { user, isChef, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('orders'); // orders, menu, requests
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isChef) {
        router.push('/');
        return;
      }
      fetchDashboardData();
    }
  }, [isAuthenticated, isChef, authLoading, router]);

  useEffect(() => {
    if (isChef && socket) {
      // Connect specifically to a global channel or setup logic
      socket.on('newOrder', (order) => {
        toast.success(`New Order received! #${order.orderNumber}`, { duration: 5000, icon: '🔥' });
        setOrders(prev => [order, ...prev]);
      });
      return () => {
        socket.off('newOrder');
      };
    }
  }, [isChef]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, reqRes] = await Promise.all([
        api.get('/orders/all'),
        api.get('/menu?limit=100'),
        api.get('/requests/all?status=pending')
      ]);
      setOrders(ordersRes.data.data.orders);
      setMenuItems(menuRes.data.data.items);
      setRequests(reqRes.data.data.requests);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handleRespondToRequest = async (e, reqId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updateData = {
      chefResponse: formData.get('chefResponse'),
      proposedPrice: Number(formData.get('proposedPrice')),
      estimatedTime: formData.get('estimatedTime'),
      status: 'reviewed'
    };

    try {
      await api.put(`/requests/${reqId}/review`, updateData);
      toast.success('Response sent to customer');
      setRequests(requests.filter(r => r._id !== reqId)); // Remove from pending
    } catch (err) {
      toast.error('Failed to respond to request');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Quick stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const activeOrders = orders.filter(o => ['confirmed', 'preparing', 'ready', 'out for delivery'].includes(o.status)).length; 

  return (
    <div className="min-h-screen bg-amber-950/20 pt-6 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-bold text-amber-50 mb-1">Chef Dashboard</h1>
            <p className="text-amber-100/60">Welcome back, Chef {user?.name.split(' ')[0]}</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-amber-900/40 border border-amber-800 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold font-playfair text-amber-400">{pendingOrders}</div>
                <div className="text-xs text-amber-100/60 uppercase tracking-widest">New</div>
             </div>
             <div className="bg-amber-900/40 border border-amber-800 rounded-xl px-4 py-2 text-center">
                <div className="text-xl font-bold font-playfair text-green-400">{activeOrders}</div>
                <div className="text-xs text-amber-100/60 uppercase tracking-widest">Active</div>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-amber-900/50 mb-8 overflow-x-auto scrollbar-hide">
          {['orders', 'menu', 'requests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'text-amber-500 border-b-2 border-amber-500'
                  : 'text-amber-100/60 hover:text-amber-400 hover:bg-amber-900/20'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'orders' && pendingOrders > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingOrders}</span>}
              {tab === 'requests' && requests.length > 0 && <span className="ml-2 bg-amber-500 text-amber-950 text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="animate-fade-in relative z-10 w-full mb-8">
           
           {/* ORDERS TAB */}
           {activeTab === 'orders' && (
             <div className="space-y-6">
               {orders.length === 0 ? (
                 <div className="text-center py-20 border border-dashed border-amber-900/50 rounded-2xl bg-amber-950/20">
                    <p className="text-amber-100/50">No active orders right now. Take a breather!</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {orders.map(order => (
                     <div key={order._id} className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-800 transition-colors">
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-20 pointer-events-none ${order.status === 'pending' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        
                        <div className="flex justify-between items-start mb-4 border-b border-amber-900/50 pb-4">
                           <div>
                             <h3 className="font-bold text-lg text-amber-50">Order #{order.orderNumber}</h3>
                             <p className="text-xs text-amber-100/50">{new Date(order.createdAt).toLocaleTimeString()} - {new Date(order.createdAt).toLocaleDateString()}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <select
                               value={order.status}
                               onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                               className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border outline-none cursor-pointer appearance-none ${
                                 order.status === 'pending' ? 'bg-red-900/30 text-red-400 border-red-800' : 
                                 order.status === 'delivered' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                 'bg-amber-900/30 text-amber-400 border-amber-800'
                               }`}
                             >
                               {orderStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                           </div>
                        </div>

                        <div className="mb-4">
                           <h4 className="text-amber-100/50 text-xs uppercase font-bold tracking-wider mb-2">Items</h4>
                           <ul className="space-y-2">
                             {order.items.map((item, idx) => (
                               <li key={idx} className="flex justify-between items-center bg-amber-900/20 p-2 rounded-lg border border-amber-900/50">
                                  <div className="flex items-center gap-3">
                                    <span className="bg-amber-950 px-2 py-1 rounded text-amber-400 font-bold text-sm border border-amber-800/50">{item.quantity}x</span>
                                    <span className="font-medium text-amber-50 flex-1">{item.menuItem?.name || 'Unknown'}</span>
                                  </div>
                               </li>
                             ))}
                           </ul>
                        </div>

                        {order.specialInstructions && (
                          <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-3 mb-4">
                             <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                               <FiMessageSquare /> Special Instructions
                             </div>
                             <p className="text-amber-100/80 italic text-sm">"{order.specialInstructions}"</p>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm pt-4 border-t border-amber-900/50">
                           <div className="text-amber-100/60">
                             Delivery: <span className="text-amber-50 font-medium capitalize">{order.deliveryType}</span>
                           </div>
                           <div className="bg-amber-900/40 px-3 py-1 rounded text-amber-400 font-bold font-playfair border border-amber-800/50">
                              ₹{order.totalAmount?.toFixed(2)}
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {/* MENU TAB (Simplified read-only view here, could add edit modal later) */}
           {activeTab === 'menu' && (
             <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-playfair text-xl font-bold text-amber-50">Manage Menu Items</h3>
                  {/* <button className="flex items-center gap-2 bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400">
                    <FiPlus /> Add Item
                  </button> */}
                  <span className="text-amber-100/50 text-sm">Direct edit coming soon. View only.</span>
                </div>
                
                <div className="bg-amber-950/50 border border-amber-900 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-amber-900/50 text-amber-400 text-sm uppercase tracking-wider border-b border-amber-800">
                        <th className="p-4 font-semibold">Item Name</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold">Price</th>
                        <th className="p-4 font-semibold">Sold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/50">
                      {menuItems.map(item => (
                        <tr key={item._id} className="hover:bg-amber-900/20 transition-colors">
                          <td className="p-4 font-medium text-amber-50">{item.name}</td>
                          <td className="p-4 text-amber-100/70 text-sm">{item.category?.name || '-'}</td>
                          <td className="p-4 text-amber-400 font-bold">₹{item.price}</td>
                          <td className="p-4 text-amber-100/70">{item.soldCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}

           {/* REQUESTS TAB */}
           {activeTab === 'requests' && (
             <div className="space-y-6">
               <div className="mb-4">
                 <h3 className="font-playfair text-xl font-bold text-amber-50">Pending Custom Requests</h3>
                 <p className="text-amber-100/50 text-sm">Review incoming meal requests, set estimated time and proposed price.</p>
               </div>
               
               {requests.length === 0 ? (
                 <div className="text-center py-20 border border-dashed border-amber-900/50 rounded-2xl bg-amber-950/20">
                    <p className="text-amber-100/50">No pending custom requests.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                   {requests.map(req => (
                     <div key={req._id} className="bg-amber-950/40 border border-amber-900 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="bg-blue-900/30 text-blue-400 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border border-blue-800">Customer Request</span>
                               <h4 className="font-bold text-amber-50 mt-2">{req.user?.name || 'Customer'}</h4>
                            </div>
                            <span className="text-xs text-amber-100/40">{new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-amber-50 text-lg mb-4 bg-amber-900/20 p-4 rounded-xl border border-amber-900/50">
                            "{req.description}"
                          </div>
                          <div className="flex gap-4 text-sm text-amber-100/60 flex-wrap">
                            {req.dietaryPreference && <span className="bg-amber-950 px-2 py-1 rounded-md border border-amber-900">Diet: <span className="text-amber-50 capitalize">{req.dietaryPreference}</span></span>}
                            {req.targetCalories && <span className="bg-amber-950 px-2 py-1 rounded-md border border-amber-900">Cals: <span className="text-amber-50">{req.targetCalories}</span></span>}
                            {req.targetProtein && <span className="bg-amber-950 px-2 py-1 rounded-md border border-amber-900">Protein: <span className="text-amber-50">{req.targetProtein}g</span></span>}
                          </div>
                        </div>

                        <div className="w-full md:w-1/3 bg-amber-900/20 border border-amber-900/50 rounded-xl p-5">
                           <h5 className="font-bold text-amber-400 mb-4 text-sm uppercase tracking-wider">Send Proposal</h5>
                           <form onSubmit={(e) => handleRespondToRequest(e, req._id)} className="space-y-4">
                             <div>
                               <label className="block text-xs text-amber-100/70 mb-1">Chef's Notes (Options, caveats)</label>
                               <textarea name="chefResponse" required rows="2" className="w-full bg-amber-950 border border-amber-800 rounded p-2 text-sm text-amber-50 focus:border-amber-500" placeholder="I can make this for you. We'll use lean turkey..."></textarea>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-amber-100/70 mb-1">Price (₹)</label>
                                  <input type="number" name="proposedPrice" required className="w-full bg-amber-950 border border-amber-800 rounded p-2 text-sm text-amber-50 focus:border-amber-500" placeholder="e.g. 800" />
                                </div>
                                <div>
                                  <label className="block text-xs text-amber-100/70 mb-1">Est. Prep Time</label>
                                  <input type="text" name="estimatedTime" required className="w-full bg-amber-950 border border-amber-800 rounded p-2 text-sm text-amber-50 focus:border-amber-500" placeholder="e.g. 45 mins" />
                                </div>
                             </div>
                             <button type="submit" className="w-full bg-amber-500 text-amber-950 font-bold py-2 rounded shadow-lg hover:bg-amber-400">
                               Send to Customer
                             </button>
                           </form>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
