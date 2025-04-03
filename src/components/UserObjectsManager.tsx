import React, { useState, useEffect } from 'react';
import { getUserObjects, UserObject, deleteUserObject } from '../lib/userObjectsService';
import { UserObjectsSection } from './UserObjectsSection';
import UploadObjectModal from './UploadObjectModal';
import { useAuth } from '../lib/auth';

const UserObjectsManager: React.FC = () => {
  const { user } = useAuth();
  const [objects, setObjects] = useState<UserObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchObjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const userObjects = await getUserObjects(user.id);
      setObjects(userObjects);
    } catch (err) {
      setError('Failed to load objects. Please try again.');
      console.error('Error fetching objects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectObject = (id: string): void => {
    setSelectedObjects(prev => 
      prev.includes(id) 
        ? prev.filter(objId => objId !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    fetchObjects();
  }, [user]);

  const handleUploadSuccess = () => {
    fetchObjects();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">Select Objects</h2>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">Choose objects to include in your design</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1 text-sm bg-custom text-white rounded-md hover:bg-custom/90"
        >
          + Upload
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-md">
          {error}
        </div>
      ) : (
        <UserObjectsSection 
          objects={objects}
          selectedObjects={selectedObjects}
          onSelectObject={handleSelectObject}
          onDelete={async (id) => {
            if (window.confirm('Are you sure you want to delete this object?')) {
              try {
                await deleteUserObject(id);
                setObjects(objects.filter(obj => obj.id !== id));
                setSelectedObjects(selectedObjects.filter(objId => objId !== id));
              } catch (err) {
                setError('Failed to delete object. Please try again.');
                console.error('Error deleting object:', err);
              }
            }
          }}
        />
      )}

      <UploadObjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default UserObjectsManager;
