import React from 'react';
// Removed Slider import
import { Tooltip } from 'react-tooltip';
// Removed slick CSS imports

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
  { id: 'palette:cool', name: 'Cool', image: '/images/tones/optimized/Cool.webp' },
  { id: 'palette:dark', name: 'Dark', image: '/images/tones/optimized/Dark.webp' },
  { id: 'palette:neutrals', name: 'Neutrals', image: '/images/tones/optimized/Neutrals.webp' },
  { id: 'palette:pastel', name: 'Pastel', image: '/images/tones/optimized/Pastel.webp' },
  { id: 'palette:warm', name: 'Warm', image: '/images/tones/optimized/Warm.webp' }
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
  // Removed slider settings

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-gray-600">Color Tone</h3> {/* Removed bottom margin */}
      {/* Replace Slider with Flexbox */}
      <div className="flex flex-wrap gap-1 items-center"> {/* Use flex wrap and small gap */}
          {/* Map Palettes */}
          {COLOR_PALETTES.map((palette) => (
            // Removed outer div wrapper for each item
              <div // Keep this div for tooltip and styling
                key={palette.id} // Added key prop
                data-tooltip-id="color-tooltip"
                data-tooltip-content={palette.name}
                className={`
                  rounded border-2 cursor-pointer transition-all mx-auto block {/* Removed p-0.5 */}
                  ${selectedValue === palette.id
                    ? 'border-blue-500 shadow-md scale-105'
                    : 'border-transparent hover:border-blue-300'
                  }
                `}
                onClick={() => onSelect(palette.id)}
                style={{ width: '32x', height: '32px' }} // Reduced size
              >
<img
  src={palette.image}
  alt={palette.name}
  className="w-full h-full object-cover rounded-sm"
/>

              </div>
            // Removed outer div wrapper
          ))}

          {/* "or" Separator */}
          <div key="separator" className="flex items-center justify-center h-[24px] px-1"> {/* Add slight padding to separator */}
             <span className="text-xs text-gray-500">or</span>
          </div>

          {/* Map Single Colors */}
          {SINGLE_COLORS.map((color) => (
             // Removed outer div wrapper
               <div // Keep this div for tooltip and styling
                 key={color.id} // Added key prop
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
                 style={{ width: '24px', height: '24px', backgroundColor: color.hex }} // Reduced size
               >
                 {/* Border for white swatch */}
                 {color.hex === '#FFFFFF' && <div className="w-full h-full border border-gray-300 rounded-sm"></div>}
               </div>
            // Removed outer div wrapper
          ))}
      </div>
      <Tooltip id="color-tooltip" place="bottom" />
    </div>
  );
}
