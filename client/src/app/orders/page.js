'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { FiClock, FiCheck, FiPackage, FiTruck, FiHome, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATUS_ICONS = {
  pending: <FiClock className="text-amber-500 w-5 h-5" />,
  confirmed: <FiCheck className="text-amber-400 w-5 h-5" />,
  preparing: <FiPackage className="text-amber-600 w-5 h-5" />,
  ready: <FiPackage className="text-green-500 w-5 h-5" />,
  out_for_delivery: <FiTruck className="text-amber-500 w-5 h-5" />,
  delivered: <FiHome className="text-green-400 w-5 h-5" />,
  cancelled: <FiX className="text-red-500 w-5 h-5" />,
};

const getStatusColor = (status) => {
  if (status === 'delivered') return 'bg-green-900/30 text-green-400 border-green-800';
  if (status === 'cancelled') return 'bg-red-900/30 text-red-400 border-red-800';
  return 'bg-amber-900/40 text-amber-400 border-amber-800/50';
};

export default function MyOrdersPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/orders');
      return;
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders', err);
      toast.error('Could not load your orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
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
    <div className="container mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-amber-50 mb-2">My Orders</h1>
          <p className="text-amber-100/60">Track, manage, and review your past orders.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-3 bg-amber-950 border border-amber-900 rounded-full text-amber-400 hover:bg-amber-900 transition-colors shadow-lg"
          title="Refresh Orders"
        >
          <FiRefreshCw className="w-5 h-5" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-amber-950/30 rounded-3xl border border-amber-900/50">
          <div className="text-6xl mb-6">🍽️</div>
          <p className="text-amber-100/60 mb-8 max-w-sm mx-auto">You haven't placed any orders yet. Once you order, you'll see them here.</p>
          <Link href="/menu" className="bg-amber-500 text-amber-950 font-bold px-8 py-3 rounded-full hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Explore Menu
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const orderDate = order.createdAt && !isNaN(new Date(order.createdAt).getTime()) ? new Date(order.createdAt) : null;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <div key={order._id} className="bg-amber-950/40 border border-amber-900/60 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg hover:shadow-amber-900/20 transition-all flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <h3 className="font-playfair font-bold text-xl text-amber-50">
                      Order #{order.orderNumber || order._id?.slice(-6)}
                    </h3>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {STATUS_ICONS[order.status]} 
                      {order.status}
                    </div>
                  </div>

                  <p className="text-sm text-amber-100/50 mb-4 flex items-center">
                    <FiClock className="mr-2" /> 
                    Placed {orderDate ? `on ${orderDate.toLocaleDateString()} at ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}` : ''}
                  </p>

                  <div className="text-amber-100/80 mb-6 max-w-xl">
                    {items.map(item => `${item.quantity || 1}x ${item.name || item.menuItem?.name || 'Item'}`).join(', ')}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <Link 
                      href={`/orders/${order._id}`}
                      className="bg-amber-500 text-amber-950 font-bold px-6 py-2 rounded-full hover:bg-amber-400 transition-colors text-sm shadow-[0_4px_10px_rgba(245,158,11,0.2)]"
                    >
                      View Details
                    </Link>

                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button 
                        onClick={() => cancelOrder(order._id)}
                        className="text-red-400 hover:text-red-300 font-medium text-sm border border-red-900/50 hover:bg-red-900/20 px-6 py-2 rounded-full transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:border-l md:border-amber-900/50 md:pl-8 flex flex-col justify-center items-start md:items-end min-w-[200px]">
                  <div className="text-amber-100/50 text-sm mb-1 uppercase tracking-wider font-bold">Total Amount</div>
                  <div className="font-playfair text-3xl font-bold text-amber-50">₹{Number(order.totalAmount || 0).toFixed(2)}</div>
                  <div className="text-amber-100/70 text-sm mt-3 flex items-center bg-amber-950 px-3 py-1.5 rounded-lg border border-amber-900/50">
                    <div className={`w-2 h-2 rounded-full mr-2 ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    Payment: <span className="font-bold ml-1 uppercase">{order.paymentStatus || 'Pending'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
