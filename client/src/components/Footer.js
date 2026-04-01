import Link from 'next/link';
import { FiInstagram, FiTwitter, FiFacebook, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-amber-950 border-t border-amber-900/50 pt-16 pb-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6 group">
              <span className="font-playfair text-2xl font-bold tracking-wider text-amber-50 group-hover:text-amber-400 transition-colors">
                HOMEMADE
              </span>
              <span className="block text-xs md:text-xs tracking-widest uppercase text-amber-500 font-semibold mt-1">
                Protein
              </span>
            </Link>
            <p className="text-amber-100/70 text-sm leading-relaxed mb-6">
              Nourishing your body with premium, chef-crafted organic meals. Prepared fresh daily with the finest ingredients and delivered directly to your door.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-800 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-amber-950 transition-all">
                <FiInstagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-800 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-amber-950 transition-all">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-amber-900/50 border border-amber-800 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-amber-950 transition-all">
                <FiFacebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-playfair font-bold text-amber-50 text-lg mb-6 tracking-wide">Explore</h4>
            <ul className="space-y-4 text-sm text-amber-100/70">
              <li><Link href="/menu" className="hover:text-amber-400 transition-colors">Our Menu</Link></li>
              <li><Link href="/about" className="hover:text-amber-400 transition-colors">Our Story</Link></li>
              <li><Link href="/sourcing" className="hover:text-amber-400 transition-colors">Ingredients Sourcing</Link></li>
              <li><Link href="/chef" className="hover:text-amber-400 transition-colors">Chef Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-playfair font-bold text-amber-50 text-lg mb-6 tracking-wide">Support</h4>
            <ul className="space-y-4 text-sm text-amber-100/70">
              <li><Link href="/faq" className="hover:text-amber-400 transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-amber-400 transition-colors">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="hover:text-amber-400 transition-colors">Returns Policy</Link></li>
              <li><Link href="/requests" className="hover:text-amber-400 transition-colors">Custom Meal Requests</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-playfair font-bold text-amber-50 text-lg mb-6 tracking-wide">Contact</h4>
            <ul className="space-y-4 text-sm text-amber-100/70">
              <li className="flex items-start">
                <FiMail className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                <span>rp111monster@gmail.com</span>
              </li>
              <li className="flex items-start">
                <FiPhone className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
                <span>+91 9340623657</span>
              </li>
            </ul>
            <div className="mt-6">
              <h5 className="text-xs uppercase tracking-wider text-amber-500 font-bold mb-3">Newsletter</h5>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-amber-900/30 border border-amber-800 text-amber-50 text-sm rounded-l-md px-4 py-2 w-full focus:outline-none focus:border-amber-500"
                />
                <button 
                  type="submit"
                  className="bg-amber-500 text-amber-950 font-bold px-4 py-2 rounded-r-md hover:bg-amber-400 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-amber-900/50 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-amber-100/50 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} HOMEMADE Protein. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-amber-100/50">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
