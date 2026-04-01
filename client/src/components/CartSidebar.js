'use client';
import { useEffect, useState } from 'react';
import { FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';

export default function CartSidebar({ isOpen, onClose }) {
  const { cart, updateQuantity, removeFromCart, subtotal, deliveryFee, tax, total } = useCart();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setShow(false), 300); // match transition duration
      document.body.style.overflow = 'auto';
    }
  }, [isOpen]);

  if (!isOpen && !show) return null;

  return (
    <div className="relative z-50">
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div 
              className={`pointer-events-auto w-screen max-w-md transform transition ease-in-out duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
              <div className="flex h-full flex-col bg-black border-l border-white/10 shadow-xl overflow-y-scroll scrollbar-hide">
                {/* Header */}
                <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-2xl font-playfair font-bold text-amber-50">
                      Your Cart
                    </h2>
                    <div className="ml-3 flex h-7 items-center">
                      <button
                        type="button"
                        className="relative -m-2 p-2 text-amber-400 hover:text-amber-300 transition-colors"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <FiX className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="mt-8">
                    <div className="flow-root">
                      <ul role="list" className="-my-6 divide-y divide-amber-900/50">
                        {cart.length === 0 ? (
                          <div className="text-center py-10">
                            <p className="text-amber-100/60 font-medium">Your cart is empty.</p>
                            <button
                              type="button"
                              className="mt-4 text-amber-500 hover:text-amber-400 font-bold transition-colors"
                              onClick={onClose}
                            >
                              Continue Shopping
                            </button>
                          </div>
                        ) : (
                          cart.map((item) => (
                            <li key={item.product._id} className="flex py-6">
                              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-amber-900/50 relative bg-amber-900/20">
                                <Image
                                  src={item.product.image || '/placeholder-food.jpg'}
                                  alt={item.product.name}
                                  fill
                                  className="object-cover object-center"
                                />
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-base font-medium text-amber-50">
                                    <h3>
                                      <Link href={`/menu/${item.product._id}`} onClick={onClose} className="hover:text-amber-400 transition-colors">
                                        {item.product.name}
                                      </Link>
                                    </h3>
                                    <p className="ml-4 flex-shrink-0 text-amber-400 font-bold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                  <p className="mt-1 text-sm text-amber-100/60">
                                    {item.product.category?.name || 'Category'}
                                  </p>
                                </div>
                                <div className="flex flex-1 items-end justify-between text-sm mt-2">
                                  <div className="flex items-center space-x-3 border border-amber-900/50 rounded-full px-3 py-1 bg-amber-950/80 shadow-inner max-w-min">
                                    <button
                                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                      className="text-amber-100/80 hover:text-amber-400 transition-colors p-1"
                                    >
                                      <FiMinus className="w-3 h-3" />
                                    </button>
                                    <span className="text-amber-50 font-bold w-4 text-center">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                      className="text-amber-100/80 hover:text-amber-400 transition-colors p-1"
                                    >
                                      <FiPlus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    className="font-medium text-red-400 hover:text-red-300 transition-colors p-2"
                                    onClick={() => removeFromCart(item.product._id)}
                                  >
                                    <FiTrash2 className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                  <div className="border-t border-white/10 px-4 py-6 sm:px-6 bg-black/95 sticky bottom-0">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-amber-100/80">
                            <p>Subtotal</p>
                            <p className="font-medium text-amber-50">₹{subtotal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between text-sm text-amber-100/80">
                            <p>Delivery Fee <span className="text-amber-500/80 text-xs ml-1">(Free over ₹1000)</span></p>
                            <p className="font-medium text-amber-50">{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</p>
                        </div>
                        <div className="flex justify-between text-sm text-amber-100/80">
                            <p>Taxes (5% GST)</p>
                            <p className="font-medium text-amber-50">₹{tax.toFixed(2)}</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between text-2xl font-bold font-playfair text-amber-400 mb-6 py-4 border-t border-amber-900/50">
                      <p>Total</p>
                      <p>₹{total.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <Link
                        href="/checkout"
                        onClick={onClose}
                        className="flex items-center justify-center rounded-full border border-transparent bg-amber-500 px-6 py-4 text-base font-bold text-amber-950 shadow-lg hover:bg-amber-400 hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all w-full"
                      >
                        Checkout Securely
                      </Link>
                    </div>
                    
                    <div className="mt-6 flex justify-center text-center text-sm text-amber-100/60">
                      <p>
                        or{' '}
                        <button
                          type="button"
                          className="font-medium text-amber-500 hover:text-amber-400 transition-colors"
                          onClick={onClose}
                        >
                          Continue Shopping
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
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
