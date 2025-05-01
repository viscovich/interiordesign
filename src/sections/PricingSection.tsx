import React from 'react';
import ErrorModal from '../components/ErrorModal';

interface PricingSectionProps {
  user?: {
    user_profile?: {
      stripe_sandbox_access?: boolean;
    };
  };
  onRegisterClick?: () => void;
}

export default function PricingSection({ user, onRegisterClick }: PricingSectionProps) {
  const [showModal, setShowModal] = React.useState(false);

  const showComingSoonModal = () => {
    setShowModal(true);
  };
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Plans and Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that best suits your needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold mb-4">💎 Free</h3>
            <div className="text-4xl font-bold mb-6">
              $0<span className="text-xl font-normal">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Access to the Standard model
              </li>
              <li className="flex items-center">
                <i className="fas fa-times text-gray-400 mr-2"></i>
                Advanced model not available
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                50 credits
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Standard generation: 5 credits/image
              </li>
              <li className="flex items-center">
              <i className="fas fa-times text-gray-400 mr-2"></i>
                You can't Include your objects into the rendering
              </li>
            </ul>
            <button 
              onClick={onRegisterClick}
              className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition"
            >
              Get Started
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-custom relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-custom text-white px-4 py-1 rounded-full text-sm">
              Most popular
            </div>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm mt-6">
              Coming Soon
            </div>
            <h3 className="text-2xl font-bold mb-4">🟦 Pro</h3>
            <div className="text-4xl font-bold mb-6">
              $19<span className="text-xl font-normal">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Full access to Standard + Advanced models
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                250 credits/month
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Standard: 5 credits/image
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Advanced: 15 credits/image
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Include your objects into the rendering
              </li>
            </ul>
            <button 
              className="!rounded-button w-full py-3 bg-gray-300 text-white cursor-not-allowed"
              disabled={!user?.user_profile?.stripe_sandbox_access}
              onClick={() => !user?.user_profile?.stripe_sandbox_access && showComingSoonModal()}
            >
              {user?.user_profile?.stripe_sandbox_access ? 'Upgrade Now' : 'Coming Soon'}
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm">
              Coming Soon
            </div>
            <h3 className="text-2xl font-bold mb-4">🟥 Enterprise</h3>
            <div className="text-4xl font-bold mb-6">
              $49<span className="text-xl font-normal">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Full access to Standard + Advanced models
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                1200 credits/month
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Standard: 5 credits/image
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Advanced: 15 credits/image
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-custom mr-2"></i>
                Include your objects into the rendering
              </li>
            </ul>
            <button 
              className="!rounded-button w-full py-3 bg-gray-300 text-white cursor-not-allowed"
              disabled={!user?.user_profile?.stripe_sandbox_access}
              onClick={() => !user?.user_profile?.stripe_sandbox_access && showComingSoonModal()}
            >
              {user?.user_profile?.stripe_sandbox_access ? 'Upgrade Now' : 'Coming Soon'}
            </button>
          </div>
        </div>
      </div>
      <ErrorModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Feature Coming Soon"
        message="This feature will be available soon. Selected users will get early access."
      />
    </section>
  );
}
