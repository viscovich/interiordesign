import React from 'react';

import { UserObject } from '../lib/userObjectsService';

interface UserObjectsSectionProps {
  objects: UserObject[];
  onDelete: (id: string) => Promise<void>;
}

const UserObjectsSection: React.FC<UserObjectsSectionProps> = ({ objects, onDelete }) => {
  if (objects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No objects found</p>
        <p className="text-sm mt-1">Upload your first object to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {objects.map((obj) => (
        <div key={obj.asset_url} className="aspect-square p-2 flex flex-col justify-center items-center">
          <img
            src={obj.asset_url}
            alt={obj.object_name}
            className="max-w-full max-h-20 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div className="text-center w-full mt-1 relative">
            <span className="text-xs text-gray-600 truncate w-full block" title={obj.object_name}>
              {obj.object_name}
            </span>
            <span className="text-xs text-gray-400 truncate w-full block" title={obj.object_type}>
              ({obj.object_type})
            </span>
            <button 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement delete functionality
                onDelete(obj.id);
              }}
              title="Delete object"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserObjectsSection;
