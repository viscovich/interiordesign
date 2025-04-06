import React from 'react';
import { UserObject } from '../lib/userObjectsService';
import { TrashIcon } from '@heroicons/react/24/outline';

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
  if (objects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No objects found</p>
        <p className="text-sm mt-1">Upload your first object to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {objects.map((obj) => (
        <div
          key={obj.id}
          className={`relative p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
            selectedObjects.includes(obj.id) 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200'
          }`}
        >
          <div
            className="cursor-pointer"
            onClick={() => onSelectObject(obj.id)}
          >
            <div className="flex flex-col space-y-2">
              {obj.asset_url && (
                <img 
                  src={obj.asset_url} 
                  alt={obj.object_name}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{obj.object_name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(obj.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Delete object"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">{obj.object_type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
