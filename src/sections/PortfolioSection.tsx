import React from 'react';
import { ImageComparison } from '../components/ImageComparison';

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Results</h2>
          <p className="text-xl text-gray-600">See some of our transformations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-lg overflow-hidden h-64 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageComparison
                originalImage="/images/Salotto_vecchio.png"
                generatedImage="/images/Salotto_nuovo.png"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="rounded-lg overflow-hidden h-64 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageComparison
                originalImage="/images/planimetria-casa.jpg"
                generatedImage="/images/bedroom-design-example.jpg"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div className="rounded-lg overflow-hidden h-64 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageComparison
                originalImage="/images/Cucina_prima.png"
                generatedImage="/images/kitchen-design-example.jpg"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
