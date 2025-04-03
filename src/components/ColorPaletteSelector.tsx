import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export interface ColorPalette {
  id: string;
  name: string;
  image: string;
}

const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'cool',
    name: 'Cool',
    image: '/images/tones/Cool.png'
  },
  {
    id: 'dark',
    name: 'Dark',
    image: '/images/tones/Dark.png'
  },
  {
    id: 'neutrals',
    name: 'Neutrals',
    image: '/images/tones/Neutrals.png'
  },
  {
    id: 'pastel',
    name: 'Pastel',
    image: '/images/tones/Pastel.png'
  },
  {
    id: 'warm',
    name: 'Warm',
    image: '/images/tones/Warm.png'
  }
];

interface ColorPaletteSelectorProps {
  onPaletteSelect: (palette: ColorPalette) => void;
  selectedPaletteId?: string;
}

export function ColorPaletteSelector({ onPaletteSelect, selectedPaletteId }: ColorPaletteSelectorProps) {
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600">Color Tone</h3>
      <div className="room-type-slider-container">
      <Slider {...sliderSettings}>
        {COLOR_PALETTES.map((palette) => (
          <div key={palette.id} className="px-2">
            <div
              className={`
                rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                ${selectedPaletteId === palette.id
                  ? 'border-blue-500 shadow-md scale-105'
                  : 'border-transparent hover:border-blue-300'
                }
              `}
              onClick={() => onPaletteSelect(palette)}
            >
              <div className="aspect-video relative">
                <img
                  src={palette.image}
                  alt={palette.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-center">
                <p className="font-semibold text-base">{palette.name}</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
      </div>
    </div>
  );
}
