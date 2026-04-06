'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiLock, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, updateProfile, updatePassword, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('details');

  // Details State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Address State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressData, setAddressData] = useState({ label: 'Home', street: '', city: '', state: '', pincode: '', lat: null, lng: null });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
      return;
    }
    
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setUpdatingDetails(true);
    try {
      await updateProfile({ name, phone });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
       setUpdatingDetails(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully. Please login again.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    // Quick frontend mockup for adding address, backend needs an endpoint for array push, 
    // or just pass the full addresses array to `updateProfile`.
    setUpdatingDetails(true);
    try {
      const newAddresses = [...(user.addresses || []), addressData];
      await updateProfile({ addresses: newAddresses });
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setAddressData({ label: 'Home', street: '', city: '', state: '', pincode: '', lat: null, lng: null });
    } catch (err) {
      toast.error('Failed to add address');
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleDeleteAddress = async (index) => {
     if(!window.confirm('Delete this address?')) return;
     const newAddresses = user.addresses.filter((_, i) => i !== index);
     try {
       await updateProfile({ addresses: newAddresses });
       toast.success('Address removed');
     } catch(err) {
       toast.error('Failed to remove address');
     }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Detecting location...', { id: 'location' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddressData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
          toast.success('Location detected successfully!', { id: 'location' });
        },
        (error) => {
          toast.error('Failed to detect location. Please check browser permissions.', { id: 'location' });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-amber-50 mb-2">My Profile</h1>
          <p className="text-amber-100/60 max-w-xl">Manage your account details, delivery addresses, and security settings.</p>
        </div>
        <div className="hidden md:block">
           <div className="bg-amber-950/50 border border-amber-900 rounded-full px-4 py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-amber-950 flex items-center justify-center font-bold text-lg font-playfair">
                 {user.name?.charAt(0) || 'U'}
              </div>
              <div className="text-sm">
                 <div className="font-bold text-amber-50">{user.name}</div>
                 <div className="text-amber-100/50">{user.email}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-4 md:p-6 backdrop-blur sticky top-24 shadow-xl">
             <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-left font-medium ${
                    activeTab === 'details' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-amber-100/70 hover:bg-amber-900/30 hover:text-amber-400'
                  }`}
                >
                  <FiUser className="w-5 h-5" /> Account Details
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-left font-medium ${
                    activeTab === 'addresses' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-amber-100/70 hover:bg-amber-900/30 hover:text-amber-400'
                  }`}
                >
                  <FiMapPin className="w-5 h-5" /> Saved Addresses
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-left font-medium ${
                    activeTab === 'security' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'text-amber-100/70 hover:bg-amber-900/30 hover:text-amber-400'
                  }`}
                >
                  <FiLock className="w-5 h-5" /> Security
                </button>
                
                <hr className="border-amber-900 my-4" />
                
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 rounded-xl text-left font-bold text-red-500 hover:bg-red-900/10 transition-colors"
                >
                  Sign Out
                </button>
             </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-amber-950/40 border border-amber-900/50 rounded-2xl p-6 md:p-10 backdrop-blur shadow-2xl relative overflow-hidden min-h-[500px]">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>

             {/* Tab 1: Details */}
             {activeTab === 'details' && (
               <div className="animate-fade-in relative z-10">
                 <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">Personal Information</h2>
                 <form onSubmit={handleUpdateDetails} className="space-y-6 max-w-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-amber-100/80 text-sm font-medium mb-2">Email Address (Read-only)</label>
                        <input
                          type="email"
                          disabled
                          value={user.email}
                          className="w-full bg-amber-900/20 border border-amber-900/50 rounded-xl p-4 text-amber-100/50 font-sans cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-amber-100/80 text-sm font-medium mb-2">Role</label>
                        <input
                          type="text"
                          disabled
                          value={user.role.toUpperCase()}
                          className="w-full bg-amber-900/20 border border-amber-900/50 rounded-xl p-4 text-amber-500 font-bold font-sans cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-amber-100/80 text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-amber-950/80 border border-amber-800 rounded-xl p-4 text-amber-50 focus:outline-none focus:border-amber-500 font-sans transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-amber-100/80 text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-amber-950/80 border border-amber-800 rounded-xl p-4 text-amber-50 focus:outline-none focus:border-amber-500 font-sans transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updatingDetails}
                      className="bg-amber-500 text-amber-950 font-bold px-8 py-3 rounded-full hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20 mt-4"
                    >
                      {updatingDetails ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                 </form>
               </div>
             )}

             {/* Tab 2: Addresses */}
             {activeTab === 'addresses' && (
               <div className="animate-fade-in relative z-10">
                 <div className="flex justify-between items-center mb-6 border-b border-amber-900/50 pb-4">
                    <h2 className="text-2xl font-playfair font-bold text-amber-50">Saved Addresses</h2>
                    {!showAddressForm && (
                      <button 
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-1 text-sm font-bold text-amber-500 hover:text-amber-400 bg-amber-950/50 px-4 py-2 border border-amber-900 rounded-full transition-colors"
                      >
                         <FiPlus /> Add New
                      </button>
                    )}
                 </div>

                 {showAddressForm ? (
                    <form onSubmit={handleAddAddress} className="bg-amber-900/20 p-6 rounded-2xl border border-amber-900/50 space-y-4 mb-8">
                       <h3 className="text-amber-50 font-bold mb-4">Add Delivery Address</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2">
                           <label className="block text-amber-100/70 text-xs mb-1">Address Label</label>
                           <select 
                             value={addressData.label} 
                             onChange={(e) => setAddressData({...addressData, label: e.target.value})}
                             className="w-full bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-50 focus:border-amber-500"
                           >
                             <option value="Home">Home</option>
                             <option value="Work">Work</option>
                             <option value="Other">Other</option>
                           </select>
                         </div>
                         <div className="md:col-span-2">
                           <label className="block text-amber-100/70 text-xs mb-1">Street Address</label>
                           <input type="text" required value={addressData.street} onChange={(e) => setAddressData({...addressData, street: e.target.value})} className="w-full bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-50 focus:border-amber-500" placeholder="123 Example St, Apt 4" />
                         </div>
                         <div>
                           <label className="block text-amber-100/70 text-xs mb-1">City</label>
                           <input type="text" required value={addressData.city} onChange={(e) => setAddressData({...addressData, city: e.target.value})} className="w-full bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-50 focus:border-amber-500" placeholder="New York" />
                         </div>
                         <div>
                           <label className="block text-amber-100/70 text-xs mb-1">State & ZIP</label>
                           <div className="flex gap-2">
                             <input type="text" required value={addressData.state} onChange={(e) => setAddressData({...addressData, state: e.target.value})} className="w-1/2 bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-50 focus:border-amber-500" placeholder="NY" />
                             <input type="text" required value={addressData.pincode} onChange={(e) => setAddressData({...addressData, pincode: e.target.value})} className="w-1/2 bg-amber-950 border border-amber-800 rounded-lg p-3 text-amber-50 focus:border-amber-500" placeholder="10001" />
                           </div>
                         </div>
                         <div className="md:col-span-2 mt-2">
                           <button type="button" onClick={handleDetectLocation} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-900/30 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-900/50 transition-colors">
                             <FiMapPin /> {addressData.lat && addressData.lng ? `Location Detected (${addressData.lat.toFixed(4)}, ${addressData.lng.toFixed(4)}) - Click to update` : 'Detect Current GPS Location'}
                           </button>
                         </div>
                       </div>
                       
                       <div className="flex gap-3 mt-6 pt-4 border-t border-amber-900/50">
                         <button type="button" onClick={() => setShowAddressForm(false)} className="px-6 py-2 border border-amber-900 text-amber-100 rounded-lg hover:bg-amber-950 transition-colors">Cancel</button>
                         <button type="submit" className="px-6 py-2 bg-amber-500 text-amber-950 font-bold rounded-lg hover:bg-amber-400 transition-colors">Save Address</button>
                       </div>
                    </form>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {user.addresses?.length > 0 ? (
                        user.addresses.map((addr, idx) => (
                           <div key={idx} className="bg-amber-900/10 border border-amber-800/50 rounded-2xl p-6 relative group">
                              <div className="flex justify-between items-start mb-3">
                                 <span className="font-bold text-amber-50 border-b border-amber-500/50 pb-0.5 inline-block">{addr.label || addr.type || 'Address'}</span>
                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button className="text-amber-500 hover:text-amber-400 p-1"><FiEdit2 /></button>
                                   <button onClick={() => handleDeleteAddress(idx)} className="text-red-500 hover:text-red-400 p-1"><FiTrash2 /></button>
                                 </div>
                              </div>
                              <p className="text-amber-100/70 text-sm leading-relaxed mb-1">{addr.street}</p>
                              <p className="text-amber-100/70 text-sm leading-relaxed">{addr.city}, {addr.state} {addr.pincode || addr.zipCode}</p>
                           </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-10 border border-dashed border-amber-900/50 rounded-2xl">
                          <p className="text-amber-100/50">No saved addresses yet.</p>
                        </div>
                      )}
                    </div>
                 )}
               </div>
             )}

             {/* Tab 3: Security */}
             {activeTab === 'security' && (
               <div className="animate-fade-in relative z-10 w-full max-w-xl">
                 <h2 className="text-2xl font-playfair font-bold text-amber-50 mb-6 border-b border-amber-900/50 pb-4">Update Password</h2>
                 <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                      <label className="block text-amber-100/80 text-sm font-medium mb-2">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-amber-950/80 border border-amber-800 rounded-xl p-4 text-amber-50 focus:outline-none focus:border-amber-500 font-sans transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-amber-100/80 text-sm font-medium mb-2">New Password (Min 6 chars)</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-amber-950/80 border border-amber-800 rounded-xl p-4 text-amber-50 focus:outline-none focus:border-amber-500 font-sans transition-colors"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-900/50">
                       <p className="text-xs text-amber-100/50 italic flex items-start gap-2">
                         <FiLock className="mt-0.5 text-amber-500 flex-shrink-0" />
                         <span>For your security, updating your password will automatically log you out across all devices. You will need to sign in again.</span>
                       </p>
                    </div>

                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="bg-amber-500 text-amber-950 font-bold px-8 py-3 rounded-full hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-lg shadow-amber-500/20 mt-4"
                    >
                      {updatingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                 </form>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
