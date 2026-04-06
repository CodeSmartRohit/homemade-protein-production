'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, subtotal, deliveryFee, tax, total } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [trxId, setTrxId] = useState('');

  useEffect(() => {
    api.get('/settings/public').then(res => setSettings(res.data?.data?.settings)).catch(console.error);
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to checkout');
      router.push('/auth/login?redirect=/checkout');
    } else if (user?.addresses) {
      setAddresses(user.addresses);
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      if (defaultAddr) setSelectedAddress(defaultAddr._id || defaultAddr.street);
    }
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading || cart.length === 0) {
    if (cart.length === 0 && !authLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h2 className="text-3xl font-playfair font-bold text-amber-50 mb-4">Your cart is empty</h2>
          <p className="text-amber-100/60 mb-8 max-w-md">Looks like you haven't added any meals to your cart yet.</p>
          <button onClick={() => router.push('/menu')} className="bg-amber-500 text-amber-950 font-bold px-8 py-3 rounded-full hover:bg-amber-400">
            Browse Menu
          </button>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const handleCreateOrderAndPay = async () => {
    if (deliveryType === 'delivery' && !selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order
      let finalInstructions = specialInstructions;
      if (paymentMethod === 'upi_qr') {
        if (!trxId) {
           toast.error('Please enter the Transaction ID to confirm payment.');
           setIsProcessing(false);
           return;
        }
        finalInstructions += `\n[UPI TRX ID: ${trxId}]`;
      }

      const orderData = {
        items: cart.map(item => ({
          menuItem: item.product._id,
          quantity: item.quantity,
          price: item.product.price
        })),
        deliveryAddress: deliveryType === 'delivery' ? addresses.find(a => (a._id || a.street) === selectedAddress) : undefined,
        deliveryType,
        paymentMethod: paymentMethod === 'upi_qr' ? 'online' : paymentMethod, // Store as online in DB
        specialInstructions: finalInstructions
      };

      const orderRes = await api.post('/orders', orderData);
      const order = orderRes.data.data.order;

      // 2. Payment Flow
      if (paymentMethod === 'card') {
        const payRes = await api.post('/payments/create-order', { orderId: order._id });
        const { razorpayOrderId, currency, amount } = payRes.data.data;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // fallback for dev
          amount: amount.toString(),
          currency,
          name: 'HOMEMADE Protein',
          description: `Order #${order.orderNumber}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              // Verify payment
              await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order._id,
              });
              
              toast.success('Payment successful!');
              clearCart();
              router.push(`/orders/${order._id}`);
            } catch (err) {
              console.error('Payment verification failed', err);
              toast.error('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone || '',
          },
          theme: { color: '#f59e0b' } // amber-500
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment Failed');
        });
        rzp.open();
        
      } else {
        // COD Delivery
        toast.success('Order placed successfully!');
        clearCart();
        router.push(`/orders/${order._id}`);
      }

    } catch (error) {
      console.error('Order creation failed', error);
      toast.error(error.response?.data?.error || 'Failed to process order');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      <h1 className="font-playfair text-4xl font-bold text-amber-50 mb-10">Checkout</h1>
      
      {/* Checkout Steps Progress */}
      <div className="flex items-center justify-between mb-12 relative max-w-2xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-amber-900/50 -z-10 -mt-0.5"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-amber-500 -z-10 -mt-0.5 transition-all duration-500"
          style={{ width: `${(step - 1) * 50}%` }}
        ></div>
        
        {[
          { num: 1, label: 'Delivery', icon: FiMapPin },
          { num: 2, label: 'Summary', icon: FiCheckCircle },
          { num: 3, label: 'Payment', icon: FiCreditCard }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-colors ${
              step >= s.num 
                ? 'bg-amber-500 border-amber-950 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                : 'bg-amber-950 border-amber-900 text-amber-100/50'
            }`}>
              <s.icon className="w-5 h-5" />
            </div>
            <span className={`mt-2 font-bold ${step >= s.num ? 'text-amber-400' : 'text-amber-100/50'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          
          {/* Step 1: Delivery Details */}
          {step === 1 && (
            <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-8 backdrop-blur animate-fade-in">
              <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">
                Delivery Options
              </h2>
              
              <div className="flex space-x-4 mb-8">
                <button 
                  onClick={() => setDeliveryType('delivery')}
                  className={`flex-1 py-4 border rounded-xl font-bold transition-all ${
                    deliveryType === 'delivery' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'bg-amber-950/50 border-amber-900 text-amber-100/60 hover:border-amber-700'
                  }`}
                >
                  Home Delivery
                </button>
                <button 
                  onClick={() => setDeliveryType('pickup')}
                  className={`flex-1 py-4 border rounded-xl font-bold transition-all ${
                    deliveryType === 'pickup' 
                      ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'bg-amber-950/50 border-amber-900 text-amber-100/60 hover:border-amber-700'
                  }`}
                >
                  Pickup
                </button>
              </div>

              {deliveryType === 'delivery' && (
                <div className="mb-8">
                  <h3 className="font-bold text-amber-100 mb-4">Select Address</h3>
                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((addr) => (
                        <label 
                          key={addr._id || addr.street} 
                          className={`flex items-start p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedAddress === (addr._id || addr.street) 
                              ? 'border-amber-500 bg-amber-900/40' 
                              : 'border-amber-900 hover:border-amber-700 bg-amber-950/20'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="address" 
                            checked={selectedAddress === (addr._id || addr.street)}
                            onChange={() => setSelectedAddress(addr._id || addr.street)}
                            className="mt-1 form-radio text-amber-500 bg-amber-950 border-amber-800 focus:ring-amber-500" 
                          />
                          <div className="ml-4 text-left">
                            <span className="font-bold border-b border-amber-500/50 text-amber-50 pb-0.5">{addr.label || 'Home'}</span>
                            <p className="text-amber-100/70 mt-2 text-sm">{addr.street}</p>
                            <p className="text-amber-100/70 text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                            {addr.lat && addr.lng && (
                              <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                                <FiMapPin className="w-3 h-3" /> Location Added
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-amber-900 rounded-xl bg-amber-950/20">
                       <p className="text-amber-100/60 mb-4">You don't have any saved addresses.</p>
                       <button onClick={() => router.push('/profile')} className="text-amber-500 font-bold hover:underline">
                         Add an address in Profile
                       </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-8">
                <h3 className="font-bold text-amber-100 mb-4">Special Instructions</h3>
                <textarea
                  className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 transition-colors"
                  rows="3"
                  placeholder="Extra sauces, allergy warnings, or delivery instructions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                ></textarea>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={deliveryType === 'delivery' && !selectedAddress}
                className="w-full bg-amber-500 text-amber-950 font-bold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20"
              >
                Continue to Summary
              </button>
            </div>
          )}

          {/* Step 2: Order Summary */}
          {step === 2 && (
            <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-8 backdrop-blur animate-fade-in">
              <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">
                Order Summary
              </h2>
              
              <ul className="divide-y divide-amber-900/50 mb-8">
                {cart.map((item) => (
                  <li key={item.product._id} className="py-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-lg bg-amber-900/30 border border-amber-900 overflow-hidden relative mr-4">
                        <Image src={item.product.image || '/placeholder-food.jpg'} fill className="object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-50">{item.product.name}</h4>
                        <span className="text-sm text-amber-100/60">Qty: {item.quantity} × ₹{item.product.price}</span>
                      </div>
                    </div>
                    <span className="font-bold text-amber-400">₹{item.quantity * item.product.price}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-amber-900 rounded-xl text-amber-100 hover:bg-amber-900/50 font-bold transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-amber-500 text-amber-950 font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-8 backdrop-blur animate-fade-in">
               <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">
                Payment Method
              </h2>
              
              <div className="space-y-4 mb-8">
                <label 
                  className={`flex justify-between items-center p-5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-amber-500 bg-amber-900/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'border-amber-900 hover:border-amber-700 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="form-radio text-amber-500 bg-amber-950 border-amber-800 focus:ring-amber-500" 
                    />
                    <div className="ml-4">
                      <span className="font-bold text-amber-50 flex items-center gap-2">
                        <FiCreditCard className="text-amber-500" /> Pay Online
                      </span>
                      <p className="text-amber-100/60 text-sm mt-1">Cards, UPI, NetBanking securely via Razorpay</p>
                    </div>
                  </div>
                  {/* Logos or icons here */}
                </label>

                <label 
                  className={`flex justify-between items-center p-5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'cash' 
                      ? 'border-amber-500 bg-amber-900/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'border-amber-900 hover:border-amber-700 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="form-radio text-amber-500 bg-amber-950 border-amber-800 focus:ring-amber-500" 
                    />
                    <div className="ml-4">
                      <span className="font-bold text-amber-50 flex items-center gap-2">
                        💵 Cash on Delivery (COD)
                      </span>
                      <p className="text-amber-100/60 text-sm mt-1">Pay with cash when your food arrives</p>
                    </div>
                  </div>
                </label>

                <label 
                  className={`flex justify-between items-center p-5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'upi_qr' 
                      ? 'border-amber-500 bg-amber-900/40 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'border-amber-900 hover:border-amber-700 bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-start w-full flex-col md:flex-row">
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'upi_qr'}
                        onChange={() => setPaymentMethod('upi_qr')}
                        className="form-radio text-amber-500 bg-amber-950 border-amber-800 focus:ring-amber-500 mt-1" 
                      />
                      <div className="ml-4">
                        <span className="font-bold text-amber-50 flex items-center gap-2">
                           📱 Pay via UPI / Scan QR
                        </span>
                        <p className="text-amber-100/60 text-sm mt-1 mb-2">Scan code or use ID below, then enter Trx ID.</p>
                      </div>
                    </div>
                    {paymentMethod === 'upi_qr' && (
                       <div className="ml-0 md:ml-12 mt-4 md:mt-0 w-full md:w-auto flex-1 bg-black/50 p-4 rounded-xl border border-amber-900/50">
                         {(settings?.upiIds?.length > 0 || true) && (
                            <div className="text-xs text-amber-100 mb-2">
                               <span className="font-bold opacity-50 uppercase tracking-widest block mb-1">Our UPI IDs</span>
                               {(settings?.upiIds?.length > 0 ? settings.upiIds : ['9340623657@ybl', 'rp111monster@okicici']).map(id => <div key={id} className="font-mono text-amber-500 bg-amber-950/50 px-2 py-1 rounded inline-block mr-2 mb-2">{id}</div>)}
                            </div>
                         )}
                         {settings?.qrCodeImage && (
                            <div className="mb-4">
                               <img src={settings.qrCodeImage} alt="Payment QR Code" className="max-w-[150px] rounded-lg border-2 border-amber-500" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                         )}
                         <div>
                            <input 
                              type="text"
                              value={trxId}
                              onChange={(e) => setTrxId(e.target.value)}
                              placeholder="Enter Transaction Reference ID"
                              required={paymentMethod === 'upi_qr'}
                              className="w-full bg-amber-950 border border-amber-800 text-amber-50 p-2 rounded focus:border-amber-500 outline-none text-sm font-mono placeholder:font-sans"
                            />
                         </div>
                       </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="flex justify-between mt-8">
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-amber-900 rounded-xl text-amber-100 hover:bg-amber-900/50 font-bold transition-colors"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button 
                  onClick={handleCreateOrderAndPay}
                  disabled={isProcessing}
                  className="px-8 py-3 flex items-center justify-center bg-amber-500 text-amber-950 font-bold rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20"
                >
                  {isProcessing ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-amber-950"></span>
                  ) : (
                    `Pay ₹${total.toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Quick Summary sticky */}
        <div className="lg:col-span-1">
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 backdrop-blur sticky top-24 shadow-xl">
            <h3 className="font-playfair font-bold text-xl text-amber-50 mb-6 pb-2 border-b border-amber-900/50">Details</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Subtotal ({cart.length} items)</p>
                  <p className="font-medium">₹{subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Delivery Fee</p>
                  <p className="font-medium">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</p>
              </div>
              <div className="flex justify-between text-sm text-amber-100/80">
                  <p>Taxes (5% GST)</p>
                  <p className="font-medium">₹{tax.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex justify-between text-2xl font-bold font-playfair text-amber-400 pt-4 border-t border-amber-900/50 mb-2">
              <p>Total</p>
              <p>₹{total.toFixed(2)}</p>
            </div>
            
            <div className="mt-6 text-xs text-amber-100/40 text-center flex flex-col items-center gap-2">
              <FiCheckCircle className="text-amber-500 w-5 h-5 mb-1" />
              100% Secure Checkout powered by Razorpay
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
