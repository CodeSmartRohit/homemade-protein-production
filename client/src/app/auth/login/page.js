'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Successfully logged in');
      
      // Redirect based on role or search param
      if (data.user.role === 'chef') {
        router.push('/chef');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirect);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative">
      <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-amber-950/60 border border-amber-900/50 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group mb-6">
            <span className="font-playfair text-3xl font-bold tracking-wider text-amber-50 group-hover:text-amber-400">HOMEMADE</span>
            <span className="block text-xs font-bold tracking-widest uppercase text-amber-500 mt-1">Protein</span>
          </Link>
          <h2 className="text-2xl font-playfair font-bold text-amber-50">Welcome Back</h2>
          <p className="text-amber-100/60 text-sm mt-2">Log in to track your orders and manage your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-amber-100/80 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-amber-100/80 text-sm font-medium">Password</label>
              <a href="#" className="text-amber-500 hover:text-amber-400 text-xs font-medium transition-colors">Forgot password?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-amber-950/40 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-amber-950 font-bold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            {loading ? <span className="animate-pulse">Signing In...</span> : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center bg-amber-900/20 rounded-xl p-4 border border-amber-900/50">
          <p className="text-xs text-amber-100/60 mb-2 font-medium uppercase tracking-widest">Master Credentials</p>
          <div className="text-xs text-amber-100/80 flex flex-col gap-2">
            <div className="justify-between flex px-2 border-b border-amber-900/30 pb-2">
              <span className="opacity-60">Admin:</span>
              <span className="font-mono text-amber-400 font-bold lowercase">rp111monster@gmail.com / <span className="uppercase">ROHITCODESMARTLY!</span></span>
            </div>
            <div className="justify-between flex px-2">
              <span className="opacity-60">Chef:</span>
              <span className="font-mono text-amber-400 font-bold lowercase">chef@gmail.com / 123456</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-amber-100/60 text-sm">
            Don't have an account?{' '}
            <Link href={`/auth/register${redirect ? `?redirect=${redirect}` : ''}`} className="text-amber-500 font-bold hover:underline transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-amber-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
