import React, { useState, useEffect, useCallback } from 'react';
import { Project, ImageObject, UserObject } from '../lib/projectsService.d';
import {
  getImageObjects,
  getUserObjects,
  recognizeAndSaveObjects,
  regenerateImageWithSubstitution
} from '../lib/projectsService';
import { useAuth } from '../lib/auth'; // Correctly imported useAuth

// --- Placeholder Sub-components ---
// These will be created in separate files later

interface LibrarySidebarProps {
  recognizedObjects: ImageObject[];
  onSelectObject: (objectName: string) => void;
  // Removed onRecognize and isLoadingRecognition props
  selectedObjectName: string | null;
}
// Updated LibrarySidebar: Removed Scan button and related logic
const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ recognizedObjects, onSelectObject, selectedObjectName }) => (
  <div className="w-64 p-4 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0"> {/* Fixed width */}
    {/* Placeholder for Photos section from mockup - not implemented */}
    {/* <h2 className="text-sm font-semibold mb-2 text-gray-600">Photos</h2> */}
    {/* ... list photos ... */}

    <h2 className="text-sm font-semibold mb-3 text-gray-600 mt-4">REPLACEABLE OBJECTS</h2>
    {/* Removed Scan Objects button */}
    {recognizedObjects.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">No replaceable objects were identified in this image during generation.</p>
    )}
    <div className="space-y-2 mt-3">
      {recognizedObjects.map((obj) => (
         <div key={obj.id}
            onClick={() => onSelectObject(obj.object_name)}
            className={`flex items-center p-2 rounded-md cursor-pointer border ${selectedObjectName === obj.object_name ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
        >
          {/* Placeholder Icon - replace with actual icons if available */}
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          <span className="text-sm">{obj.object_name}</span>
        </div>
      ))}
    </div>
    {/* "Upload new" removed as requested */}
  </div>
);

interface ImageEditorProps {
  imageUrl: string | null; // Allow null
}
// Updated ImageEditor styling
const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl }) => (
  <div className="flex-grow p-6 flex justify-center items-center bg-gray-200 relative overflow-hidden">
     {/* Optional: Add subtle background pattern */}
     {/* <div className="absolute inset-0 bg-dots-pattern opacity-10"></div> */}
    {imageUrl ? (
        <img src={imageUrl} alt="Current design" className="max-w-full max-h-full object-contain rounded-md shadow-lg z-10" />
    ) : (
        <div className="text-gray-500">No image loaded</div>
    )}
  </div>
);

interface SubstitutionPanelProps {
 selectedObjectName: string | null;
 userObjectLibrary: UserObject[];
 onSelectReplacement: (object: UserObject) => void;
 selectedReplacementObject: UserObject | null;
 // Add project prop to potentially get current object details if needed later
 project: Project | null;
}
// Updated SubstitutionPanel to better match mockup
const SubstitutionPanel: React.FC<SubstitutionPanelProps> = ({ selectedObjectName, userObjectLibrary, onSelectReplacement, selectedReplacementObject, project }) => {
    if (!selectedObjectName) {
        return <div className="w-72 p-4 border-l border-gray-200 bg-gray-50 flex-shrink-0"><p className="text-sm text-gray-500">Select an object from the list on the left to see replacement options.</p></div>;
    }

    // --- Filtering Logic ---
    // This still relies on the user having set the 'object_type' correctly during upload.
    // We need a reliable way to map the recognized 'object_name' (e.g., "Refrigerator")
    // to the user-defined 'object_type' (e.g., "Refrigerator").
    // For now, we'll assume a direct match or a mapping function exists.
    // Let's refine the assumption: We filter user library by object_type that matches the selectedObjectName.
    const objectTypeToFilter = selectedObjectName; // This is the weak point - needs better mapping if names differ from types
    const compatibleObjects = userObjectLibrary.filter(obj => obj.object_type.toLowerCase() === objectTypeToFilter.toLowerCase());

    // Find the selected replacement object details to display dimensions
    const currentReplacementDetails = userObjectLibrary.find(obj => obj.id === selectedReplacementObject?.id);

    return (
        <div className="w-72 p-4 border-l border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0 flex flex-col"> {/* Fixed width */}
            <h2 className="text-xl font-semibold mb-1">{selectedObjectName}</h2>
            {/* Display dimensions if available for the *selected replacement* object */}
            {currentReplacementDetails?.dimensions && (
                 <p className="text-sm text-gray-500 mb-4">{currentReplacementDetails.dimensions}</p>
            )}
             {/* Placeholder for "Current" thumbnail - requires knowing which object in the original image corresponds */}
             {/* <h3 className="text-sm font-medium mb-2 text-gray-600">Current</h3> */}
             {/* <div className="flex space-x-2 mb-4"> ... thumbnails ... </div> */}


            <h3 className="text-sm font-medium mb-2 text-gray-600">REPLACE WITH</h3>
            {compatibleObjects.length === 0 && (
                <p className="text-xs text-gray-500">No compatible objects of type '{objectTypeToFilter}' found in your library. You can upload compatible objects via the main dashboard.</p>
            )}
            <div className="grid grid-cols-2 gap-3 flex-grow"> {/* Grid takes remaining space */}
                {compatibleObjects.map((obj) => (
                    <div key={obj.id}
                         onClick={() => onSelectReplacement(obj)}
                         className={`border rounded-lg p-1 cursor-pointer transition-all duration-150 ${selectedReplacementObject?.id === obj.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'}`}
                    >
                        <img src={obj.thumbnail_url || obj.asset_url} alt={obj.object_name} className="w-full h-24 object-cover mb-1 rounded-md"/>
                        <p className="text-xs text-center truncate px-1">{obj.object_name}</p>
                    </div>
                ))}
            </div>
             {/* Generate button moved to footer */}
        </div>
    );
};


// --- Main Modal Component ---

interface ImageModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null; // Pass the full project object
}

const ImageModificationModal: React.FC<ImageModificationModalProps> = ({ isOpen, onClose, project }) => {
  const { user } = useAuth(); // Make sure useAuth() is correctly imported and provides { user: { id: string } }
  const [recognizedObjects, setRecognizedObjects] = useState<ImageObject[]>([]);
  const [userObjectLibrary, setUserObjectLibrary] = useState<UserObject[]>([]);
  const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null);
  const [selectedReplacementObject, setSelectedReplacementObject] = useState<UserObject | null>(null);
  // Removed isLoadingRecognition state
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // Holds original or newly generated URL

  // Reset state when project changes or modal opens/closes
  useEffect(() => {
    if (isOpen && project) {
      setCurrentImageUrl(project.generated_image_url || project.original_image_url); // Start with the latest image
      setSelectedObjectName(null);
      setSelectedReplacementObject(null);
      setError(null);
      // Removed setIsLoadingRecognition(false);
      setIsLoadingGeneration(false);
      // Fetch existing recognized objects for this project (populated during generation)
      fetchRecognizedObjects();
      // Fetch user's object library
      fetchUserLibrary();
    } else if (!isOpen) {
        // Clear state on close
        setRecognizedObjects([]);
        setUserObjectLibrary([]);
        setCurrentImageUrl(null);
    }
  }, [isOpen, project]);

  const fetchRecognizedObjects = useCallback(async () => {
    if (!project || !user) return;
    try {
      const objects = await getImageObjects(project.id);
      setRecognizedObjects(objects);
    } catch (err) {
      console.error("Error fetching recognized objects:", err);
      setError("Failed to load recognized objects.");
    }
  }, [project, user]);

  const fetchUserLibrary = useCallback(async () => {
    if (!user) return;
    try {
      const objects = await getUserObjects(user.id);
      setUserObjectLibrary(objects);
    } catch (err) {
      console.error("Error fetching user library:", err);
      setError("Failed to load your object library.");
    }
  }, [project, user]);

  // Removed handleRecognizeObjects function

  const handleSelectObject = (objectName: string) => {
    setSelectedObjectName(objectName);
    setSelectedReplacementObject(null); // Reset replacement choice when selecting a new original object
  };

  const handleSelectReplacement = (object: UserObject) => {
    setSelectedReplacementObject(object);
  };

  const handleGenerate = async () => {
    if (!project || !selectedObjectName || !selectedReplacementObject || !currentImageUrl) {
        setError("Please select an object to replace and a replacement object.");
        return;
    }
    setIsLoadingGeneration(true);
    setError(null);
    try {
        const newImageUrl = await regenerateImageWithSubstitution(
            currentImageUrl,
            selectedReplacementObject,
            selectedObjectName
        );
        setCurrentImageUrl(newImageUrl); // Update the displayed image
        // Optionally: Update the project in the database with the new URL
        // await updateProjectImageUrl(project.id, newImageUrl);
        setSelectedObjectName(null); // Reset selections after generation
        setSelectedReplacementObject(null);
        setRecognizedObjects([]); // Clear recognized objects as they might be invalid now
        alert("New image generated successfully!"); // Simple feedback for now
    } catch (err) {
        console.error("Error generating new image:", err);
        setError("Failed to generate new image.");
    } finally {
        setIsLoadingGeneration(false);
    }
  };


  if (!isOpen || !project) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden"> {/* Increased max-width, overflow hidden */}
        {/* Header */}
        <div className="p-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          {/* Use project name or fallback */}
          <h1 className="text-lg font-semibold text-gray-800">Modify Design: {project.room_type || project.id}</h1>
          {/* Close button using an icon */}
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
        </div>

         {/* Main Content Area - Ensure it takes remaining height */}
        <div className="flex flex-grow min-h-0"> {/* Use min-h-0 to allow flex items to shrink/scroll */}
          <LibrarySidebar
            recognizedObjects={recognizedObjects}
            // Removed onRecognize and isLoadingRecognition props
            onSelectObject={handleSelectObject}
            selectedObjectName={selectedObjectName}
          />
          <ImageEditor imageUrl={currentImageUrl} /> {/* Pass null if needed */}
          <SubstitutionPanel
             project={project} // Pass project
             selectedObjectName={selectedObjectName}
             userObjectLibrary={userObjectLibrary}
             onSelectReplacement={handleSelectReplacement}
             selectedReplacementObject={selectedReplacementObject}
          />
        </div>

        {/* Footer - Adjusted styling */}
        <div className="p-3 border-t border-gray-200 flex justify-between items-center bg-gray-50 flex-shrink-0">
             <div className="flex-grow mr-4">
                {error && <p className="text-red-600 text-xs truncate">{error}</p>}
                {!error && isLoadingGeneration && <p className="text-blue-600 text-xs">Generating new image, please wait...</p>}
                {/* Placeholder for success message? */}
            </div>
             <button
                onClick={handleGenerate}
                disabled={!selectedObjectName || !selectedReplacementObject || isLoadingGeneration} // Removed isLoadingRecognition from disabled check
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
                {isLoadingGeneration ? (
                    <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </div>
                ) : 'Generate New Image'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModificationModal;
