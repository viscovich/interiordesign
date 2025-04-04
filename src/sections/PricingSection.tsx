import React from 'react';

export default function PricingSection() {
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
                <i className="fas fa-check text-custom mr-2"></i>
                Image Resolution: 1024x720 pixel
              </li>
            </ul>
            <button className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition">
              Get Started
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-custom relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-custom text-white px-4 py-1 rounded-full text-sm">
              Most popular
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
                High-resolution images
              </li>
            </ul>
            <button className="!rounded-button w-full py-3 bg-custom text-white hover:bg-custom/90 transition">
              Upgrade Now
            </button>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
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
                High-resolution images
              </li>
            </ul>
            <button className="!rounded-button w-full py-3 bg-custom text-white hover:bg-custom/90 transition">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
