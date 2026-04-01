'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { ...dataToSend } = formData;
      delete dataToSend.confirmPassword;
      await register(dataToSend);
      toast.success('Account created successfully');
      router.push(redirect);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative py-16">
      <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-amber-950/60 border border-amber-900/50 rounded-3xl p-8 md:p-10 backdrop-blur-md shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group mb-6">
            <span className="font-playfair text-3xl font-bold tracking-wider text-amber-50 group-hover:text-amber-400">HOMEMADE</span>
            <span className="block text-xs font-bold tracking-widest uppercase text-amber-500 mt-1">Protein</span>
          </Link>
          <h2 className="text-2xl font-playfair font-bold text-amber-50">Create an Account</h2>
          <p className="text-amber-100/60 text-sm mt-2">Join us for fresh, healthy meals cooked to perfection.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-amber-100/80 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                placeholder="John Doe"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-amber-100/80 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                placeholder="you@example.com"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-amber-100/80 text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-amber-100/80 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-amber-100/80 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-amber-950 font-bold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            {loading ? <span className="animate-pulse">Creating account...</span> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-amber-100/60 text-sm">
          By signing up, you agree to our{' '}
          <a href="#" className="text-amber-500 hover:text-amber-400 hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-amber-500 hover:text-amber-400 hover:underline">Privacy Policy</a>.
        </div>

        <div className="mt-8 text-center border-t border-amber-900/50 pt-8">
          <p className="text-amber-100/60 text-sm">
            Already have an account?{' '}
            <Link href={`/auth/login${redirect ? `?redirect=${redirect}` : ''}`} className="text-amber-500 font-bold hover:underline transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-amber-500">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
