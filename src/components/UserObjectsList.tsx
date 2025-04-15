import React from 'react';
import type { UserObject } from '../lib/userObjectsService';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface UserObjectsListProps {
  objects: UserObject[];
  selectedObjects: string[];
  onSelectObject: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UserObjectsList({ objects, selectedObjects, onSelectObject, onDelete }: UserObjectsListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-8"> {/* Increased padding to p-8 */}
      {objects.map((object) => (
        <div
          key={object.id}
          className={`bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-transform duration-200 cursor-pointer ${
            selectedObjects.includes(object.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectObject(object.id);
          }}
        >
          {(object.thumbnail_url || object.asset_url) && (
            <img 
              src={object.thumbnail_url || object.asset_url} 
              alt={object.object_name} 
              className="w-full h-48 object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{object.object_name}</h3>
            <p className="text-sm text-gray-600">{object.object_type}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => onSelectObject(object.id)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(object.id)}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
