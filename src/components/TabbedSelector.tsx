import React, { useState } from 'react';
import { StyleSelector, Style } from './StyleSelector';
import { RoomTypeSelector, RoomType } from './RoomTypeSelector';

interface TabbedSelectorProps {
  styles: {
    onStyleSelect: (style: Style) => void;
    selectedStyleId?: string;
  };
  roomTypes: {
    onRoomTypeSelect: (roomType: RoomType) => void;
    selectedRoomTypeId?: string;
  };
}

export const TabbedSelector: React.FC<TabbedSelectorProps> = ({ styles, roomTypes }) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'roomTypes'>('styles');

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="flex border-b">
        <button
          className={`flex-1 py-3 px-4 font-medium text-center ${activeTab === 'styles' ? 'text-custom border-b-2 border-custom' : 'text-gray-500'}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
        <button
          className={`flex-1 py-3 px-4 font-medium text-center ${activeTab === 'roomTypes' ? 'text-custom border-b-2 border-custom' : 'text-gray-500'}`}
          onClick={() => setActiveTab('roomTypes')}
        >
          Room Types
        </button>
      </div>
      <div className="p-4">
        {activeTab === 'styles' ? (
          <StyleSelector
            onStyleSelect={styles.onStyleSelect}
            selectedStyleId={styles.selectedStyleId}
          />
        ) : (
          <RoomTypeSelector
            onRoomTypeSelect={roomTypes.onRoomTypeSelect}
            selectedRoomTypeId={roomTypes.selectedRoomTypeId}
          />
        )}
      </div>
    </div>
  );
};
