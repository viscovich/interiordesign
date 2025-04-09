import React, { useState, useEffect, useCallback } from 'react';
import { searchObjects, UserObject } from '../lib/userObjectsService';
import { supabase } from '../lib/supabase'; // To get user ID
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid'; // Assuming Heroicons is used

interface ObjectSelectorProps {
  onSelectionChange: (selectedObjects: UserObject[]) => void;
  userId: string | null; // Required prop - controls whether to render at all
}

export const ObjectSelector: React.FC<ObjectSelectorProps> = ({ onSelectionChange, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [objects, setObjects] = useState<UserObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<UserObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render anything if not auth by parent
  if (!userId || !userId.trim()) {
    return null;
  }

  // Debounced search function
  const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: any[]) => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
      timeout = setTimeout(() => func(...args), waitFor);
    };

    return debounced as (...args: Parameters<F>) => ReturnType<F>;
  };

  // Fetch objects when userId is available or search term changes
  const fetchObjects = useCallback(
    debounce(async (currentUserId: string, currentSearchTerm: string) => {
      if (!currentUserId) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch all objects matching the search term (no pagination for now)
        const { data } = await searchObjects(currentUserId, currentSearchTerm, '', 1, 100); // Fetch up to 100
        setObjects(data);
      } catch (err) {
        console.error("Error fetching objects:", err);
        setError("Failed to load objects.");
      } finally {
        setIsLoading(false);
      }
    }, 300), // 300ms debounce
    []
  );

  useEffect(() => {
    if (userId) {
      fetchObjects(userId, searchTerm);
    }
  }, [userId, searchTerm, fetchObjects]);

  const handleToggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleObjectSelect = (object: UserObject) => {
    setSelectedObjects(prevSelected => {
      const isSelected = prevSelected.some(obj => obj.id === object.id);
      let newSelection;
      if (isSelected) {
        newSelection = prevSelected.filter(obj => obj.id !== object.id);
      } else {
        if (prevSelected.length < 3) {
          newSelection = [...prevSelected, object];
        } else {
          // Optional: Add feedback that max selection is reached
          console.warn("Maximum 3 objects can be selected.");
          return prevSelected; // Return previous state if max is reached
        }
      }
      onSelectionChange(newSelection); // Notify parent component
      return newSelection;
    });
  };

  const isSelected = (objectId: string) => {
    return selectedObjects.some(obj => obj.id === objectId);
  };

  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={handleToggleAccordion}
        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
      >
        <span className="text-lg font-medium">Objects ({selectedObjects.length}/3)</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <input
            type="text"
            placeholder="Search objects..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 border border-gray-300 rounded-md mb-4 focus:ring-custom focus:border-custom"
          />

          {isLoading && <p className="text-center text-gray-500">Loading objects...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}

          {!isLoading && !error && objects.length === 0 && (
             <p className="text-center text-gray-500">No objects found{searchTerm ? ` for "${searchTerm}"` : ''}. You can upload objects in the 'My Objects' section.</p>
          )}

          {!isLoading && !error && objects.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {objects.map((object) => (
                <div
                  key={object.id}
                  onClick={() => handleObjectSelect(object)}
                  className={`
                    cursor-pointer border rounded-lg overflow-hidden transition-all duration-200
                    ${isSelected(object.id) ? 'border-custom ring-2 ring-custom' : 'border-gray-200 hover:shadow-md'}
                  `}
                >
                  <img
                    // Use thumbnail_url if available, otherwise asset_url
                    src={object.thumbnail_url || object.asset_url} 
                    alt={object.object_name}
                    className="w-full h-32 object-cover" // Fixed height, object-cover
                    onError={(e) => { 
                      // Optional: Handle image loading errors, e.g., show a placeholder
                      (e.target as HTMLImageElement).src = '/images/placeholder.png'; // Make sure you have a placeholder image
                    }}
                  />
                  <p className="text-center p-2 text-sm truncate">{object.object_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
