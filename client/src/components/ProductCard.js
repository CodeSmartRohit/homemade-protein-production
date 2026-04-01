'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { FiPlus, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1);
    toast.success(`Added ${product.name} to cart`);
  };

  const isVeg = product.dietaryPreference === 'vegetarian' || product.dietaryPreference === 'vegan';

  return (
    <Link 
      href={`/menu/${product._id}`}
      className="group flex flex-col bg-amber-900/10 border border-amber-900/30 rounded-2xl overflow-hidden hover:bg-amber-900/20 hover:border-amber-500/30 transition-all duration-300 relative hover:-translate-y-1 shadow-lg hover:shadow-amber-900/20"
    >
      {/* Image container */}
      <div className="relative h-56 w-full overflow-hidden bg-amber-900/20">
        <Image
          src={product.image || '/placeholder-food.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.category?.name && (
            <span className="bg-amber-950/80 backdrop-blur text-amber-100 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-amber-900/50">
              {product.category.name}
            </span>
          )}
        </div>
        
        {/* Veg/Non-veg indicator */}
        <div className="absolute top-4 right-4 bg-white p-1 rounded-sm shadow-sm">
          <div className={`w-3 h-3 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
        </div>

        {/* Protein Badge */}
        {product.nutritionInfo?.protein && (
          <div className="absolute bottom-4 left-4 bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
            <span>{product.nutritionInfo.protein}g</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">Protein</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-playfair text-xl font-bold text-amber-50 group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center text-amber-500 text-sm font-bold bg-amber-950/50 px-2 py-1 rounded">
            <FiStar className="w-3.5 h-3.5 mr-1 fill-amber-500" />
            <span>{product.ratings?.average?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        
        <p className="text-amber-100/60 text-sm line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>

        <div className="flex justify-between items-end mt-auto pt-4 border-t border-amber-900/30">
          <div>
            <span className="text-sm text-amber-100/50 mr-1">₹</span>
            <span className="text-xl font-bold text-amber-50">{product.price}</span>
          </div>
          
          <button
            onClick={handleAdd}
            className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-amber-950 group-hover:border-amber-400 transition-all hover:scale-110 active:scale-95"
            aria-label="Add to cart"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
