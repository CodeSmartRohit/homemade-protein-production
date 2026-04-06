'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiBell } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import CartSidebar from '@/components/CartSidebar';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, isChef, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && !isAdmin && !isChef) {
      api.get('/notifications')
        .then(res => {
          const unread = res.data.data.notifications.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        })
        .catch(err => console.error('Failed to fetch notifications', err));
    }
  }, [isAuthenticated, isAdmin, isChef]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Menu', href: '/menu' },
  ];

  if (isAuthenticated && !isChef && !isAdmin) {
    navLinks.push({ name: 'Orders', href: '/orders' });
    navLinks.push({ name: 'Requests', href: '/requests' });
  }

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-black border-b border-white/10 py-3 shadow-lg'
            : 'bg-black/80 py-5'
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 border border-amber-500/30 group-hover:scale-110 transition-transform duration-300">
               <img 
                 src="/logo.png" 
                 alt="HOMEMADE Protein Logo" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-playfair text-xl md:text-2xl font-bold tracking-wider text-amber-50 group-hover:text-amber-400 transition-colors">
                HOMEMADE
              </span>
              <span className="text-[10px] tracking-widest uppercase text-amber-500 font-semibold">
                Protein
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm tracking-wide transition-colors hover:text-amber-400 ${
                  pathname === link.href ? 'text-amber-400 font-medium' : 'text-amber-100/80'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {(isChef || isAdmin) && (
              <Link 
                href={isAdmin ? "/admin" : "/chef"} 
                className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/50 text-amber-500 text-sm font-bold hover:bg-amber-500 hover:text-amber-950 transition-all"
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-5">
            {/* Cart Icon */}
            {(!isChef && !isAdmin) && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-amber-100 hover:text-amber-400 transition-colors"
            >
              <FiShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-bold h-4 w-4 rounded-full flex justify-center items-center">
                  {itemCount}
                </span>
              )}
            </button>
            )}

            {/* Notifications Icon (for customers) */}
            {(isAuthenticated && !isChef && !isAdmin) && (
              <Link
                href="/notifications"
                className="relative p-2 text-amber-100 hover:text-amber-400 transition-colors"
                title="View Messages from Admin"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex justify-center items-center ring-2 ring-black">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth/Profile */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-sm text-amber-100 hover:text-amber-400">
                    <FiUser className="w-5 h-5" />
                    <span>{user?.name?.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-amber-900 border border-amber-800 rounded-lg shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-amber-100 hover:bg-amber-800">
                      Profile
                    </Link>
                    {(!isAdmin && !isChef) && (
                      <Link href="/notifications" className="block px-4 py-2 text-sm text-amber-100 hover:bg-amber-800">
                        Admin Messages
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left block px-4 py-2 text-sm text-amber-100 hover:bg-amber-800"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-medium text-amber-100 hover:text-amber-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-5 py-2 text-sm font-bold bg-amber-500 text-amber-950 rounded-full hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                  >
                    Join Now
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden text-amber-100 hover:text-amber-400 p-1"
              onClick={() => setMobileMenuOpen(true)}
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 max-w-sm bg-black border-r border-white/10 h-full p-6 shadow-2xl flex flex-col">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 text-amber-100/50 hover:text-amber-400"
            >
              <FiX className="w-6 h-6" />
            </button>
            <div className="mt-8 flex flex-col space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-medium ${
                    pathname === link.href ? 'text-amber-400' : 'text-amber-100'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {(isChef || isAdmin) && (
                <Link 
                  href={isAdmin ? "/admin" : "/chef"} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="text-lg font-bold text-amber-500 bg-amber-950/50 px-4 py-2 rounded-xl border border-amber-900"
                >
                  Dashboard
                </Link>
              )}

              <hr className="border-amber-900" />
              
              {isAuthenticated ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-amber-100">Profile</Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-lg font-medium text-amber-500">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-5 py-3 text-center text-sm font-bold border border-amber-900 text-amber-100 rounded-full"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-5 py-3 text-center text-sm font-bold bg-amber-500 text-amber-950 rounded-full"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
