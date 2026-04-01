'use client';
import { useState, useEffect, useCallback } from 'react';
import ProductCard3D from '@/components/ProductCard3D';
import { FiFilter, FiSearch, FiX, FiCoffee, FiCloud, FiWind, FiCircle, FiDisc, FiLayers, FiSun, FiDroplet } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const categoryIcons = {
  shakes: <FiCoffee />,
  salads: <FiCloud />,
  yogurts: <FiWind />,
  burgers: <FiCircle />,
  pizzas: <FiDisc />,
  wraps: <FiLayers />,
  desserts: <FiSun />,
  beverages: <FiDroplet />
};

export default function MenuPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dietaryPref, setDietaryPref] = useState(''); // 'vegetarian', 'vegan', 'non-vegetarian'
  const [sortBy, setSortBy] = useState('-createdAt'); // Default newest

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data.categories);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let queryUrl = `/menu?page=${page}&limit=12`;
      if (selectedCategory) queryUrl += `&category=${selectedCategory}`;
      if (dietaryPref) queryUrl += `&dietaryPreference=${dietaryPref}`;
      // Basic search logic (requires backend support or replace with exact keyword logic)
      if (searchTerm) queryUrl += `&keyword=${encodeURIComponent(searchTerm)}`;

      // Sort logic
      if (sortBy) {
        if (sortBy === 'price-asc') queryUrl += '&sortBy=price&order=asc';
        else if (sortBy === 'price-desc') queryUrl += '&sortBy=price&order=desc';
        else if (sortBy === '-createdAt') queryUrl += '&sortBy=createdAt&order=desc';
        else if (sortBy === 'rating') queryUrl += '&sortBy=ratings.average&order=desc';
      }

      const res = await api.get(queryUrl);
      setProducts(res.data.data.items);
      if (res.data.data.pagination) {
        setTotalPages(Math.ceil(res.data.data.pagination.total / res.data.data.pagination.limit) || 1);
      }
    } catch (error) {
      console.error('Failed to fetch menu items', error);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, dietaryPref, searchTerm, sortBy]);

  useEffect(() => {
    // Initial parallel load
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchProducts()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    // Debounce search slightly for better performance
    const delayDebounce = setTimeout(() => {
      setPage(1); // Reset to first page on filter change
      fetchProducts();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, selectedCategory, dietaryPref, sortBy]); // Removed fetchProducts from deps to avoid infinite loop

  // Handle page change explicitly
  useEffect(() => {
    if (page > 1) {
      fetchProducts();
    }
  }, [page]);


  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDietaryPref('');
    setSortBy('-createdAt');
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12">
      {/* Page Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-playfair text-4xl md:text-6xl font-bold text-amber-50 mb-4">
            Our <span className="text-amber-500 italic"> Menu</span>
          </h1>
          <p className="text-amber-100/70 max-w-xl text-lg leading-relaxed">
            Elevate your gains with flavor that hits different. Savor our chef-crafted meals—the ultimate, mouth-watering fuel for carving a lean, aesthetic physique.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-6 py-2 rounded-full font-bold transition-all border ${selectedCategory === ''
              ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-amber-950/50 text-amber-100/60 border-amber-900/50 hover:border-amber-500/50'
              }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id === selectedCategory ? '' : cat._id)}
              className={`px-6 py-2 rounded-full font-bold transition-all border flex items-center gap-2 ${selectedCategory === cat._id
                ? 'bg-amber-500 text-amber-950 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-amber-950/50 text-amber-100/60 border-amber-900/50 hover:border-amber-500/50'
                }`}
            >
              {categoryIcons[cat.slug] || <FiFilter />}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <div className="relative flex-1 mr-4 border border-amber-900/50 rounded-full bg-amber-950/50">
            <input
              type="text"
              placeholder="Search meals..."
              className="w-full bg-transparent text-amber-50 pl-10 pr-4 py-3 rounded-full outline-none focus:border-amber-500/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-amber-900 border border-amber-800 text-amber-100 p-3 rounded-full flex items-center gap-2"
          >
            <FiFilter /> Filters
          </button>
        </div>

        {/* Sidebar Filters */}
        <div className={`
          lg:w-1/4 flex-shrink-0
          ${showFilters ? 'block mb-8 bg-amber-950/80 p-6 rounded-2xl border border-amber-900' : 'hidden lg:block'}
        `}>
          <div className="sticky top-24 space-y-8">
            <div className="flex justify-between items-center lg:hidden mb-6">
              <h3 className="font-bold text-amber-50 text-xl">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-amber-500"><FiX className="w-6 h-6" /></button>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:block relative border border-amber-900/50 rounded-full bg-amber-950/50">
              <input
                type="text"
                placeholder="Search meals..."
                className="w-full bg-transparent text-amber-50 pl-10 pr-4 py-3 rounded-full outline-none focus:ring-1 focus:ring-amber-500/50 transition-all font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 w-5 h-5" />
            </div>

            {/* Sort */}
            <div>
              <h4 className="font-bold text-amber-100 uppercase tracking-wider text-sm mb-4">Sort By</h4>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-amber-950 border border-amber-900 rounded-lg text-amber-50 px-4 py-3 outline-none focus:border-amber-500"
              >
                <option value="-createdAt">Newest Additions</option>
                <option value="rating">Highest Rated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <h4 className="font-bold text-amber-100 uppercase tracking-wider text-sm mb-4">Categories</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="form-radio text-amber-500 focus:ring-amber-500 bg-amber-950 border-amber-800"
                    />
                    <span className="text-amber-100/80 group-hover:text-amber-400 transition-colors">All Categories</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat._id} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        value={cat._id}
                        checked={selectedCategory === cat._id}
                        onChange={() => setSelectedCategory(cat._id)}
                        className="form-radio text-amber-500 focus:ring-amber-500 bg-amber-950 border-amber-800"
                      />
                      <span className="text-amber-100/80 group-hover:text-amber-400 transition-colors">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dietary Preference */}
            <div>
              <h4 className="font-bold text-amber-100 uppercase tracking-wider text-sm mb-4">Dietary</h4>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => setDietaryPref(dietaryPref === 'vegetarian' ? '' : 'vegetarian')}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${dietaryPref === 'vegetarian'
                    ? 'bg-green-900/30 border-green-500/50 text-green-400 font-medium'
                    : 'bg-amber-950/30 border-amber-900 text-amber-100/70 hover:border-amber-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <span>Vegetarian</span>
                  </div>
                </button>
                <button
                  onClick={() => setDietaryPref(dietaryPref === 'vegan' ? '' : 'vegan')}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${dietaryPref === 'vegan'
                    ? 'bg-green-900/30 border-green-500/50 text-green-400 font-medium'
                    : 'bg-amber-950/30 border-amber-900 text-amber-100/70 hover:border-amber-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Vegan</span>
                  </div>
                </button>
                <button
                  onClick={() => setDietaryPref(dietaryPref === 'non-vegetarian' ? '' : 'non-vegetarian')}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg border transition-all ${dietaryPref === 'non-vegetarian'
                    ? 'bg-red-900/30 border-red-500/50 text-red-400 font-medium'
                    : 'bg-amber-950/30 border-amber-900 text-amber-100/70 hover:border-amber-700'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-600"></div>
                    <span>Non-Vegetarian</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="w-full py-3 mt-4 text-sm font-bold text-amber-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1">
          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-amber-950/30 rounded-3xl border border-amber-900/50 flex flex-col items-center">
              <span className="text-6xl mb-4">🍽️</span>
              <h3 className="text-2xl font-playfair font-bold text-amber-50 mb-2">No meals found</h3>
              <p className="text-amber-100/60 mb-6 max-w-md">Try adjusting your filters or search terms to find what you're looking for.</p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-amber-500 text-amber-950 font-bold rounded-full hover:bg-amber-400"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-12 perspective-1000"
              >
                <AnimatePresence mode="popLayout">
                  {products.map(product => (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.4, type: 'spring' }}
                    >
                      <ProductCard3D product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-amber-900 rounded-lg text-amber-100 disabled:opacity-50 hover:bg-amber-900/50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-amber-50 px-4">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-amber-900 rounded-lg text-amber-100 disabled:opacity-50 hover:bg-amber-900/50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
} 
