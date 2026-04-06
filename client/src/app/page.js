import HeroSection from '@/components/HeroSection';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

import NoticeBoard from '@/components/NoticeBoard';

// Fetch featured items
async function getFeaturedItems() {
  try {
    const res = await fetch('http://localhost:5000/api/menu?limit=4&isPopular=true', { 
      next: { revalidate: 60 } // Revalidate every minute
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data.items || [];
  } catch (error) {
    console.error('Failed to fetch featured items:', error);
    return [];
  }
}

export default async function Home() {
  const featuredItems = await getFeaturedItems();

  return (
    <>
      <NoticeBoard />
      <HeroSection />

      {/* Featured Items Section */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-4">
                Popular <span className="text-amber-500 italic">Dishes</span>
              </h2>
              <p className="text-amber-100/60 max-w-xl">
                Chef's curated selection of our most loved high-protein meals. 
                Consistently rated 5-stars by our community.
              </p>
            </div>
            <Link 
              href="/menu"
              className="hidden md:inline-flex text-amber-500 hover:text-amber-400 font-bold tracking-wide transition-colors border-b-2 border-transparent hover:border-amber-400 pb-1"
            >
              View Full Menu &rarr;
            </Link>
          </div>

          {featuredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredItems.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-amber-950/30 rounded-3xl border border-amber-900/50">
              <p className="text-amber-100/60 mb-4">Could not load popular dishes at this time.</p>
              <Link href="/menu" className="text-amber-500 font-bold hover:underline">
                Browse our Menu
              </Link>
            </div>
          )}
          
          <div className="mt-10 text-center md:hidden">
            <Link 
              href="/menu"
              className="inline-block text-amber-500 hover:text-amber-400 font-bold tracking-wide transition-colors"
            >
              View Full Menu &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-amber-950 border-y border-amber-900/50 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-[#0a0805] opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-4">
              How It <span className="text-amber-500 italic">Works</span>
            </h2>
            <p className="text-amber-100/70">
              Simple, transparent, and designed to bring you the freshest food possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[1px] bg-amber-900 border-t border-dashed border-amber-800/50 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-32 h-32 rounded-full border border-amber-900/50 bg-amber-950/80 mb-6 flex items-center justify-center text-5xl group-hover:-translate-y-2 transition-transform shadow-[inset_0_0_20px_rgba(212,164,62,0.1)]">
                🥗
              </div>
              <h3 className="font-playfair text-2xl font-bold text-amber-50 mb-3">1. Choose Your Meal</h3>
              <p className="text-amber-100/60">
                Browse our nutritionist-approved menu. Select meals tailored to your macro goals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-32 h-32 rounded-full border border-amber-900/50 bg-amber-950/80 mb-6 flex items-center justify-center text-5xl group-hover:-translate-y-2 transition-transform shadow-[inset_0_0_20px_rgba(212,164,62,0.1)]">
                👨‍🍳
              </div>
              <h3 className="font-playfair text-2xl font-bold text-amber-50 mb-3">2. Chef Prepared</h3>
              <p className="text-amber-100/60">
                Our expert chefs prepare your meal from scratch using premium organic ingredients.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center group">
              <div className="w-32 h-32 rounded-full border border-amber-900/50 bg-amber-950/80 mb-6 flex items-center justify-center text-5xl group-hover:-translate-y-2 transition-transform shadow-[inset_0_0_20px_rgba(212,164,62,0.1)]">
                🚀
              </div>
              <h3 className="font-playfair text-2xl font-bold text-amber-50 mb-3">3. Fresh Delivery</h3>
              <p className="text-amber-100/60">
                Delivered fresh (never frozen) straight to your door. Just heat, eat, and conquer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 opacity-50"></div>
          {/* subtle gold light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        </div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl mx-auto text-center bg-amber-950/40 p-12 rounded-[2rem] border border-amber-700/30 backdrop-blur-md shadow-2xl">
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-6">
              Ready to fuel your <span className="text-amber-500 italic">potential?</span>
            </h2>
            <p className="text-amber-100/70 text-lg mb-10">
              Join thousands of others achieving their fitness goals without sacrificing taste. First order comes with free delivery!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/auth/register"
                className="bg-amber-500 text-amber-950 hover:bg-amber-400 px-8 py-4 rounded-full font-bold transition-transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
              >
                Sign Up Now
              </Link>
              <Link 
                href="/menu"
                className="bg-transparent text-amber-100 border border-amber-600/50 hover:bg-amber-900/50 px-8 py-4 rounded-full font-bold transition-all"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

