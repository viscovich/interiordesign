import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { UserObjectsSection } from './UserObjectsSection';
import UploadObjectModal from './UploadObjectModal';
import { useAuth } from '../lib/auth';
import { getUserObjects, UserObject, deleteUserObject } from '../lib/userObjectsService';

interface FloatingObjectsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedObjects: string[];
  onSelectObject: (id: string) => void;
}

export const FloatingObjectsSidebar: React.FC<FloatingObjectsSidebarProps> = ({
  isOpen,
  onClose,
  selectedObjects,
  onSelectObject
}) => {
  const { user } = useAuth();
  const [objects, setObjects] = useState<UserObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleUploadSuccess = () => {
    fetchObjects();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchObjects();
  }, [user]);

  if (!isOpen) return null;

  const filteredObjects = objects.filter(obj =>
    obj.object_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    obj.object_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Draggable handle=".sidebar-header" bounds="parent" defaultPosition={{x: 0, y: 100}}>
      <div className="fixed right-4 top-24 w-[32rem] bg-white shadow-xl rounded-lg z-40 flex flex-col max-h-[80vh]">
        <div className="sidebar-header p-4 border-b flex justify-between items-center cursor-move">
          <h2 className="text-lg font-semibold">Select Objects</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Search objects..."
              className="w-full pl-8 pr-4 py-2 border rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mb-4 px-3 py-2 text-sm bg-custom text-white rounded-md hover:bg-custom/90"
          >
            + Upload New Object
          </button>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-md">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <UserObjectsSection 
                objects={filteredObjects}
                selectedObjects={selectedObjects}
                onSelectObject={onSelectObject}
                onDelete={async (id) => {
                  if (window.confirm('Are you sure you want to delete this object?')) {
                    try {
                      await deleteUserObject(id);
                      setObjects(objects.filter(obj => obj.id !== id));
                    } catch (err) {
                      setError('Failed to delete object. Please try again.');
                      console.error('Error deleting object:', err);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>

        <UploadObjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </Draggable>
  );
};
