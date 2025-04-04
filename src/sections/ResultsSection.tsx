import React from 'react';
import { ImageComparison } from '../components/ImageComparison';

interface ResultsSectionProps {
  originalImage: string;
  generatedImage: string;
  onNewDesign: () => void;
}

export default function ResultsSection({
  originalImage,
  generatedImage,
  onNewDesign
}: ResultsSectionProps) {
  return (
    <section id="results-section" className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Your Transformed Space</h2>
          <p className="text-xl text-gray-600">See the before and after comparison</p>
        </div>
        <ImageComparison
          originalImage={originalImage}
          generatedImage={generatedImage}
        />

        <div className="text-center mt-12">
          <button
            onClick={onNewDesign}
            className="!rounded-button px-8 py-4 bg-custom text-white hover:bg-custom/90 transition"
          >
            Start New Design
          </button>
        </div>
      </div>
    </section>
  );
}
