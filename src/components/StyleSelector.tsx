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
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
    description: 'Clean lines, minimal decoration, and functional furniture',
    rooms: ['Living Room', 'Bedroom', 'Office']
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace',
    description: 'Light colors, natural materials, and cozy textures',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'industrial',
    name: 'Industrial',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
    description: 'Raw materials, exposed elements, and urban appeal',
    rooms: ['Living Room', 'Office', 'Kitchen']
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    image: 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467',
    description: 'Eclectic patterns, rich colors, and artistic elements',
    rooms: ['Living Room', 'Bedroom', 'Studio']
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c',
    description: 'Clean lines, monochromatic palette, and clutter-free spaces',
    rooms: ['Living Room', 'Bedroom', 'Office', 'Dining Room']
  },
  {
    id: 'mid-century-modern',
    name: 'Mid-Century Modern',
    image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
    description: 'Retro style with organic shapes and functional design',
    rooms: ['Living Room', 'Dining Room', 'Office']
  },
  {
    id: 'traditional',
    name: 'Traditional',
    image: 'https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da',
    description: 'Classic, timeless design with elegant details and rich colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    image: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e',
    description: 'Current, evolving style that borrows from various styles',
    rooms: ['Living Room', 'Bedroom', 'Office', 'Kitchen']
  },
  {
    id: 'rustic',
    name: 'Rustic',
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e',
    description: 'Natural, aged, and casual style with organic textures',
    rooms: ['Living Room', 'Bedroom', 'Dining Room', 'Kitchen']
  },
  {
    id: 'art-deco',
    name: 'Art Deco',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013',
    description: 'Bold, glamorous style with geometric patterns and rich colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'coastal',
    name: 'Coastal',
    image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea',
    description: 'Beach-inspired style with light colors and natural elements',
    rooms: ['Living Room', 'Bedroom', 'Bathroom']
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    image: 'https://images.unsplash.com/photo-1558882224-dda166733046',
    description: 'Cozy, practical style with vintage touches and natural materials',
    rooms: ['Living Room', 'Kitchen', 'Dining Room', 'Bedroom']
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea',
    description: 'Warm colors, textured walls, and ornate details',
    rooms: ['Living Room', 'Dining Room', 'Kitchen', 'Bathroom']
  },
  {
    id: 'japandi',
    name: 'Japandi',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=500&auto=format',
    description: 'Fusion of Japanese and Scandinavian aesthetics with minimalism',
    rooms: ['Living Room', 'Bedroom', 'Office']
  },
  {
    id: 'eclectic',
    name: 'Eclectic',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
    description: 'Mix of different styles, textures, and time periods',
    rooms: ['Living Room', 'Bedroom', 'Studio']
  },
  {
    id: 'transitional',
    name: 'Transitional',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
    description: 'Blend of traditional and contemporary elements',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'neoclassical',
    name: 'Neoclassical',
    image: 'https://images.unsplash.com/photo-1618220048045-10a6dbdf83e0',
    description: 'Modern interpretation of classical Greek and Roman style',
    rooms: ['Living Room', 'Dining Room', 'Office']
  },
  {
    id: 'hollywood-regency',
    name: 'Hollywood Regency',
    image: 'https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77',
    description: 'Glamorous, high-contrast style with bold colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'shabby-chic',
    name: 'Shabby Chic',
    image: 'https://images.unsplash.com/photo-1616593969747-4797dc75033e',
    description: 'Vintage style with distressed furniture and soft colors',
    rooms: ['Living Room', 'Bedroom', 'Dining Room']
  },
  {
    id: 'tropical',
    name: 'Tropical',
    image: 'https://images.unsplash.com/photo-1617104678098-de229db51175',
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
      <Slider {...sliderSettings}>
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
              onClick={() => onStyleSelect(style)}
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
