'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '@/lib/imageHelper';
import { FiUsers, FiShoppingBag, FiDollarSign, FiActivity, FiTrendingUp, FiMessageSquare, FiPhone, FiMail, FiCheckCircle, FiClock, FiMapPin, FiTrash2, FiPlus, FiEdit, FiX } from 'react-icons/fi';
import { socket, connectSocket } from '@/lib/socket';

export default function AdminDashboard() {
  const { user, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview'); // overview, menu-management, users, all-orders, requests
  
  // Data States
  const [stats, setStats] = useState({ 
    totalRevenue: 0, totalOrders: 0, activeUsers: 0, pendingRequests: 0,
    paymentStats: { pending: 0, paid: 0, failed: 0 }
  });
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, pending, paid, failed

  // Messaging Modal State
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [msgTitle, setMsgTitle] = useState('Important Message');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Form states for Menu Management
  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: '', isVeg: 'true', type: '', image: null
  });
  const [menuItems, setMenuItems] = useState([]);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  
  // Settings & Broadcast
  const [siteSettings, setSiteSettings] = useState({ noticeBoard: '', qrCodeImage: '', upiIds: ['rp111monster@oksbi', '9340623657@ybl'] });
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);

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
      const [statsRes, usersRes, deletedUsersRes, ordersRes, requestsRes, catsRes, menuRes, settingsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/users'), 
        api.get('/admin/users/deleted'),
        api.get('/orders/all'),
        api.get('/requests/all'),
        api.get('/categories'),
        api.get('/menu/admin/all'),
        api.get('/admin/settings')
      ]);
      setUsers(usersRes.data?.data?.users || []);
      setDeletedUsers(deletedUsersRes.data?.data?.users || []);
      setOrders(ordersRes.data?.data?.orders || []);
      setRequests(requestsRes.data?.data?.requests || []);
      setCategories(catsRes.data?.data?.categories || []);
      setMenuItems(menuRes.data?.data?.items || []);
      
      if (statsRes.data?.data?.stats) {
        setStats({
          totalRevenue: statsRes.data.data.stats.totalRevenue,
          totalOrders: statsRes.data.data.stats.totalOrders,
          activeUsers: statsRes.data.data.stats.totalUsers,
          pendingRequests: statsRes.data.data.stats.pendingRequests || 0,
          paymentStats: statsRes.data.data.paymentStats || { pending: 0, paid: 0, failed: 0 }
        });
      }
      if (settingsRes?.data?.data?.settings) {
         const setts = settingsRes.data.data.settings;
         setSiteSettings({
            noticeBoard: setts.noticeBoard || '',
            qrCodeImage: setts.qrCodeImage || '',
            upiIds: setts.upiIds?.length ? setts.upiIds : siteSettings.upiIds
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

  const handleSoftDeleteUser = async (userId) => {
    if (!window.confirm('Move this user to Recycle Bin? They will be permanently deleted after 10 days.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User moved to Recycle Bin');
      const deletedUser = users.find(u => u._id === userId);
      setUsers(users.filter(u => u._id !== userId));
      if (deletedUser) {
        setDeletedUsers([ { ...deletedUser, isDeleted: true, deletedAt: new Date() }, ...deletedUsers ]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/restore`);
      toast.success('User restored successfully');
      const restoredUser = deletedUsers.find(u => u._id === userId);
      setDeletedUsers(deletedUsers.filter(u => u._id !== userId));
      if (restoredUser) {
        setUsers([ { ...restoredUser, isDeleted: false, isActive: true }, ...users ]);
      }
    } catch (err) {
      toast.error('Failed to restore user');
    }
  };

  const calculateDaysRemaining = (deletedAt) => {
    const dDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = dDate.getTime() + (10 * 24 * 60 * 60 * 1000) - now.getTime();
    const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return actualDays > 0 ? actualDays : 0;
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!msgBody) return toast.error('Message body is required');
    
    setSendingMsg(true);
    try {
      if (selectedUser._id === 'all') {
        await api.post(`/admin/users/broadcast`, {
          title: msgTitle,
          message: msgBody
        });
        toast.success('Message broadcasted to all users');
      } else {
        await api.post(`/admin/users/${selectedUser._id}/notify`, {
          title: msgTitle,
          message: msgBody,
          type: 'info'
        });
        toast.success('Message sent to ' + selectedUser.name);
      }
      setMsgModalOpen(false);
      setMsgBody('');
      setMsgTitle('Important Message');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/categories', newCat);
      toast.success('Category created');
      setCategories([...categories, res.data.data.category]);
      setNewCat({ name: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.keys(newItem).forEach(key => {
        if (newItem[key] !== null && newItem[key] !== undefined && newItem[key] !== '') {
          payload.append(key, newItem[key]);
        }
      });
      const res = await api.post('/menu', payload);
      toast.success('Menu item added');
      setMenuItems([res.data.data.item, ...menuItems]);
      setNewItem({ name: '', description: '', price: '', category: '', isVeg: 'true', type: '', image: null });
       // reset file input
       const fileInput = document.getElementById('product-image');
       if (fileInput) fileInput.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add menu item');
    }
  };

  const handleToggleAvailability = async (id) => {
    try {
      const res = await api.patch(`/menu/${id}/availability`);
      toast.success('Availability updated');
      setMenuItems(menuItems.map(item => item._id === id ? { ...item, isAvailable: res.data.data.isAvailable } : item));
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/menu/${id}`);
      toast.success('Product deleted');
      setMenuItems(menuItems.filter(item => item._id !== id));
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteImage = async (id, imageUrl) => {
    if (!window.confirm('Are you sure you want to remove this image?')) return;
    try {
      const res = await api.delete(`/menu/${id}/image`, { data: { imageUrl } });
      toast.success('Image removed');
      setMenuItems(menuItems.map(item => item._id === id ? res.data.data.item : item));
    } catch (err) {
      toast.error('Failed to remove image');
    }
  };

  const handleUpdatePrice = async (id) => {
    if (!editingPriceValue || isNaN(editingPriceValue)) {
      toast.error('Please enter a valid price');
      return;
    }
    try {
      const payload = new FormData();
      payload.append('price', editingPriceValue);
      
      const res = await api.put(`/menu/${id}`, payload);
      toast.success('Price updated successfully');
      setMenuItems(menuItems.map(item => item._id === id ? { ...item, price: Number(editingPriceValue) } : item));
      setEditingPriceId(null);
      setEditingPriceValue('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update price');
    }
  };
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', siteSettings);
      toast.success('Settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const handleUpdateCategory = async (id, categoryId) => {
    if (!categoryId) return;
    try {
      const payload = new FormData();
      payload.append('category', categoryId);
      const res = await api.put(`/menu/${id}`, payload);
      toast.success('Category updated safely');
      setMenuItems(menuItems.map(item => item._id === id ? { ...item, category: res.data.data.item.category } : item));
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  const handleHardDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: PERMANENT DELETION. This cannot be undone. Proceed?')) return;
    try {
      await api.delete(`/admin/users/${userId}/hard`);
      toast.success('User permanently deleted');
      setDeletedUsers(deletedUsers.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to permanently delete user');
    }
  };

  const handleBroadcastMessage = async (e) => {
    e.preventDefault();
    if (!msgBody) return toast.error('Message body is required');
    
    setSendingMsg(true);
    try {
      await api.post('/admin/users/broadcast', {
        title: msgTitle,
        message: msgBody,
        type: 'info'
      });
      toast.success('Broadcast sent to all users');
      setBroadcastModalOpen(false);
      setMsgBody('');
      setMsgTitle('Important Notice');
    } catch (err) {
      toast.error('Failed to send broadcast');
    } finally {
      setSendingMsg(false);
    }
  };

  const handleTogglePopular = async (id) => {
    const item = menuItems.find(i => i._id === id);
    if (!item) return;
    try {
      const payload = new FormData();
      payload.append('isPopular', !item.isPopular);
      const res = await api.put(`/menu/${id}`, payload);
      toast.success(item.isPopular ? 'Removed from Popular' : 'Marked as Popular');
      setMenuItems(menuItems.map(i => i._id === id ? { ...i, isPopular: !item.isPopular } : i));
    } catch (err) {
       toast.error('Failed to update popular status');
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
          {['overview', 'menu-management', 'users', 'recycle-bin', 'all-orders', 'requests'].map((tab) => (
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
              {tab === 'recycle-bin' && deletedUsers.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-amber-950 font-bold">
                  {deletedUsers.length}
                </span>
              )}
              {tab === 'requests' && stats.pendingRequests > 0 && (
                <span className="bg-amber-500 text-amber-950 text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-amber-950 font-bold">
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

                <div className="bg-amber-950/30 border border-amber-900/50 rounded-2xl p-8">
                   <h3 className="font-playfair text-2xl font-bold text-amber-50 mb-6 border-b border-amber-900 pb-2">Global Settings</h3>
                   <form onSubmit={handleSaveSettings} className="space-y-6">
                      <div>
                         <label className="block text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Notice Board Text</label>
                         <textarea 
                           className="w-full bg-black/40 border border-amber-900 rounded-xl p-4 text-amber-50 focus:border-amber-500 outline-none"
                           rows="3"
                           value={siteSettings.noticeBoard}
                           onChange={(e) => setSiteSettings({...siteSettings, noticeBoard: e.target.value})}
                           placeholder="Type an announcement to appear on the homepage..."
                         />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">UPI IDs (Comma separated)</label>
                          <input 
                            type="text"
                            className="w-full bg-black/40 border border-amber-900 rounded-xl p-4 text-amber-50 focus:border-amber-500 outline-none"
                            value={siteSettings.upiIds.join(', ')}
                            onChange={(e) => setSiteSettings({...siteSettings, upiIds: e.target.value.split(',').map(s=>s.trim())})}
                          />
                        </div>
                        <div>
                          <label className="block text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">QR Code Image Path / URL</label>
                          <input 
                            type="text"
                            className="w-full bg-black/40 border border-amber-900 rounded-xl p-4 text-amber-50 focus:border-amber-500 outline-none"
                            value={siteSettings.qrCodeImage}
                            onChange={(e) => setSiteSettings({...siteSettings, qrCodeImage: e.target.value})}
                            placeholder="/upi-qr-1.png (Upload to public folder)"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                         <button type="submit" className="bg-amber-500 text-amber-950 font-bold px-8 py-3 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:bg-amber-400">
                           Save Settings
                         </button>
                      </div>
                   </form>
                </div>
             </div>
           )}

           {/* USERS TAB */}
           {activeTab === 'users' && (
             <div className="space-y-6">
               <div className="flex justify-end">
                 <button onClick={() => { setSelectedUser({ _id: 'all', name: 'All Registered Users' }); setMsgModalOpen(true); }} className="bg-amber-500 text-amber-950 font-bold px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                   <FiMessageSquare /> Broadcast Message to All
                 </button>
               </div>
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
                           <div className="flex items-center gap-2">
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
                             <button
                               onClick={() => handleSoftDeleteUser(u._id)}
                               disabled={u.email === 'rp111monster@gmail.com' || u._id === user._id}
                               className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-20"
                               title="Move to Recycle Bin"
                             >
                               <FiTrash2 />
                             </button>
                             <button
                               onClick={() => { setSelectedUser(u); setMsgModalOpen(true); }}
                               className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                               title="Send Message"
                             >
                               <FiMessageSquare />
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               </div>
             </div>
           )}

           {/* RECYCLE BIN TAB */}
           {activeTab === 'recycle-bin' && (
             <div className="space-y-6">
                <div className="bg-red-900/20 border border-red-900/30 rounded-2xl p-4 flex items-center gap-4 text-red-200">
                   <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 border border-red-800"><FiClock /></div>
                   <div className="text-sm">
                      <p className="font-bold">Automated Cleanup Policy</p>
                      <p className="opacity-70">Users in the Recycle Bin are permanently deleted after 10 days of inactivity.</p>
                   </div>
                </div>

                <div className="bg-amber-950/50 border border-amber-900 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-amber-900/50 text-amber-400 text-xs uppercase tracking-wider border-b border-amber-800">
                         <th className="p-4 font-bold">Deleted User</th>
                         <th className="p-4 font-bold">Reason/Status</th>
                         <th className="p-4 font-bold text-center">Days left</th>
                         <th className="p-4 font-bold">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-amber-900/50">
                       {deletedUsers.length > 0 ? deletedUsers.map(u => (
                         <tr key={u._id} className="hover:bg-amber-900/20 transition-colors">
                           <td className="p-4">
                              <div className="font-bold text-amber-50">{u.name}</div>
                              <div className="text-[10px] text-amber-100/40">{u.email}</div>
                           </td>
                           <td className="p-4">
                             <span className="text-[10px] px-2 py-1 rounded bg-red-900/30 text-red-400 border border-red-800 font-bold uppercase tracking-widest">
                                Deleted
                             </span>
                             <div className="text-[10px] text-amber-100/30 mt-1 uppercase tracking-tighter">On: {new Date(u.deletedAt).toLocaleDateString()}</div>
                           </td>
                           <td className="p-4 text-center">
                              <span className={`font-mono font-bold ${calculateDaysRemaining(u.deletedAt) <= 2 ? 'text-red-500' : 'text-amber-500'}`}>
                                 {calculateDaysRemaining(u.deletedAt)}
                              </span>
                           </td>
                           <td className="p-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRestoreUser(u._id)}
                                  className="px-4 py-2 bg-amber-500 text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-all flex items-center gap-2"
                                >
                                  <FiCheckCircle size={14} /> Restore
                                </button>
                                <button
                                  onClick={() => handleHardDeleteUser(u._id)}
                                  className="px-4 py-2 bg-red-950/50 text-red-500 border border-red-900/50 text-xs font-bold rounded-lg hover:bg-red-900 transition-all flex items-center gap-2"
                                  title="Permanently Delete Now"
                                >
                                  <FiTrash2 size={14} /> Delete
                                </button>
                              </div>
                           </td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan="4" className="p-20 text-center text-amber-100/40 italic">Recycle Bin is empty.</td>
                         </tr>
                       )}
                     </tbody>
                   </table>
                  </div>
                </div>
             </div>
           )}
           {/* MENU MANAGEMENT TAB */}
           {activeTab === 'menu-management' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Left Column: Create Form */}
               <div className="md:col-span-1 space-y-6">
                 <div className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-xl">
                   <h3 className="font-playfair text-xl font-bold text-amber-50 mb-4 border-b border-amber-900/50 pb-2">Add New Product</h3>
                   <form onSubmit={handleCreateItem} className="space-y-4">
                     <div>
                       <label className="block text-xs text-amber-100/70 mb-1 uppercase tracking-wider font-bold">Product Name</label>
                       <input 
                         type="text" 
                         required 
                         value={newItem.name} 
                         onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                         className="w-full bg-black/40 border border-amber-800 rounded-lg p-3 text-amber-50 outline-none focus:border-amber-500 transition-all placeholder:text-amber-100/20"
                         placeholder="Gold Whey Protein"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-amber-100/70 mb-1 uppercase tracking-wider font-bold">Price (₹)</label>
                          <input 
                            type="number" 
                            required 
                            value={newItem.price} 
                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                            className="w-full bg-black/40 border border-amber-800 rounded-lg p-3 text-amber-50 outline-none focus:border-amber-500"
                            placeholder="2499"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-100/70 mb-1 uppercase tracking-wider font-bold">Category</label>
                          <select 
                            required 
                            value={newItem.category} 
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="w-full bg-black/40 border border-amber-800 rounded-lg p-3 text-amber-50 outline-none focus:border-amber-500"
                          >
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                     </div>
                     <div>
                       <label className="block text-xs text-amber-100/70 mb-1 uppercase tracking-wider font-bold">Main Image</label>
                       <div className="relative group">
                          <input 
                            type="file" 
                            id="product-image"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })}
                          />
                          <label 
                            htmlFor="product-image"
                            className="flex flex-col items-center justify-center w-full h-32 bg-black/20 border-2 border-dashed border-amber-900 rounded-xl cursor-pointer hover:bg-amber-900/10 hover:border-amber-500 transition-all group-hover:border-amber-500"
                          >
                            {newItem.image ? (
                              <div className="flex flex-col items-center">
                                <FiCheckCircle className="text-green-500 text-2xl mb-2" />
                                <span className="text-amber-50 text-xs font-medium truncate max-w-[150px]">{newItem.image.name}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <FiPlus className="text-amber-500 text-2xl mb-2" />
                                <span className="text-amber-100/60 text-xs text-center px-4 uppercase tracking-tighter">Click to upload product image</span>
                              </div>
                            )}
                          </label>
                       </div>
                     </div>
                     <div>
                       <label className="block text-xs text-amber-100/70 mb-1 uppercase tracking-wider font-bold">Description</label>
                       <textarea 
                         rows="3" 
                         value={newItem.description} 
                         onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                         className="w-full bg-black/40 border border-amber-800 rounded-lg p-3 text-amber-50 outline-none focus:border-amber-500"
                       />
                     </div>
                     <button type="submit" className="w-full bg-amber-500 text-amber-950 font-bold py-3 rounded-lg hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                       Create Product
                     </button>
                   </form>
                 </div>

                 <div className="bg-amber-950/50 border border-amber-900 rounded-2xl p-6 shadow-xl">
                   <h3 className="font-playfair text-xl font-bold text-amber-50 mb-4 border-b border-amber-900/50 pb-2">Add New Category</h3>
                   <form onSubmit={handleCreateCategory} className="space-y-4">
                     <input 
                       type="text" 
                       required 
                       placeholder="Category Name" 
                       value={newCat.name}
                       onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                       className="w-full bg-black/40 border border-amber-800 rounded-lg p-3 text-amber-50 outline-none focus:border-amber-500"
                     />
                     <button type="submit" className="w-full bg-amber-900/40 text-amber-400 font-bold py-3 rounded-lg border border-amber-800 hover:bg-amber-800 transition-all">
                       Create Category
                     </button>
                   </form>
                 </div>
               </div>

               {/* Right Column: List & Management */}
               <div className="md:col-span-2">
                 <div className="bg-amber-950/50 border border-amber-900 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-amber-900/50 bg-amber-900/20 flex justify-between items-center">
                       <h3 className="font-bold text-amber-100 uppercase tracking-widest text-xs">Existing Products</h3>
                       <div className="text-[10px] text-amber-100/40 uppercase tracking-wider">Total: {menuItems?.length || 0} Products</div>
                    </div>
                    <div className="max-h-[800px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-amber-950 z-10">
                          <tr className="bg-amber-900/50 text-amber-400 text-[10px] uppercase tracking-widest border-b border-amber-800">
                            <th className="p-4">Image</th>
                            <th className="p-4">Info</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/50">
                          {(menuItems && menuItems.length > 0) ? menuItems.map(item => (
                            <tr key={item._id} className="hover:bg-amber-900/10 transition-colors">
                              <td className="p-4 w-20">
                                {item.image ? (
                                  <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-amber-900/50 bg-black/20">
                                     <img src={resolveImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                     <button 
                                       onClick={() => handleDeleteImage(item._id, item.image)}
                                       className="absolute inset-0 bg-red-900/80 items-center justify-center hidden group-hover:flex transition-all"
                                       title="Remove this image"
                                     >
                                        <FiTrash2 className="text-white" />
                                     </button>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-lg bg-amber-900/20 border border-amber-900/30 flex items-center justify-center text-amber-100/20"><FiPlus /></div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="font-bold text-amber-50">{item.name}</div>
                                <div className="text-[10px] text-amber-100/50 mt-1 mb-1 flex flex-wrap items-center gap-2">
                                  {editingCategoryId === item._id ? (
                                    <div className="flex items-center gap-1">
                                      <select 
                                        className="bg-black/80 border border-amber-500 text-amber-300 rounded px-1 py-0.5 outline-none font-bold min-w-[100px]"
                                        value={item.category?._id || ''}
                                        onChange={(e) => {
                                          handleUpdateCategory(item._id, e.target.value);
                                          setEditingCategoryId(null);
                                        }}
                                      >
                                        <option value="" disabled>Select Category</option>
                                        {categories.map(cat => <option className="bg-amber-950 text-amber-100" key={cat._id} value={cat._id}>{cat.name}</option>)}
                                      </select>
                                      <button 
                                        onClick={() => setEditingCategoryId(null)}
                                        className="bg-red-600 text-white p-1 rounded hover:bg-red-500"
                                        title="Cancel"
                                      >
                                        <FiX size={10} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="cursor-pointer hover:text-amber-400 font-bold underline decoration-amber-500/30" onClick={() => setEditingCategoryId(item._id)}>
                                      {item.category?.name || 'No Category'} <FiEdit className="inline mb-0.5 opacity-50" />
                                    </span>
                                  )}
                                  <span>•</span>
                                  {editingPriceId === item._id ? (
                                    <div className="inline-flex items-center ml-2 gap-1">
                                      <span className="text-amber-400 font-bold">₹</span>
                                      <input 
                                        type="number" 
                                        className="bg-black/40 border border-amber-500 rounded p-1 text-[10px] text-amber-50 w-16 outline-none"
                                        value={editingPriceValue}
                                        onChange={e => setEditingPriceValue(e.target.value)}
                                        autoFocus
                                      />
                                      <button 
                                        onClick={() => handleUpdatePrice(item._id)}
                                        className="bg-green-600 text-white p-1 rounded hover:bg-green-500"
                                      >
                                        <FiCheckCircle size={12} />
                                      </button>
                                      <button 
                                        onClick={() => { setEditingPriceId(null); setEditingPriceValue(''); }}
                                        className="bg-red-600 text-white p-1 rounded hover:bg-red-500"
                                      >
                                        <FiX size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="ml-1 cursor-pointer hover:text-amber-400 font-bold underline decoration-amber-500/30" onClick={() => { setEditingPriceId(item._id); setEditingPriceValue(item.price); }}>
                                      ₹{item.price} <FiEdit className="inline mb-0.5 opacity-50" />
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[10px] inline-flex items-center px-2 py-0.5 rounded-full mt-2 font-bold uppercase ${item.isAvailable ? 'bg-green-900/20 text-green-400 border border-green-800/30' : 'bg-red-900/20 text-red-400 border border-red-800/30'}`}>
                                  {item.isAvailable ? 'Available' : 'Sold Out'}
                                </div>
                                {item.isPopular && (
                                  <div className="text-[10px] inline-flex items-center px-2 py-0.5 rounded-full mt-2 ml-2 font-bold uppercase bg-amber-900/30 text-amber-500 border border-amber-500/50">
                                    ★ Popular
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex justify-center gap-2">
                                   <button 
                                     onClick={() => handleTogglePopular(item._id)}
                                     className={`p-2 rounded border transition-all ${item.isPopular ? 'bg-amber-500 text-amber-950 border-amber-500' : 'bg-amber-900/50 text-amber-400 border-amber-800 hover:bg-amber-800'}`}
                                     title={item.isPopular ? "Remove from Popular" : "Mark as Popular"}
                                   >
                                      ★
                                   </button>
                                   <button 
                                     onClick={() => handleToggleAvailability(item._id)}
                                     className="p-2 rounded bg-amber-900/50 text-amber-400 border border-amber-800 hover:bg-amber-800 transition-all"
                                     title="Toggle Availability"
                                   >
                                      <FiClock />
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteProduct(item._id)}
                                     className="p-2 rounded bg-red-950/50 text-red-500 border border-red-900/50 hover:bg-red-900 transition-all"
                                     title="Delete Product"
                                   >
                                      <FiTrash2 />
                                   </button>
                                </div>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="3" className="p-10 text-center text-amber-100/40 text-xs uppercase tracking-widest">No products found. Add one above!</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                 </div>
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
                                         {o.deliveryAddress.lat && o.deliveryAddress.lng && (
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${o.deliveryAddress.lat},${o.deliveryAddress.lng}`} target="_blank" rel="noreferrer" className="block text-blue-400 hover:text-blue-300 mt-1 text-xs underline">
                                                [View on Map]
                                            </a>
                                         )}
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

      {/* Messaging Modal */}
      {msgModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-amber-950 border border-amber-900 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-scale-in">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-playfair text-xl font-bold text-amber-50">Send Message to {selectedUser?.name}</h3>
                <button onClick={() => setMsgModalOpen(false)} className="text-amber-100/40 hover:text-white transition-colors text-xl"><FiX /></button>
             </div>
             <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1.5">Subject / Title</label>
                   <input 
                     type="text" 
                     className="w-full bg-black/40 border border-amber-900 rounded-xl p-3 text-white outline-none focus:border-amber-500"
                     value={msgTitle}
                     onChange={(e) => setMsgTitle(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-1.5">Message Content</label>
                   <textarea 
                     rows="5"
                     className="w-full bg-black/40 border border-amber-900 rounded-xl p-3 text-white outline-none focus:border-amber-500 text-sm"
                     placeholder="Type your message here..."
                     value={msgBody}
                     onChange={(e) => setMsgBody(e.target.value)}
                     required
                   />
                </div>
                <div className="flex gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setMsgModalOpen(false)}
                     className="flex-1 py-3 rounded-xl border border-amber-900 text-amber-100/60 font-bold hover:bg-amber-900/20 transition-all"
                   >
                      Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={sendingMsg}
                     className="flex-1 py-3 rounded-xl bg-amber-500 text-amber-950 font-black hover:bg-amber-400 transition-all disabled:opacity-50"
                   >
                      {sendingMsg ? 'Sending...' : 'Send Message'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
