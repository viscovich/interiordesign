import React from 'react';
import { UserObjectsSection } from '../components/UserObjectsSection';
import { UserObject } from '../lib/userObjectsService';

interface ObjectsSectionProps {
  objects: UserObject[];
  loading: boolean;
  selectedObjects: string[];
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => Promise<void>;
}

export default function ObjectsSection({
  objects,
  loading,
  selectedObjects,
  onSelectObject,
  onDeleteObject
}: ObjectsSectionProps) {
  return (
    <section className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">My Objects</h2>
        {loading ? (
          <p className="text-center text-gray-500">Loading objects...</p>
        ) : (
          <UserObjectsSection
            objects={objects}
            onDelete={onDeleteObject}
            selectedObjects={selectedObjects}
            onSelectObject={onSelectObject}
          />
        )}
      </div>
    </section>
  );
}
