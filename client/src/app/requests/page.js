'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CustomRequestsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [description, setDescription] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/requests');
      return;
    }

    if (isAuthenticated) {
      fetchRequests();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests/my-requests');
      setRequests(res.data.data.requests);
    } catch (err) {
      console.error('Failed to fetch requests', err);
      toast.error('Could not load your custom requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/requests', {
        description,
        targetCalories: targetCalories ? parseInt(targetCalories) : undefined,
        targetProtein: targetProtein ? parseInt(targetProtein) : undefined,
        dietaryPreference
      });
      toast.success('Custom request submitted successfully!');
      setRequests([res.data.data.request, ...requests]);
      
      // Reset form
      setDescription('');
      setTargetCalories('');
      setTargetProtein('');
      setDietaryPreference('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-500 text-amber-950';
      case 'reviewed': return 'bg-blue-500 text-white';
      case 'accepted': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'completed': return 'bg-purple-500 text-white';
      default: return 'bg-amber-900 border border-amber-800 text-amber-100';
    }
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-4">
          Custom <span className="text-amber-500 italic">Meal Requests</span>
        </h1>
        <p className="text-amber-100/70 text-lg">
          Need a specific macro profile or simply craving something off-menu? Let our chefs craft exactly what your body needs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Request Form */}
        <div className="bg-amber-950/40 border border-amber-900/50 rounded-3xl p-8 shadow-2xl backdrop-blur relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6">Submit a New Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
             <div>
                <label className="block text-amber-100/80 text-sm font-medium mb-2">Describe what you want *</label>
                <textarea
                  required
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                  placeholder="E.g., I'd like a grilled salmon salad but with extra protein and no dairy dressing..."
                />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-amber-100/80 text-sm font-medium mb-2">Target Calories (optional)</label>
                  <input
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(e.target.value)}
                    className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="block text-amber-100/80 text-sm font-medium mb-2">Target Protein in grams (optional)</label>
                  <input
                    type="number"
                    value={targetProtein}
                    onChange={(e) => setTargetProtein(e.target.value)}
                    className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                    placeholder="e.g. 50"
                  />
                </div>
             </div>
             
             <div>
                <label className="block text-amber-100/80 text-sm font-medium mb-2">Dietary Preference</label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full bg-amber-950 border border-amber-900 rounded-xl p-4 text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                >
                  <option value="">Any</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="non-vegetarian">Non-Vegetarian</option>
                </select>
             </div>
             
             <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 text-amber-950 font-bold py-4 rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
             >
                {submitting ? 'Submitting...' : 'Send Request to Chef'}
             </button>
          </form>
        </div>

        {/* Past Requests List */}
        <div>
           <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 px-4 border-b border-amber-900/50 pb-4">
             Your Past Requests
           </h2>

           {requests.length === 0 ? (
             <div className="text-center py-16 bg-amber-950/20 rounded-3xl border border-dashed border-amber-900/50">
                <p className="text-amber-100/50">You haven't made any custom requests yet.</p>
             </div>
           ) : (
             <div className="space-y-6">
                {requests.map((req) => (
                  <div key={req._id} className="bg-amber-950/40 border border-amber-900/40 rounded-2xl p-6 backdrop-blur transition-all hover:bg-amber-950/60">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                         <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getStatusColor(req.status)}`}>
                           {req.status}
                         </span>
                         {req.dietaryPreference && (
                           <span className="text-xs border border-amber-900 text-amber-100/70 px-3 py-1 rounded-full capitalize">
                             {req.dietaryPreference}
                           </span>
                         )}
                      </div>
                      <span className="text-amber-100/40 text-xs">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-amber-50 mb-4 bg-amber-900/20 p-4 rounded-xl border border-amber-900/50 border-l-2 border-l-amber-500">
                      "{req.description}"
                    </p>
                    
                    <div className="flex gap-4 text-sm text-amber-100/60 mb-4">
                      {req.targetCalories && <span>🎯 {req.targetCalories} kcal</span>}
                      {req.targetProtein && <span>💪 {req.targetProtein}g protein</span>}
                    </div>

                    {/* Chef Response Area */}
                    {(req.chefResponse || req.proposedPrice) && (
                      <div className="mt-4 pt-4 border-t border-amber-900/50 bg-amber-900/30 p-4 rounded-xl border-dashed">
                        <div className="flex items-center gap-2 mb-2 text-amber-400 font-playfair text-lg">
                           <span>👨‍🍳 Chef's Response</span>
                        </div>
                        {req.chefResponse && <p className="text-amber-50 text-sm mb-3 italic">"{req.chefResponse}"</p>}
                        
                        <div className="flex items-center justify-between text-sm">
                           {req.estimatedTime && <span className="text-amber-100/70">Est. Time: {req.estimatedTime}</span>}
                           {req.proposedPrice && <span className="font-bold text-amber-400 text-lg">Price: ₹{req.proposedPrice}</span>}
                        </div>
                        
                        {req.status === 'reviewed' && (
                          <div className="mt-4 flex gap-3">
                             {/* Customer needs to accept or reject */}
                             {/* API logic for these actions would go here, omitting for simplicity/length */}
                             <button className="bg-amber-500 text-amber-950 px-4 py-2 rounded-lg font-bold hover:bg-amber-400 text-sm">
                               Accept & Pay
                             </button>
                             <button className="border border-amber-900 text-amber-100/70 px-4 py-2 rounded-lg hover:bg-amber-950 hover:text-red-400 text-sm">
                               Decline
                             </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
