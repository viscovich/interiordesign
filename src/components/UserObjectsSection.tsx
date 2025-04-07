import React from 'react';
import { UserObject } from '../lib/userObjectsService';
import { UserObjectsList } from './UserObjectsList';

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
    <UserObjectsList
      objects={objects}
      selectedObjects={selectedObjects}
      onSelectObject={onSelectObject}
      onDelete={onDelete}
    />
  );
};
