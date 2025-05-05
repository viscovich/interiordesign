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
          {/* Added relative positioning and play button overlay */}
          <div className="relative"> 
            <a data-fancybox href="/video/dreamcasa2.mp4" className="block relative group"> {/* Added block, relative, group */}
              <img 
                src="/images/poster.jpg" 
                alt="Watch the DreamCasa AI video" 
                style={{ borderRadius: '12px', maxWidth: '100%' }} // Removed cursor style here
                className="rounded-lg shadow-lg block" // Added block
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"> {/* Added overlay div */}
                <i className="fas fa-play text-white text-6xl"></i> {/* Font Awesome play icon */}
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
