import React, { useState, useEffect } from 'react';
import { getUserObjects, UserObject, deleteUserObject, searchObjects } from '../lib/userObjectsService';
import { UserObjectsSection } from './UserObjectsSection';
import UploadObjectModal from './UploadObjectModal';
import { useAuth } from '../lib/auth';

const UserObjectsManager: React.FC = () => {
  const { user } = useAuth();
  const [allObjects, setAllObjects] = useState<UserObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<UserObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [objectsPerPage] = useState(6); // 2 rows of 3 items
  const [selectedObject, setSelectedObject] = useState<UserObject | null>(null);

  const fetchObjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching objects with params:', {
        userId: user.id,
        nameFilter,
        typeFilter, 
        currentPage,
        objectsPerPage
      });
      
      // Get all objects without pagination to have complete filtered list
      const { data: allUserObjects } = await searchObjects(
        user.id,
        nameFilter,
        typeFilter,
        1, // page 1
        1000 // large page size to get all
      );

      // Then get paginated results for display
      const { data: pagedObjects, count } = await searchObjects(
        user.id,
        nameFilter,
        typeFilter,
        currentPage,
        objectsPerPage
      );
      
      console.log('Received objects:', {
        totalCount: count,
        allObjects: allUserObjects.length,
        returnedObjects: pagedObjects.length,
        totalPages: Math.ceil(count / objectsPerPage)
      });
      
      setAllObjects(allUserObjects);
      setFilteredObjects(allUserObjects);
    } catch (err) {
      setError('Failed to load objects. Please try again.');
      console.error('Error fetching objects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Filtering objects:', { 
      nameFilter, 
      typeFilter,
      objectTypes: allObjects.map(o => o.object_type) 
    });
    
    const filtered = allObjects.filter(obj => {
      const matchesName = obj.object_name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = typeFilter === '' || 
                         obj.object_type.toUpperCase() === typeFilter.toUpperCase();
      return matchesName && matchesType;
    });
    
    console.log('Filtered objects count:', filtered.length);
    setFilteredObjects(filtered);
    setCurrentPage(1);
  }, [nameFilter, typeFilter, allObjects]);

  // Get current objects for pagination
  const indexOfLastObject = currentPage * objectsPerPage;
  const indexOfFirstObject = indexOfLastObject - objectsPerPage;
  const currentObjects = filteredObjects.slice(indexOfFirstObject, indexOfLastObject);

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
    <div className="space-y-4 p-8"> {/* Increased padding to p-8 */}
      <h2 className="text-lg font-semibold mb-4">My Objects</h2>
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Upload your objects to include in your design</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-custom-800 shadow-md"
        >
          Upload Object
        </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Name
            </label>
              <input
                type="text"
                id="nameFilter"
                placeholder="Search by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
          </div>
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              <option value="">All Types</option>
              {["TABLE", "CHAIR", "FRIDGE", "SOFA", "LAMP", "BED", "WARDROBE", "OTHER"].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
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
          objects={currentObjects}
          selectedObjects={selectedObjects}
          onSelectObject={(id) => {
            handleSelectObject(id);
            const obj = allObjects.find(o => o.id === id);
            if (obj) setSelectedObject(obj);
          }}
          onDelete={async (id) => {
            if (window.confirm('Are you sure you want to delete this object?')) {
              try {
                await deleteUserObject(id);
                setAllObjects(allObjects.filter(obj => obj.id !== id));
                setFilteredObjects(filteredObjects.filter(obj => obj.id !== id));
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

      {selectedObject && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedObject(null)}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedObject.object_name}</h2>
              <button 
                onClick={() => setSelectedObject(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <img 
                  src={selectedObject.asset_url} 
                  alt={selectedObject.object_name}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="flex-1">
                <div className="mb-4"> {/* Added margin-bottom */}
                  <h3 className="font-bold text-lg">Type:</h3>
                  <p>{selectedObject.object_type}</p>
                </div>
                {/* Add Description Section */}
                {selectedObject.description && (
                  <div>
                    <h3 className="font-bold text-lg">Description:</h3>
                    <p className="text-gray-700">{selectedObject.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center mt-6 gap-4">
        <div className="text-sm text-gray-500">
          Showing {currentObjects.length} of {filteredObjects.length} objects
        </div>
        {filteredObjects.length > objectsPerPage && (
          <div className="flex gap-2">
            {Array.from({ 
              length: Math.ceil(filteredObjects.length / objectsPerPage) 
            }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    currentPage === i + 1 
                      ? 'bg-black text-white font-medium' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserObjectsManager;
