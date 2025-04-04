import React from 'react';

interface HeroSectionProps {
  onScrollToDesign: () => void;
  onScrollToFeatures: () => void;
}

export default function HeroSection({
  onScrollToDesign,
  onScrollToFeatures
}: HeroSectionProps) {
  return (
    <section className="relative bg-gray-50 py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6">DreamCasa AI: Transform Your Space with AI</h1>
            <p className="text-xl text-gray-600 mb-8">
              Upload a photo or a full floor plan and let AI redesign your selected room in your preferred style.
              Get stunning, professional results in seconds.
            </p>
            <div className="flex gap-4">
              <button
                onClick={onScrollToDesign}
                className="!rounded-button px-8 py-4 bg-custom text-white hover:bg-custom/90 transition flex items-center"
              >
                <i className="fas fa-upload mr-2"></i>
                Upload a photo
              </button>
              <button
                onClick={onScrollToFeatures}
                className="!rounded-button px-8 py-4 border border-custom text-custom hover:bg-custom hover:text-white transition"
              >
                Learn more
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="/images/before_after.jpg"
              alt="DreamCasa AI Transform"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
