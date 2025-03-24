import React from 'react';

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
  }
];

interface StyleSelectorProps {
  onStyleSelect: (style: Style) => void;
  selectedStyleId?: string;
}

export function StyleSelector({ onStyleSelect, selectedStyleId }: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {STYLES.map((style) => (
        <div
          key={style.id}
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
          <div className="p-4">
            <h3 className="font-semibold text-lg">{style.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{style.description}</p>
            <div className="mt-2">
              <p className="text-xs text-gray-500">Perfect for:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {style.rooms.map((room) => (
                  <span
                    key={room}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                  >
                    {room}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}