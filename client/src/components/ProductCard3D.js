'use client';
import { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { FiPlus, FiHeart, FiClock } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard3D({ product }) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position values for 3D effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Transform coordinates into degrees for tilt
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`, {
      style: {
        borderRadius: '10px',
        background: '#1A1510',
        color: '#d4a43e',
        border: '1px solid #d4a43e'
      },
    });
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      className="relative h-[450px] w-full rounded-3xl bg-amber-950/20 border border-white/5 backdrop-blur-md cursor-pointer group p-6 shadow-2xl transition-all duration-300"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl pointer-events-none group-hover:from-amber-500/20 transition-all duration-500" />

      {/* Product Image Stage */}
      <div 
        style={{ transform: 'translateZ(50px)', transformStyle: 'preserve-3d' }}
        className="relative w-full h-56 mb-6 flex items-center justify-center pt-8"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <motion.div 
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="relative w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_40px_80px_rgba(0,0,0,0.7)] transition-all duration-500"
        >
          <Image 
            src={product.image || '/placeholder-food.jpg'} 
            layout="fill"
            objectFit="contain"
            className="object-contain"
            alt={product.name}
          />
        </motion.div>
      </div>

      {/* Floating Price Tag */}
      <motion.div 
        style={{ 
          transform: 'translateZ(80px)',
          right: '-10px',
          top: '20px'
        }}
        className="absolute z-20 animate-float-3d"
      >
        <div className="bg-amber-500 text-amber-950 px-6 py-2 rounded-full font-black text-xl shadow-[0_10px_30px_rgba(245,158,11,0.5)] skew-x-[-10deg] border-2 border-white/40">
          ₹{product.price}
        </div>
      </motion.div>

      {/* Categories / Badges */}
      <div style={{ transform: 'translateZ(30px)' }} className="flex justify-between items-start mb-4">
        <span className="text-[10px] uppercase tracking-widest font-black text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/20">
          {product.category?.name || 'Protein Item'}
        </span>
        <button className="text-white/30 hover:text-red-500 transition-colors">
          <FiHeart className="w-5 h-5" />
        </button>
      </div>

      {/* Content Area */}
      <div style={{ transform: 'translateZ(40px)' }} className="space-y-4">
        <div>
          <h3 className="font-playfair text-2xl font-bold text-amber-50 leading-tight group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-amber-100/40 text-xs line-clamp-2 mt-2 leading-relaxed">
            {product.description || 'A delicious and nutritious high-protein meal prepared with premium ingredients.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-amber-100/30 text-[10px] font-bold">
            <FiClock className="text-amber-500/50" />
            <span>15-20 MIN</span>
          </div>
          <button 
            onClick={handleAddToCart}
            className="bg-white/5 hover:bg-amber-500 hover:text-amber-950 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-white/10 group-hover:scale-110 active:scale-95"
          >
            <FiPlus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
