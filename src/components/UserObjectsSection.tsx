import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { UserObject } from '../lib/userObjectsService';

interface UserObjectsSectionProps {
  objects: UserObject[];
  onDelete: (id: string) => Promise<void>;
  selectedObjects: string[];
  onSelectObject: (id: string) => void;
}

export const UserObjectsSection: React.FC<UserObjectsSectionProps> = ({
  objects,
  onDelete,
  selectedObjects,
  onSelectObject
}) => {
  const sliderSettings = {
    dots: false,
    infinite: false,
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

  if (objects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No objects found</p>
        <p className="text-sm mt-1">Upload your first object to get started</p>
      </div>
    );
  }

  return (
    <div className="object-slider-container">
      <Slider {...sliderSettings}>
        {objects.map((obj) => (
          <div key={obj.id} className="px-2">
            <div
              className={`
                rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                ${selectedObjects.includes(obj.id)
                  ? 'border-blue-500 shadow-md scale-105'
                  : 'border-transparent hover:border-blue-300'
                }
              `}
              onClick={() => onSelectObject(obj.id)}
            >
              <div className="aspect-video relative">
                <img
                  src={obj.asset_url}
                  alt={obj.object_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-3 text-center">
                <p className="font-semibold text-base">{obj.object_name}</p>
                <p className="text-sm text-gray-500">{obj.object_type}</p>
                <button
                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(obj.id);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};
