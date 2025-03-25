import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export interface RoomType {
  id: string;
  name: string;
  image: string;
}

const ROOM_TYPES: RoomType[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&auto=format'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    image: 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=500&auto=format'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format'
  },
  {
    id: 'office',
    name: 'Office',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&auto=format'
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=500&auto=format'
  }
];

interface RoomTypeSelectorProps {
  onRoomTypeSelect: (roomType: RoomType) => void;
  selectedRoomTypeId?: string;
}

export function RoomTypeSelector({ onRoomTypeSelect, selectedRoomTypeId }: RoomTypeSelectorProps) {
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
    <div className="room-type-slider-container">
      <Slider {...sliderSettings}>
        {ROOM_TYPES.map((roomType) => (
          <div key={roomType.id} className="px-2">
            <div
              className={`
                rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                ${selectedRoomTypeId === roomType.id
                  ? 'border-blue-500 shadow-md scale-105'
                  : 'border-transparent hover:border-blue-300'
                }
              `}
              onClick={() => onRoomTypeSelect(roomType)}
            >
              <div className="aspect-video relative">
                <img
                  src={roomType.image}
                  alt={roomType.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-center">
                <p className="font-semibold text-base">{roomType.name}</p>
              </div>
            </div>
          </div>
        ))}
      </Slider>
      {/* Custom styles for slider arrows are in index.css */}
    </div>
  );
}
