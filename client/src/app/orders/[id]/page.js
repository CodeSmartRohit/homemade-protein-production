'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { socket } from '@/lib/socket';
import api from '@/lib/api';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiCreditCard, FiAlertCircle, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OrderDetailPage({ params }) {
  const { id } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/orders/' + id);
      return;
    }

    if (isAuthenticated && id) {
      fetchOrder();
    }
  }, [isAuthenticated, authLoading, router, id]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (order && socket) {
      // Join order room
      socket.emit('joinRoom', `order-${order._id}`);

      // Listen for updates
      socket.on('order-status-update', (data) => {
        if (data.orderId === order._id) {
          setOrder(prev => ({ ...prev, status: data.status, statusHistory: data.statusHistory }));
          toast.success(`Order status updated to: ${data.status}`, {
            icon: '🔔',
            style: {
              borderRadius: '10px',
              background: '#1A1510',
              color: '#d4a43e',
              border: '1px solid #d4a43e'
            },
          });
        }
      });

      return () => {
        socket.emit('leaveRoom', `order-${order._id}`);
        socket.off('order-status-update');
      };
    }
  }, [order?._id]); // Only re-run if order ID changes

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (err) {
      console.error('Failed to fetch order', err);
      toast.error('Could not load order details');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const res = await api.patch(`/orders/${id}/cancel`);
      setOrder(res.data.data.order);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel order');
    }
  };

  const handlePayment = async () => {
    try {
      const payRes = await api.post('/payments/create-order', { orderId: order._id });
      const { razorpayOrderId, currency, amount, keyId } = payRes.data.data;

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount.toString(),
        currency,
        name: 'HOMEMADE Protein',
        description: `Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            });
            
            toast.success('Payment successful!');
            fetchOrder(); // Refresh order state
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: order.customer?.name,
          email: order.customer?.email,
          contact: order.customer?.phone || '',
        },
        theme: { color: '#f59e0b' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Failed to initiate payment');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="text-amber-100/50">Loading order details...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 min-h-screen">
      <Link href="/orders" className="inline-flex items-center text-amber-100/70 hover:text-amber-400 transition-colors mb-8 group">
        <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to My Orders
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-amber-50 mb-2">
            Order <span className="text-amber-500">#{order.orderNumber}</span>
          </h1>
          <p className="text-amber-100/60">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           {(order.status === 'pending' || order.status === 'confirmed') && (
            <button 
              onClick={cancelOrder}
              className="text-red-400 border border-red-900/50 hover:bg-red-900/20 px-6 py-2 rounded-full font-bold transition-all shadow-sm"
            >
              Cancel Order
            </button>
          )}
          
          <Link 
            href="/profile"
            className="flex items-center gap-2 text-amber-950 bg-amber-500 hover:bg-amber-400 px-6 py-2 rounded-full font-bold transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
          >
            <FiMessageSquare /> Support
          </Link>
        </div>
      </div>

      {/* Main Order Status Tracker */}
      <div className="mb-12 shadow-2xl rounded-2xl">
        <OrderStatusTracker status={order.status} createdAt={order.createdAt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Col: Items */}
        <div className="lg:col-span-2">
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg mb-8">
            <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">
              Order Items
            </h2>
            
            <ul className="divide-y divide-amber-900/50">
              {order.items.map((item, idx) => (
                <li key={idx} className="py-6 flex flex-col sm:flex-row gap-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-amber-900/30 border border-amber-800/50 overflow-hidden relative flex-shrink-0">
                    {item.menuItem?.image ? (
                      <Image src={item.menuItem.image} fill className="object-cover" alt={item.menuItem.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-900/50">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-playfair font-bold text-xl text-amber-50 mb-1">{item.menuItem?.name || 'Unknown Item'}</h4>
                      <span className="text-sm bg-amber-900/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/50">Food Item</span>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div className="text-amber-100/70">
                        <span className="text-sm">Quantity:</span> <span className="font-bold text-lg text-amber-50">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-amber-100/50 line-through mb-1">₹{(item.price * item.quantity + item.price * 0.2).toFixed(2)}</div>
                        <div className="font-playfair text-2xl font-bold text-amber-400">₹{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {order.specialInstructions && (
            <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
               <h3 className="font-bold text-amber-50 mb-3 flex items-center gap-2">
                 <FiAlertCircle className="text-amber-500" /> Special Instructions
               </h3>
               <p className="text-amber-100/80 italic border-l-2 border-amber-500 focus:outline pl-4 py-1 bg-amber-900/20 rounded-r-lg">
                 "{order.specialInstructions}"
               </p>
            </div>
          )}
        </div>

        {/* Right Col: Details */}
        <div className="lg:col-span-1 space-y-8">
          {/* Order Summary */}
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg">
            <h3 className="font-playfair font-bold text-xl text-amber-50 mb-6 pb-2 border-b border-amber-900/50">Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Subtotal ({order.items.reduce((acc, i) => acc + i.quantity, 0)} items)</p>
                  <p className="font-medium">₹{order.totalAmount - (order.deliveryFee || 0) - (order.tax || 0)}</p>
              </div>
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Delivery Fee</p>
                  <p className="font-medium">₹{order.deliveryFee || 0}</p>
              </div>
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Taxes</p>
                  <p className="font-medium">₹{order.tax || 0}</p>
              </div>
            </div>
            
            <div className="flex justify-between text-2xl font-bold font-playfair text-amber-400 pt-4 border-t border-amber-900/50">
              <p>Total</p>
              <p>₹{order.totalAmount?.toFixed(2)}</p>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 md:p-8 backdrop-blur shadow-lg">
             <div className="mb-8">
               <h3 className="font-playfair font-bold text-xl text-amber-50 mb-4 pb-2 border-b border-amber-900/50 flex items-center gap-2">
                 <FiMapPin className="text-amber-500" /> Delivery
               </h3>
               {order.deliveryType === 'delivery' && order.deliveryAddress ? (
                 <div className="text-amber-100/80 bg-amber-900/20 p-4 rounded-xl border border-amber-900/50">
                   <p className="font-bold text-amber-50 mb-1 border-b border-amber-900/50 pb-1">{order.deliveryAddress.type || 'Address'}</p>
                   <p>{order.deliveryAddress.street}</p>
                   <p>{order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}</p>
                 </div>
               ) : (
                 <div className="text-amber-100/80 bg-amber-900/20 p-4 rounded-xl border border-amber-900/50">
                   <p className="font-bold text-amber-50 mb-1 border-b border-amber-900/50 pb-1">Pickup Location</p>
                   <p>Main Kitchen</p>
                   <p>123 Healthy Way, Fit City ABC</p>
                 </div>
               )}
             </div>

             <div>
               <h3 className="font-playfair font-bold text-xl text-amber-50 mb-4 pb-2 border-b border-amber-900/50 flex items-center gap-2">
                 <FiCreditCard className="text-amber-500" /> Payment
               </h3>
               
               <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-900/50 flex flex-col gap-2">
                 <div className="flex justify-between text-sm">
                   <span className="text-amber-100/60">Method:</span>
                   <span className="font-bold text-amber-50 uppercase">{order.paymentMethod}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-amber-100/60">Status:</span>
                   <div className="flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                     <span className="font-bold uppercase text-amber-50">{order.paymentStatus}</span>
                   </div>
                 </div>
                 {order.razorpayPaymentId && (
                   <div className="flex justify-between text-xs mt-2 pt-2 border-t border-amber-900/50">
                     <span className="text-amber-100/40 font-mono">ID: {order.razorpayPaymentId}</span>
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
