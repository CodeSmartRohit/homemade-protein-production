'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { FiStar, FiMinus, FiPlus, FiArrowLeft, FiClock, FiActivity } from 'react-icons/fi';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import NutritionCard from '../../../components/NutritionCard';
import ReviewCard from '../../../components/ReviewCard';

export default function MenuItemPage({ params }) {
  const { id } = use(params);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchItemAndReviews = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          api.get(`/menu/${id}`),
          api.get(`/reviews/menu/${id}`)
        ]);
        setProduct(productRes.data.data);
        setReviews(reviewsRes.data.data);
      } catch (error) {
        console.error('Failed to fetch item data', error);
        toast.error('Failed to load menu item');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItemAndReviews();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success(`Added ${quantity} ${product.name} to cart`);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const res = await api.post(`/reviews/menu/${id}`, { rating, comment });
      setReviews([res.data.data, ...reviews]);
      setComment('');
      setRating(5);
      toast.success('Review submitted successfully');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl font-playfair font-bold text-amber-50 mb-4">Item Not Found</h2>
        <Link href="/menu" className="text-amber-500 hover:text-amber-400 border border-amber-500 px-6 py-2 rounded-full">
          Back to Menu
        </Link>
      </div>
    );
  }

  const isVeg = product.dietaryPreference === 'vegetarian' || product.dietaryPreference === 'vegan';

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      <Link href="/menu" className="inline-flex items-center text-amber-100/70 hover:text-amber-400 transition-colors mb-8">
        <FiArrowLeft className="mr-2" /> Back to Menu
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
        {/* Left: Image gallery / hero image */}
        <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square w-full rounded-3xl overflow-hidden bg-amber-900/20 border border-amber-900/50 shadow-2xl group">
          <Image
            src={product.image || '/placeholder-food.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute top-6 right-6 bg-white p-1.5 rounded-sm shadow-xl z-10">
            <div className={`w-4 h-4 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-amber-950/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col">
          <div className="mb-4 flex flex-wrap gap-3">
            <span className="bg-amber-900/40 text-amber-400 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-amber-800/50">
              {product.category?.name || 'Category'}
            </span>
            {product.nutritionInfo?.protein && (
              <span className="bg-amber-500 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                <FiActivity className="w-3 h-3" />
                <span>{product.nutritionInfo.protein}g Protein</span>
              </span>
            )}
          </div>

          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-4">{product.name}</h1>
          
          <div className="flex items-center mb-6">
            <div className="flex space-x-1 mr-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(product.ratings?.average || 0)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-amber-900/50'
                  }`}
                />
              ))}
            </div>
            <span className="text-amber-100/70 text-sm font-medium">
              {product.ratings?.average?.toFixed(1) || '0.0'} ({product.ratings?.count || 0} reviews)
            </span>
          </div>

          <p className="text-amber-100/70 text-lg leading-relaxed mb-8 font-light">
            {product.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
             <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-4 flex items-center text-amber-100/80">
                <FiClock className="text-amber-500 w-6 h-6 mr-3" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-100/50">Prep Time</div>
                  <div className="font-bold text-amber-50">~30 mins</div>
                </div>
             </div>
             <div className="bg-amber-950/40 border border-amber-900/50 rounded-xl p-4 flex items-center text-amber-100/80">
                <FiActivity className="text-amber-500 w-6 h-6 mr-3" />
                <div>
                  <div className="text-xs uppercase tracking-wider text-amber-100/50">Calories</div>
                  <div className="font-bold text-amber-50">{product.nutritionInfo?.calories || '-'} kcal</div>
                </div>
             </div>
          </div>

          <div className="flex items-center space-x-4 mb-8">
            <div className="text-4xl font-bold text-amber-400 font-playfair">
              ₹{product.price}
            </div>
            {product.discount > 0 && (
              <div className="bg-red-900/30 text-red-400 text-xs font-bold px-2 py-1 rounded">
                Save {product.discount}%
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 mt-auto">
            {/* Quantity Control */}
            <div className="flex items-center space-x-4 border-2 border-amber-900 rounded-full px-5 py-3 bg-amber-950/50 shadow-inner">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="text-amber-100/80 hover:text-amber-500 transition-colors p-1"
              >
                <FiMinus className="w-5 h-5" />
              </button>
              <span className="text-amber-50 font-bold text-xl w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="text-amber-100/80 hover:text-amber-500 transition-colors p-1"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-amber-500 text-amber-950 hover:bg-amber-400 font-bold text-lg py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-amber-500/20 hover:-translate-y-1 h-[60px] flex justify-center items-center"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      {/* Tabs / Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column (Nutrition) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <NutritionCard 
              protein={product.nutritionInfo?.protein}
              carbs={product.nutritionInfo?.carbs}
              fats={product.nutritionInfo?.fats}
              calories={product.nutritionInfo?.calories}
            />

             {/* Ingredients */}
             <div className="mt-8 bg-amber-950/30 border border-amber-900/50 rounded-2xl p-6 backdrop-blur">
                <h4 className="font-playfair text-xl font-bold text-amber-50 mb-4">Ingredients</h4>
                {product.ingredients && product.ingredients.length > 0 ? (
                  <ul className="text-sm text-amber-100/70 space-y-2 list-disc pl-5">
                    {product.ingredients.map((ing, idx) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-100/50">Chef's secret blend of fresh, organic ingredients.</p>
                )}
             </div>
          </div>
        </div>

        {/* Right Column (Reviews) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-end border-b border-amber-900/50 pb-4 mb-8">
            <h3 className="font-playfair text-3xl font-bold text-amber-50">Customer Reviews</h3>
            <span className="text-amber-400 font-bold">{reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}</span>
          </div>

          {/* Add Review Form */}
          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="bg-amber-950/40 p-6 rounded-2xl border border-amber-900/50 mb-10">
              <h4 className="font-bold text-amber-50 mb-4">Leave a Review</h4>
              <div className="mb-4">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      onClick={() => setRating(star)}
                    >
                      <FiStar
                        className={`w-6 h-6 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-amber-900'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 mb-4 transition-colors"
                rows="3"
                placeholder="Share your thoughts about this meal..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              ></textarea>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-amber-500 text-amber-950 px-6 py-2 rounded-full font-bold hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-amber-950/40 p-6 rounded-2xl border border-amber-900/50 mb-10 text-center">
              <p className="text-amber-100/70 mb-4">You must be logged in to leave a review.</p>
              <Link href="/auth/login" className="inline-block border border-amber-500 text-amber-400 px-6 py-2 rounded-full hover:bg-amber-500 hover:text-amber-950 font-bold transition-colors">
                Log In
              </Link>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p className="text-amber-100/50 italic py-10 text-center">No reviews yet. Be the first to try and review!</p>
            ) : (
              reviews.map(review => (
                <ReviewCard key={review._id} review={review} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
