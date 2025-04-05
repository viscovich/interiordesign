import React from 'react';
import Slider from 'react-slick'; // Import Slider
import { Tooltip } from 'react-tooltip';
import 'slick-carousel/slick/slick.css'; // Import slick CSS
import 'slick-carousel/slick/slick-theme.css'; // Import slick theme CSS

export interface ColorPalette {
  id: string; // Will be prefixed with 'palette:' e.g., 'palette:cool'
  name: string;
  image: string;
}

export interface SingleColor {
  id: string; // Will be prefixed with 'color:' e.g., 'color:grey'
  name: string;
  hex: string;
}

// Existing palettes, IDs updated
const COLOR_PALETTES: ColorPalette[] = [
  { id: 'palette:cool', name: 'Cool', image: '/images/tones/Cool.png' },
  { id: 'palette:dark', name: 'Dark', image: '/images/tones/Dark.png' },
  { id: 'palette:neutrals', name: 'Neutrals', image: '/images/tones/Neutrals.png' },
  { id: 'palette:pastel', name: 'Pastel', image: '/images/tones/Pastel.png' },
  { id: 'palette:warm', name: 'Warm', image: '/images/tones/Warm.png' }
];

// Default single colors + added ones
const SINGLE_COLORS: SingleColor[] = [
  { id: 'color:grey', name: 'Grey', hex: '#808080' },
  { id: 'color:white', name: 'White', hex: '#FFFFFF' },
  { id: 'color:black', name: 'Black', hex: '#000000' },
  { id: 'color:blue', name: 'Blue', hex: '#0000FF' },
  { id: 'color:green', name: 'Green', hex: '#008000' },
  { id: 'color:red', name: 'Red', hex: '#FF0000' },
  { id: 'color:yellow', name: 'Yellow', hex: '#FFFF00' },
  { id: 'color:orange', name: 'Orange', hex: '#FFA500' },
  { id: 'color:purple', name: 'Purple', hex: '#800080' },
  { id: 'color:pink', name: 'Pink', hex: '#FFC0CB' },
  { id: 'color:brown', name: 'Brown', hex: '#A52A2A' },
  { id: 'color:cyan', name: 'Cyan', hex: '#00FFFF' },
];

// Combine palettes and colors for the slider
const ALL_TONES = [...COLOR_PALETTES, ...SINGLE_COLORS];

interface ColorToneSelectorProps {
  onSelect: (value: string) => void; // Passes the full ID e.g., 'palette:cool' or 'color:grey'
  selectedValue?: string;
}

export function ColorToneSelector({ onSelect, selectedValue }: ColorToneSelectorProps) {
  const sliderSettings = {
    dots: false,
    infinite: false, // Don't loop infinitely
    speed: 500,
    slidesToShow: 8, // Show more items
    slidesToScroll: 3, // Scroll multiple items
    responsive: [
      {
        breakpoint: 1024, // Large screens
        settings: {
          slidesToShow: 7,
          slidesToScroll: 3
        }
      },
      {
        breakpoint: 768, // Medium screens
        settings: {
          slidesToShow: 6,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 640, // Small screens
        settings: {
          slidesToShow: 5,
          slidesToScroll: 2
        }
      }
    ]
  };

  return (
    <div className="space-y-1"> 
      <h3 className="text-xs font-medium text-gray-600">Color Tone</h3> {/* Removed bottom margin */}
      {/* Use Slider component */}
      <div className="color-tone-slider-container -mx-1">
        <Slider {...sliderSettings}>
          {/* Map Palettes */}
          {COLOR_PALETTES.map((palette) => (
            <div key={palette.id} className="px-1">
              {/* Palette rendering */}
              {/* Removed duplicated div below */}
              <div
                data-tooltip-id="color-tooltip"
                data-tooltip-content={palette.name}
                className={`
                  rounded border-2 p-0.5 cursor-pointer transition-all mx-auto block
                  ${selectedValue === palette.id
                    ? 'border-blue-500 shadow-md scale-105'
                    : 'border-transparent hover:border-blue-300'
                  }
                `}
                onClick={() => onSelect(palette.id)}
                style={{ width: '28px', height: '28px' }} // Consistent size
              >
                <img
                  src={palette.image}
                  alt={palette.name}
                  className="w-full h-full object-cover rounded-sm"
                />
              </div>
            </div>
          ))}

          {/* "or" Separator as a slide item */}
          <div key="separator" className="px-1 flex items-center justify-center h-[28px]">
             <span className="text-xs text-gray-500">or</span>
          </div>

          {/* Map Single Colors */}
          {SINGLE_COLORS.map((color) => (
             <div key={color.id} className="px-1">
               {/* Single color rendering */}
               <div
                 data-tooltip-id="color-tooltip"
                 data-tooltip-content={color.name}
                 className={`
                   rounded border-2 cursor-pointer transition-all mx-auto block
                   ${selectedValue === color.id
                     ? 'border-blue-500 shadow-md scale-105'
                     : 'border-transparent hover:border-blue-300'
                   }
                 `}
                 onClick={() => onSelect(color.id)}
                 style={{ width: '28px', height: '28px', backgroundColor: color.hex }} // Consistent size
               >
                 {/* Border for white swatch */}
                 {color.hex === '#FFFFFF' && <div className="w-full h-full border border-gray-300 rounded-sm"></div>}
               </div>
             </div>
          ))}
       </Slider>
      </div>
      <Tooltip id="color-tooltip" place="bottom" />
    </div>
  );
}
