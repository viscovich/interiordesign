import { useState, useEffect } from 'react';
import { UserObject } from '../lib/userObjectsService';
import { getUserObjects, deleteUserObject } from '../lib/userObjectsService';
import toast from 'react-hot-toast';

// Remove unused activeSection parameter
export default function useUserObjects(userId: string | undefined) { 
  const [userObjects, setUserObjects] = useState<UserObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [loadingObjects, setLoadingObjects] = useState(false);

  useEffect(() => {
    const fetchObjects = async () => {
      // Fetch objects whenever userId is available, not just in 'objects' section
      if (userId) { 
        setLoadingObjects(true);
        try {
          const objects = await getUserObjects(userId);
          setUserObjects(objects);
        } catch (error) {
          console.error("Failed to fetch user objects:", error);
          toast.error("Could not load your objects.");
        } finally {
          setLoadingObjects(false);
        }
      }
    };
    fetchObjects();
  // Dependency array updated to only rely on userId
  }, [userId]); 

  const handleDeleteObject = async (id: string) => {
    if (!userId) return;
    
    const originalObjects = [...userObjects];
    setUserObjects(currentObjects => currentObjects.filter(obj => obj.id !== id));
    setSelectedObjects(currentSelected => currentSelected.filter(objId => objId !== id));

    try {
      await deleteUserObject(id);
      toast.success("Object deleted successfully.");
    } catch (error) {
      console.error("Failed to delete object:", error);
      toast.error("Failed to delete object. Please try again.");
      setUserObjects(originalObjects);
    }
  };

  const handleSelectObject = (id: string) => {
    setSelectedObjects(prev =>
      prev.includes(id)
        ? prev.filter(objId => objId !== id)
        : [...prev, id]
    );
  };

  return {
    userObjects,
    selectedObjects,
    loadingObjects,
    handleDeleteObject,
    handleSelectObject
  };
}
