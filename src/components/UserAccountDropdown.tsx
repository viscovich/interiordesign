import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { getUserProfile } from '../lib/userService';
import { startCheckout, createBillingPortal, getSubscription } from '../lib/stripe';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  updated_at: string;
  stripe_customer_id?: string;
  subscription_status?: string;
  current_plan?: string;
  stripe_sandbox_access?: boolean;
}

export function UserAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { user, signOut } = useAuth(); // Destructure signOut here

  const [loading, setLoading] = useState({
    billing: false,
    upgrade: false
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          const [profile, subscription] = await Promise.all([
            getUserProfile(user.id),
            getSubscription(user.id)
          ]);
          setUserProfile({
            ...profile,
            ...subscription
          });
        } catch (error) {
          toast.error('Failed to load user data');
        }
      }
    };
    fetchData();
  }, [user]);

  const handleBillingPortal = async () => {
    if (!userProfile?.stripe_customer_id) {
      toast.error('No Stripe customer account found');
      return;
    }
    
    setLoading(prev => ({...prev, billing: true}));
    try {
      const { url } = await createBillingPortal(userProfile.stripe_customer_id);
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open billing portal: ' + (
        error instanceof Error ? error.message : 'Please try again later'
      ));
    } finally {
      setLoading(prev => ({...prev, billing: false}));
    }
  };

  const handleUpgrade = async () => {
    setLoading(prev => ({...prev, upgrade: true}));
    try {
      const { sessionId } = await startCheckout('price_1RCGMcHqqEp5PbqKlqBheNM9'); // Correct Test Price ID
      const stripeModule = await import('@stripe/stripe-js');
      const stripe = await stripeModule.loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      if (!stripe) throw new Error('Failed to load Stripe');
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(prev => ({...prev, upgrade: false}));
    }
  };

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : 'US';
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {userProfile?.email ? getInitials(userProfile.email) : 'US'}
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            {/* Account Info Section */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">👤 Account Info</h3>
              <p className="mt-1 text-sm text-gray-500 truncate">{userProfile?.email || 'No email'}</p>
            </div>

            {/* Usage Section */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">📊 Credits</h3>
              <div className="mt-1">
                <p className="text-sm text-gray-500">Available: {userProfile?.credits || 0}</p>
                {/* Progress bar removed */}
              </div>
            </div>

            {/* Actions Section */}
            <div className="px-4 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-900">⚙️ Actions</h3>
              <div className="mt-1 space-y-1">
                {/* Plan and Status buttons removed */}
                <button 
                  onClick={handleUpgrade}
                  disabled={loading.upgrade || userProfile?.stripe_sandbox_access !== true}
                  className={`block w-full text-left px-2 py-1 text-sm font-medium text-red-600 hover:bg-gray-100 rounded ${(loading.upgrade || userProfile?.stripe_sandbox_access !== true) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading.upgrade ? 'Processing...' : 'Upgrade Plan'}
                </button>
              </div>
            </div>

            {/* Account Settings Section */}
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-gray-900">💳 Subscription</h3>
              <div className="mt-1 space-y-1">
                {/* Manage Profile button removed */}
                <button
                  onClick={handleBillingPortal}
                  disabled={!userProfile?.stripe_customer_id || loading.billing}
                  className={`block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded ${!userProfile?.stripe_customer_id || loading.billing ? 'opacity-50 cursor-not-allowed' : ''}`} // Added disabled styling
                >
                  {loading.billing ? 'Loading...' : 'Subscription & Billing'}
                </button>
                {/* <button className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded">
                  Credit Usage // Commented out as it might be redundant with the usage section
                </button> */}
                <button
                  onClick={() => {
                    // const { signOut } = useAuth(); // Remove this incorrect call
                    signOut();
                    setIsOpen(false); // Close dropdown on sign out
                  }}
                  className="block w-full text-left px-2 py-1 text-sm text-red-600 hover:bg-gray-100 rounded" // Sign out in red
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
