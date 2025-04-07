import React, { useState, useEffect, useCallback } from 'react';
import { Project, ImageObject, UserObject } from '../lib/projectsService.d';
import {
  getImageObjects,
  getUserObjects,
  regenerateImageWithSubstitution,
  createProject
} from '../lib/projectsService';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast'; // Import toast
import { ViewTypeSelector } from './ViewTypeSelector';
import { RenderingTypeSelector } from './RenderingTypeSelector';
import { ColorPaletteSelector } from './ColorPaletteSelector';

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
  onGenerationComplete?: () => void; // Add callback for completion
}

const ImageModificationModal: React.FC<ImageModificationModalProps> = ({ isOpen, onClose, project, onGenerationComplete }) => {
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

  const [selectedViewType, setSelectedViewType] = useState<string | null>(null);
  const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null);
  const [selectedColorTone, setSelectedColorTone] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!project || !currentImageUrl) {
        setError("Project or image not loaded.");
        return;
    }
    
    // If no object replacement selected, we're just generating a new variant
    const isObjectReplacement = selectedObjectName && selectedReplacementObject;
    
    setIsLoadingGeneration(true);
    setError(null);
    try {
        let newImageUrl;
        
        if (isObjectReplacement) {
            newImageUrl = await regenerateImageWithSubstitution(
                currentImageUrl,
                selectedReplacementObject,
                selectedObjectName,
                selectedViewType || project.view_type,
                selectedRenderingType,
                selectedColorTone || project.color_tone,
                project
            );
        } else {
            // Generate new variant with different parameters
            newImageUrl = await regenerateImageWithSubstitution(
                currentImageUrl,
                null,
                null,
                selectedViewType || project.view_type,
                selectedRenderingType,
                selectedColorTone || project.color_tone,
                project
            );
        }

        // Create new project with the variant
        const newProject = await createProject(
          project.user_id,
          project.original_image_url, // Keep original image
          newImageUrl,
          project.style,
          project.room_type,
          project.description, // Keep original description
          selectedViewType || project.view_type, // New view type
          selectedColorTone || project.color_tone // New color tone
        );
        
        // Success!
        setCurrentImageUrl(newImageUrl); // Optional: update internal state if needed before close
        setSelectedObjectName(null);
        setSelectedReplacementObject(null);
        setRecognizedObjects([]); // Clear recognized objects for the closed modal state
        toast.success(`New variant generated and saved!`);
        onClose(); // Close the modal
        onGenerationComplete?.(); // Trigger refresh in parent
    } catch (err) {
        console.error("Error generating new image:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to generate new image.";
        setError(errorMessage);
        toast.error(`Generation failed: ${errorMessage}`);
    } finally {
        setIsLoadingGeneration(false);
    }
  };


  if (!isOpen || !project) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <header className="py-4 px-6 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Modifica Design: {project.room_type}</h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        <main className="py-4 px-6">
          <div className="flex gap-6 h-[70vh]">
            {/* Colonna sinistra - 25% */}
            <div className="w-1/4 overflow-y-auto">
              <LibrarySidebar
                recognizedObjects={recognizedObjects}
                onSelectObject={handleSelectObject}
                selectedObjectName={selectedObjectName}
              />
            </div>

            {/* Colonna centrale - 50% */}
            <div className="w-1/2 flex flex-col gap-4">
              <div className="rounded-lg overflow-hidden shadow-lg h-[60%]">
                <ImageEditor imageUrl={currentImageUrl} />
              </div>

              {/* Sezione oggetti selezionati */}
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Oggetti Selezionati</h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedReplacementObject && (
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">{selectedReplacementObject.object_name}</span>
                        <button 
                          onClick={() => setSelectedReplacementObject(null)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <img 
                        src={selectedReplacementObject.thumbnail_url || selectedReplacementObject.asset_url} 
                        alt={selectedReplacementObject.object_name} 
                        className="mt-2 w-full h-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonna destra - 25% */}
            <div className="w-1/4 overflow-y-auto">
              <SubstitutionPanel
                project={project}
                selectedObjectName={selectedObjectName}
                userObjectLibrary={userObjectLibrary}
                onSelectReplacement={handleSelectReplacement}
                selectedReplacementObject={selectedReplacementObject}
              />
            </div>
          </div>
        </main>

        {/* Controlli di visualizzazione */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-3 gap-4">
            <ViewTypeSelector
              value={selectedViewType || project.view_type || ''}
              onChange={setSelectedViewType}
            />
            <RenderingTypeSelector
              value={selectedRenderingType || ''}
              onChange={setSelectedRenderingType}
            />
            <ColorPaletteSelector
              selectedPaletteId={selectedColorTone || project.color_tone || undefined}
              onPaletteSelect={(palette) => setSelectedColorTone(palette.id)}
            />
          </div>
        </div>

        <div className="px-6 pb-4 flex justify-end sticky bottom-0 bg-white">
          <button
            onClick={handleGenerate}
            disabled={isLoadingGeneration}
            className="!rounded-button px-6 py-3 bg-custom text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoadingGeneration ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </div>
            ) : 'Genera Nuova Variante'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModificationModal;
