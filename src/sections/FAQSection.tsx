import React from 'react';

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600">Find answers to your questions</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">How does the transformation process work?</h3>
              <p className="text-gray-600">
                Upload a photo of your room or floor plan, select the desired style, and let the AI do the rest. 
                You'll receive the result in seconds. You may also integrate uploaded objects into your scenes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">What type of photos can I upload?</h3>
              <p className="text-gray-600">
                We accept photos in JPG and PNG format. For best results, use well-lit, high-resolution images.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Can I edit the result?</h3>
              <p className="text-gray-600">
                Yes, you can generate multiple variants and further customize the design according to your preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
