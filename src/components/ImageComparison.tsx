import React from 'react';
import {
  ReactCompareSlider,
  ReactCompareSliderImage
} from 'react-compare-slider';

interface ImageComparisonProps {
  originalImage: string;
  generatedImage: string;
  className?: string;
}

export function ImageComparison({ originalImage, generatedImage, className }: ImageComparisonProps) {
  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={originalImage} alt="Original room" />}
        itemTwo={<ReactCompareSliderImage src={generatedImage} alt="Generated design" />}
        position={50}
        className={`h-[600px] ${className || ''}`}
      />
    </div>
  );
}
