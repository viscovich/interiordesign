import React from 'react';
// Removed Slider imports

export interface RoomType {
  id: string;
  name: string;
  image: string;
}

const ROOM_TYPES: RoomType[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    image: '/images/selectors/room-types/living-room.jpg'
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    image: '/images/selectors/room-types/bedroom.jpg'
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    image: '/images/selectors/room-types/kitchen.jpg'
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    image: '/images/selectors/room-types/bathroom.jpg'
  },
  {
    id: 'office',
    name: 'Office',
    image: '/images/selectors/room-types/office.jpg'
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    image: '/images/selectors/room-types/dining-room.jpg'
  }
];

interface RoomTypeSelectorProps {
  onRoomTypeSelect: (roomType: RoomType) => void;
  selectedRoomTypeId?: string;
}

export function RoomTypeSelector({ onRoomTypeSelect, selectedRoomTypeId }: RoomTypeSelectorProps) {
  // Removed slider settings

  return (
    <div className="mb-4"> {/* Added margin bottom */}
      <h3 className="text-lg font-semibold mb-2">Room Type</h3> {/* Added title */}
      <div className="grid grid-cols-3 gap-2"> {/* Changed to grid layout */}
        {ROOM_TYPES.map((roomType) => (
          <button
            key={roomType.id}
            onClick={() => onRoomTypeSelect(roomType)}
            className={`
              w-full py-2 px-3 border rounded-md text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-custom
              ${selectedRoomTypeId === roomType.id
                ? 'bg-gray-900 text-white border-gray-900' // Selected style
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' // Default style
              }
            `}
          >
            {roomType.name}
          </button>
        ))}
      </div>
    </div>
  );
}
