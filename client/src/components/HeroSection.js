import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
      {/* Background with grain texture and gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-amber-950"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-700/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('/noise.png')] pointer-events-none"></div>
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Text Content */}
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-amber-900/40 border border-amber-800/60 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">Fresh Daily Delivery</span>
          </div>
          
          <h1 className="font-playfair text-5xl md:text-7xl font-bold leading-tight text-amber-50 mb-6 drop-shadow-sm">
            Homemade <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Protein</span>, <br className="hidden md:block"/>
            Delivered Fresh
          </h1>
          
          <p className="text-amber-100/70 text-lg md:text-xl font-light mb-10 max-w-xl leading-relaxed">
            Nourish your body with chef-crafted organic meals. High protein, zero preservatives, 100% natural ingredients prepared daily.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5">
            <Link 
              href="/menu" 
              className="flex items-center justify-center space-x-2 bg-amber-500 text-amber-950 hover:bg-amber-400 px-8 py-4 rounded-full font-bold transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:-translate-y-1"
            >
              <span>Explore Menu</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/auth/register" 
              className="flex items-center justify-center space-x-2 bg-amber-900/30 text-amber-100 border border-amber-800 hover:bg-amber-800 hover:border-amber-700 px-8 py-4 rounded-full font-medium transition-all backdrop-blur-sm"
            >
              <span>Join Now</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center space-x-8 text-sm font-medium text-amber-100/60">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-800/50 p-1.5 rounded-full"><span className="text-amber-400 text-xs">✓</span></span>
              <span>100% Organic</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-800/50 p-1.5 rounded-full"><span className="text-amber-400 text-xs">✓</span></span>
              <span>Chef Prepared</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-800/50 p-1.5 rounded-full"><span className="text-amber-400 text-xs">✓</span></span>
              <span>High Protein</span>
            </div>
          </div>
        </div>

        {/* Visual Content (Abstract or image) */}
        <div className="flex-1 relative w-full aspect-square max-w-lg md:max-w-xl">
          <div className="absolute inset-0 bg-amber-900/20 border border-amber-800/50 rounded-full animate-[spin_60s_linear_infinite] shadow-[inset_0_0_50px_rgba(212,164,62,0.1)]"></div>
          <div className="absolute inset-4 bg-amber-800/20 border border-amber-700/30 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
          
          <div className="absolute inset-8 rounded-full overflow-hidden border-4 border-amber-950 shadow-2xl z-10 bg-amber-900/50 flex items-center justify-center">
            <div className="w-full h-full relative">
              <Image 
                src="/hero-food.png" 
                alt="Food that fuels" 
                fill 
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
          
          {/* Floating UI elements */}
          <div className="absolute -top-6 -right-6 bg-amber-950 border border-amber-800 rounded-xl p-4 shadow-xl z-20 backdrop-blur-md animate-bounce" style={{ animationDuration: '3s' }}>
            <div className="text-xs font-bold text-amber-100 tracking-wide mb-1 uppercase">Calories</div>
            <div className="text-2xl font-bold font-playfair text-amber-400">450<span className="text-sm font-sans text-amber-100/50 ml-1">kcal</span></div>
          </div>
          
          <div className="absolute top-1/2 -left-12 bg-amber-950 border border-amber-800 rounded-xl p-4 shadow-xl z-20 backdrop-blur-md animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <div className="text-xs font-bold text-amber-100 tracking-wide mb-1 uppercase">Protein</div>
            <div className="text-2xl font-bold font-playfair text-amber-400">42<span className="text-sm font-sans text-amber-100/50 ml-1">g</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
