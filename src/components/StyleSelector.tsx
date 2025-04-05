import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export interface Style {
  id: string;
  name: string;
  image: string;
  description: string;
  rooms: string[];
}

const STYLES: Style[] = [
  {
    id: 'modern',
    name: 'Modern',
    image: '/images/selectors/styles/modern.jpg',
    description: 'Clean lines, minimal decoration, and functional furniture',
    rooms: ['Living Room', 'Bedroom', 'Office']
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    image: '/images/selectors/styles/scandinavian.jpg',
    description: 'Light colors, natural materials, and cozy textures',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'industrial',
    name: 'Industrial',
    image: '/images/selectors/styles/industrial.jpg',
    description: 'Raw materials, exposed elements, and urban appeal',
    rooms: ['Living Room', 'Office', 'Kitchen']
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    image: '/images/selectors/styles/bohemian.jpg',
    description: 'Eclectic patterns, rich colors, and artistic elements',
    rooms: ['Living Room', 'Bedroom', 'Studio']
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    image: '/images/selectors/styles/minimalist.jpg',
    description: 'Clean lines, monochromatic palette, and clutter-free spaces',
    rooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room']
  },
  {
    id: 'mid-century-modern',
    name: 'Mid-Century Modern',
    image: '/images/selectors/styles/mid-century-modern.jpg',
    description: 'Retro style with organic shapes and functional design',
    rooms: ['Living Room', 'Dining Room', 'Office']
  },
  {
    id: 'traditional',
    name: 'Traditional',
    image: '/images/selectors/styles/traditional.jpg',
    description: 'Classic, timeless design with elegant details and rich colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    image: '/images/selectors/styles/contemporary.jpg',
    description: 'Current, evolving style that borrows from various styles',
    rooms: ['Living Room', 'Bedroom', 'Office', 'Kitchen']
  },
  {
    id: 'rustic',
    name: 'Rustic',
    image: '/images/selectors/styles/rustic.jpg',
    description: 'Natural, aged, and casual style with organic textures',
    rooms: ['Living Room', 'Bedroom', 'Dining Room', 'Kitchen']
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    image: '/images/selectors/styles/art-deco.jpg',
    description: 'Bold, glamorous style with geometric patterns and rich colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'coastal',
    name: 'Coastal',
    image: '/images/selectors/styles/coastal.jpg',
    description: 'Beach-inspired style with light colors and natural elements',
    rooms: ['Living Room', 'Bedroom', 'Bathroom']
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    image: '/images/selectors/styles/farmhouse.jpg',
    description: 'Cozy, practical style with vintage touches and natural materials',
    rooms: ['Living Room', 'Kitchen', 'Dining Room', 'Bedroom']
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    image: '/images/selectors/styles/mediterranean.jpg',
    description: 'Warm colors, textured walls, and ornate details',
    rooms: ['Living Room', 'Dining Room', 'Kitchen', 'Bathroom']
  },
  {
    id: 'japandi',
    name: 'Japandi',
    image: '/images/selectors/styles/japandi.jpg',
    description: 'Fusion of Japanese and Scandinavian aesthetics with minimalism',
    rooms: ['Living Room', 'Bedroom', 'Office']
  },
  {
    id: 'eclectic',
    name: 'Eclectic',
    image: '/images/selectors/styles/eclectic.jpg',
    description: 'Mix of different styles, textures, and time periods',
    rooms: ['Living Room', 'Bedroom', 'Studio']
  },
  {
    id: 'transitional',
    name: 'Transitional',
    image: '/images/selectors/styles/transitional.jpg',
    description: 'Blend of traditional and contemporary elements',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'neoclassical',
    name: 'Neoclassical',
    image: '/images/selectors/styles/neoclassical.jpg',
    description: 'Modern interpretation of classical Greek and Roman style',
    rooms: ['Living Room', 'Dining Room', 'Office']
  },
  {
    id: 'hollywood-regency',
    name: 'Hollywood Regency',
    image: '/images/selectors/styles/hollywood-regency.jpg',
    description: 'Glamorous, high-contrast style with bold colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'shabby-chic',
    name: 'Shabby Chic',
    image: '/images/selectors/styles/shabby-chic.jpg',
    description: 'Vintage style with distressed furniture and soft colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'tropical',
    name: 'Tropical',
    image: '/images/selectors/styles/tropical.jpg',
    description: 'Vibrant colors, natural materials, and lush plant elements',
    rooms: ['Living Room', 'Bedroom', 'Bathroom', 'Dining Room']
  }
];

interface StyleSelectorProps {
  onStyleSelect: (style: Style) => void;
  selectedStyleId?: string;
}

export function StyleSelector({ onStyleSelect, selectedStyleId }: StyleSelectorProps) {
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
    <div className="style-slider-container">
      <Slider {...sliderSettings} className="relative">
        {STYLES.map((style) => (
          <div key={style.id} className="px-2">
            <div
              className={`
                rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                ${selectedStyleId === style.id
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-transparent hover:border-blue-300'
                }
              `}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStyleSelect(style);
              }}
            >
              <div className="aspect-video relative">
                <img
                  src={style.image}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 relative group">
                <h3 className="font-semibold text-base">{style.name}</h3>
                
                {/* Tooltip that appears on hover */}
                <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-10">
                  <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-left">
                    <p className="text-sm text-gray-600">{style.description}</p>
                  </div>
                  <div className="w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45 absolute left-1/2 -ml-1.5"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
      {/* Custom styles for slider arrows are in index.css */}
    </div>
  );
}
