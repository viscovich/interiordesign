import React, { useState, useEffect, useCallback } from 'react';
import { Project, UserObject, ImageObject } from '../lib/projectsService.d'; // Re-added ImageObject import for type safety
import {
    // Removed regenerateImageWithSubstitution, createProject, saveDetectedObjects
    createProjectForAsyncGeneration // Added async function import
} from '../lib/projectsService';
import { getUserObjects } from '../lib/userObjectsService';
// import { uploadImage } from '../lib/storage'; // Removed uploadImage import
import { supabase } from '../lib/supabase'; // Added Supabase client import
import { useAuth } from '../lib/auth';
import { useCredit } from '../lib/userService'; // Added useCredit import
import { getNewGenerationPrompt } from '../lib/gemini'; // Added prompt generator import
import toast from 'react-hot-toast';
import InfoModal from './InfoModal'; // Corrected InfoModal import (default export)
// Import the selector components
import { ViewTypeSelector } from './ViewTypeSelector';
import { RenderingTypeSelector } from './RenderingTypeSelector';
import { ColorToneSelector } from './ColorToneSelector'; // Using ColorToneSelector

// Assuming remixicon CSS is loaded globally

interface ImageModificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    onGenerationComplete?: () => void;
}

// Removed generateThumbnail helper function

const ImageModificationModal: React.FC<ImageModificationModalProps> = ({ isOpen, onClose, project, onGenerationComplete }) => {
    const { user } = useAuth();
    const [userObjectLibrary, setUserObjectLibrary] = useState<UserObject[]>([]);
    const [selectedObjectType, setSelectedObjectType] = useState<string | null>(null);
    const [selectedReplacementsMap, setSelectedReplacementsMap] = useState<Record<string, UserObject | null>>({});
    const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // State for the info modal

    // State for dynamic selectors
    const [selectedViewType, setSelectedViewType] = useState<string | null>(null);
    const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null);
    const [selectedColorTone, setSelectedColorTone] = useState<string | null>(null); // Using ColorTone state

    // Define fixed objects per room type
    const roomTypeObjects: Record<string, string[]> = {
        'living-room': ['sofa', 'armchair', 'table', 'lamp'],
        'bathroom': ['toilet', 'sink', 'shower', 'bathtub'],
        'bedroom': ['bed', 'nightstand', 'dresser', 'lamp'],
        'dining-room': ['table', 'chair', 'cabinet', 'lamp'],
        'kitchen': ['counter', 'cabinet', 'stove', 'fridge'],
        'office': ['desk', 'chair', 'bookshelf', 'lamp'],
        // Add default or handle unknown room types if necessary
    };

    // Moved fetchUserLibrary definition before useEffect that uses it
    const fetchUserLibrary = useCallback(async () => {
        if (!user) return;
        try {
            const objects = await getUserObjects(user.id);
            setUserObjectLibrary(objects);
        } catch (err) {
            console.error("Error fetching user library:", err);
            toast.error("Failed to load your object library.");
        }
    }, [user]); // Dependency for useCallback

    // --- Data Fetching and State Reset ---
    useEffect(() => {
        if (isOpen && project) {
            setCurrentImageUrl(project.generated_image_url || project.original_image_url);
            setSelectedObjectType(null); // Reset selected object type
            setSelectedReplacementsMap({}); // Reset the map
            setError(null); // Clear errors on open
            setIsLoadingGeneration(false);
            // Initialize selectors with project values or defaults
            // Initialize all selectors from project values
            setSelectedViewType(project.view_type || 'frontal'); // Default to frontal if not set
            setSelectedColorTone(project.color_tone || 'palette:neutral'); // Default to neutral palette
            setSelectedRenderingType(project.rendering_type || '3d'); // Default to 3d if not set

            // fetchRecognizedObjects(); // No longer needed
            fetchUserLibrary();
        } else if (!isOpen) {
            // Clear state when modal closes
            // setRecognizedObjects([]); // No longer needed
            setUserObjectLibrary([]);
            setCurrentImageUrl(null);
            setError(null);
            setSelectedObjectType(null); // Clear selected object type
            setSelectedReplacementsMap({});
            setSelectedViewType(null);
            setSelectedRenderingType(null);
            setSelectedColorTone(null); // Clear color tone state
        }
    }, [isOpen, project, fetchUserLibrary]); // Keep fetchUserLibrary in dependencies

    // Removed fetchRecognizedObjects function

    // --- Event Handlers ---
    const handleSelectObject = (objectType: string) => { // Parameter is now objectType (string)
        setSelectedObjectType(objectType); // Update selected object type state
    };

    const handleSelectReplacement = (replacementObject: UserObject) => {
        if (!selectedObjectType) return; // Check selected object type state
        setSelectedReplacementsMap(prevMap => ({
            ...prevMap,
            [selectedObjectType]: replacementObject // Use selected object type as key
        }));
    };

    const handleRemoveReplacement = (objectTypeToRemove: string) => { // Parameter is objectTypeToRemove (string)
        setSelectedReplacementsMap(prevMap => {
            const newMap = { ...prevMap };
            delete newMap[objectTypeToRemove]; // Use object type as key
            return newMap;
        });
    };


    const handleGenerate = async () => {
        if (!project || !currentImageUrl) {
            setError("Project or image not loaded.");
            toast.error("Project or image not loaded.");
            return;
        }
        if (!user) {
            toast.error("User not found. Please log in.");
            return;
        }

        // Get all selected replacements
        const allReplacements = Object.entries(selectedReplacementsMap)
            .filter(([_, obj]) => obj !== null)
            .map(([objectType, obj]) => ({ objectType, obj: obj! }));

        if (allReplacements.length === 0) {
            toast.error("No replacements selected");
            return;
        }

        // Show loading state and info modal immediately
        setIsLoadingGeneration(true);
        setIsInfoModalOpen(true);
        setError(null);
        let creditDeducted = false;

        try {
            // Deduct credits
            await useCredit(user.id, 5);
            creditDeducted = true;

            // Get parameters
            const viewTypeToSend = selectedViewType || project.view_type || 'frontal';
            const colorToneToSend = selectedColorTone || project.color_tone || 'palette:neutral';
            const renderingTypeToSend = selectedRenderingType || project.rendering_type || '3d';
            const styleToSend = project.style;
            const roomTypeToSend = project.room_type;

            // Get all replacement IDs
            const allReplacementIds = allReplacements.map(({ obj }) => obj.id);

            // For prompt generation, use the first selected replacement
            const firstReplacement = allReplacements[0];
            let actualObjectToReplaceDescription: string | null = null;
            let replacementObjectDescription = firstReplacement.obj.description ?? null;

            // Get description of object being replaced
            try {
                const { data: foundObjects, error: findError } = await supabase
                    .from('image_objects')
                    .select('object_name')
                    .eq('project_id', project.id)
                    .like('object_name', `${firstReplacement.objectType}%`)
                    .limit(1);

                if (findError) throw findError;
                actualObjectToReplaceDescription = foundObjects?.[0]?.object_name || firstReplacement.objectType;
            } catch (dbError) {
                console.error("Error fetching object description:", dbError);
                actualObjectToReplaceDescription = firstReplacement.objectType;
            }

            // Generate prompt
            const promptToSend = getNewGenerationPrompt(
                styleToSend,
                renderingTypeToSend,
                roomTypeToSend,
                colorToneToSend,
                viewTypeToSend,
                true, // isObjectReplacement
                actualObjectToReplaceDescription,
                replacementObjectDescription
            );

            // Call async generation
            await createProjectForAsyncGeneration({
                userId: user.id,
                originalImageUrl: currentImageUrl,
                style: styleToSend,
                roomType: roomTypeToSend,
                renderingType: renderingTypeToSend,
                colorTone: colorToneToSend,
                view: viewTypeToSend,
                prompt: promptToSend,
                inputUserObjectIds: allReplacementIds,
                model: 'gpt-image-1',
                size: '1536x1024',
                quality: 'low'
            });

            // Show success
            setIsInfoModalOpen(true);

        } catch (err) {
            console.error("Generation error:", err);
            toast.error(`Generation failed: ${err instanceof Error ? err.message : "Unknown error"}`);
            
            if (creditDeducted) {
                try {
                    await useCredit(user.id, -5);
                } catch (refundError) {
                    console.error("Credit refund failed:", refundError);
                }
            }
        } finally {
            setIsLoadingGeneration(false);
        }
    };

    // --- Filtering Logic ---
    const compatibleObjects = userObjectLibrary.filter(obj => {
        if (!selectedObjectType) return false; // Use selectedObjectType

        // Match based on the selected fixed object type (e.g., 'sofa', 'chair')
        // This assumes userObjectLibrary has an 'object_type' field matching these fixed types
        const selectedTypeLower = selectedObjectType.toLowerCase();
        const userObjectTypeLower = obj.object_type.toLowerCase();

        // Simple type matching (case-insensitive)
        return userObjectTypeLower === selectedTypeLower;
    });

    // Get the list of fixed objects for the current room type
    // Normalize the project room type key before lookup
    const normalizedRoomTypeKey = project ? project.room_type.toLowerCase().replace(/\s+/g, '-') : '';
    const currentFixedObjects = project ? roomTypeObjects[normalizedRoomTypeKey] || [] : [];

    // --- Render Logic ---
    if (!isOpen || !project) {
        return null;
    }

    // Updated getIconForObject to accept object type string
    const getIconForObject = (type: string | null): string => {
        if (!type) return 'ri-question-line';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('lamp')) return 'ri-lamp-line';
        if (lowerType.includes('sofa') || lowerType.includes('couch') || lowerType.includes('armchair')) return 'ri-sofa-line'; // Grouped sofa/armchair
        if (lowerType.includes('table') || lowerType.includes('desk') || lowerType.includes('nightstand') || lowerType.includes('counter')) return 'ri-table-line'; // Grouped table-like
        if (lowerType.includes('shelf') || lowerType.includes('shelves') || lowerType.includes('cabinet') || lowerType.includes('bookshelf') || lowerType.includes('dresser')) return 'ri-install-line'; // Grouped storage
        if (lowerType.includes('chair')) return 'ri-armchair-line'; // Specific chair icon
        if (lowerType.includes('bed')) return 'ri-hotel-bed-line';
        if (lowerType.includes('toilet')) return 'ri-women-line'; // Placeholder icon
        if (lowerType.includes('sink')) return 'ri-washbasin-line'; // Placeholder icon
        if (lowerType.includes('shower') || lowerType.includes('bathtub')) return 'ri-shower-line'; // Placeholder icon
        if (lowerType.includes('stove') || lowerType.includes('fridge')) return 'ri-fridge-line'; // Placeholder icon
        return 'ri-box-3-line'; // Default box
    };

    // Determine if generate button should be enabled
    const hasAnyReplacementSelected = Object.values(selectedReplacementsMap).some(obj => obj !== null);
    const hasParameterChanged = selectedViewType !== (project.view_type || null) ||
                               selectedRenderingType !== null ||
                               selectedColorTone !== (project.color_tone || null); // Check color tone change

    const canGenerate = !isLoadingGeneration && (
        hasAnyReplacementSelected || // Any object replacement is selected
        hasParameterChanged // Or a parameter like view/tone/render changed
    );


    return (
        <> {/* Wrap in fragment to allow sibling InfoModal */}
        <div className={`fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 ${!isOpen ? 'hidden' : ''}`}> {/* Hide main modal if not open */}
            {/* Modal container */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-full md:max-w-[95vw] lg:max-w-[90vw] h-[95vh] flex flex-col overflow-hidden">
                {/* Header: Close button back in flow */}
                <header className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0 gap-4">
                    <h1 className="text-xl md:text-2xl font-semibold text-gray-900 truncate">Modify Design: {project.room_type}</h1>
                    <div className="flex items-center gap-3 flex-shrink-0"> {/* Increased gap slightly */}
                         {/* Generate Button */}
                         <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="bg-black text-white px-4 py-2 rounded-button text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {isLoadingGeneration ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </div>
                            ) : 'Generate New Variant'}
                         </button>
                         {/* Close Button - Styled like Generate but gray */}
                         <button
                            onClick={() => {
                                console.log("Close button clicked. onClose defined?", !!onClose);
                                if (onClose) onClose();
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-button text-sm font-medium hover:bg-gray-300 transition-colors whitespace-nowrap"
                            aria-label="Close modal"
                            type="button"
                         >
                            Close
                         </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
                    {/* Left Sidebar */}
                    <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
                        {/* Replaceable Objects List */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden flex-grow flex flex-col min-h-[200px] md:min-h-0">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0 flex justify-between items-center">
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">OBJECT TYPES</h2>
                                <span className="text-xs text-gray-400">({currentFixedObjects.length} available)</span>
                            </div>
                            <div className="divide-y divide-gray-200 overflow-y-auto flex-grow">
                                {/* Display error message if fetch failed (though fetching is removed) */}
                                {error && <p className="p-4 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded m-2">{error}</p>}
                                {/* Display message if no fixed objects for the room type */}
                                {currentFixedObjects.length === 0 && !error && (
                                    <p className="p-4 text-sm text-gray-500 italic">No standard objects defined for this room type.</p>
                                )}
                                {/* Map fixed object types */}
                                {currentFixedObjects.length > 0 && currentFixedObjects.map((objectType) => (
                                    <div
                                        key={objectType} // Use object type string as key
                                        onClick={() => handleSelectObject(objectType)} // Pass object type string
                                        className={`object-item flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 ${selectedObjectType === objectType ? 'active bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`} // Check against selectedObjectType
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                            <i className={getIconForObject(objectType)}></i> {/* Get icon based on type */}
                                        </div>
                                        {/* Capitalize first letter for display */}
                                        <span className="text-gray-700 text-sm">{objectType.charAt(0).toUpperCase() + objectType.slice(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Replacements List */}
                        <div className="flex-shrink-0 border border-gray-200 rounded-lg bg-gray-50 p-3">
                             <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Replacements</h3>
                             {Object.keys(selectedReplacementsMap).filter(key => selectedReplacementsMap[key] !== null).length === 0 ? (
                                 <p className="text-xs text-gray-500 italic">No replacements selected yet.</p>
                             ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {Object.entries(selectedReplacementsMap).map(([objectType, replacement]) => { // Key is now objectType
                                        if (!replacement) return null;
                                        const displayObjectType = objectType.charAt(0).toUpperCase() + objectType.slice(1); // Capitalize
                                        return (
                                            <div key={objectType} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                     <img
                                                         src={replacement.thumbnail_url || replacement.asset_url}
                                                         alt={replacement.object_name}
                                                         className="w-8 h-8 object-contain rounded flex-shrink-0"
                                                     />
                                                     <div className="overflow-hidden">
                                                         <p className="font-medium truncate text-gray-700" title={displayObjectType}>Replace: {displayObjectType}</p>
                                                         <p className="text-gray-500 truncate" title={replacement.object_name}>With: {replacement.object_name}</p>
                                                     </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveReplacement(objectType)} // Pass objectType
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 flex-shrink-0 ml-1"
                                                    aria-label={`Remove ${replacement.object_name}`}
                                                >
                                                    <i className="ri-close-circle-line text-base"></i>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Main Preview Area */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                        {/* Image Preview */}
                        <div className="rounded-lg overflow-hidden border border-gray-200 flex-grow flex justify-center items-center bg-gray-100 relative min-h-0">
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt={`${project.room_type} Preview`} className="max-w-full max-h-full object-contain rounded-lg" />
                            ) : (
                                <div className="text-gray-400">Loading image...</div>
                            )}
                             {isLoadingGeneration && (
                                <div className="absolute inset-0 bg-white bg-opacity-70 flex flex-col justify-center items-center z-10">
                                    <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-gray-600">Generating new variant...</p>
                                </div>
                            )}
                        </div>

                        {/* Replacement Options Area */}
                        <div className="flex-shrink-0">
                             {selectedObjectType ? ( // Check selectedObjectType
                                 <>
                                     {/* Capitalize first letter for display */}
                                     <h3 className="text-sm font-medium text-gray-700 mb-2">Replace '{selectedObjectType.charAt(0).toUpperCase() + selectedObjectType.slice(1)}' with:</h3>
                                     {compatibleObjects.length === 0 && (
                                         <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">No compatible objects of type '{selectedObjectType}' found in your library. Upload objects from the main dashboard.</p>
                                     )}
                                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                         {compatibleObjects.map((obj) => {
                                             const isSelectedReplacement = selectedReplacementsMap[selectedObjectType]?.id === obj.id; // Check against selectedObjectType
                                             return (
                                                 <div
                                                     key={obj.id} // Keep using obj.id as key for user objects
                                                     onClick={() => handleSelectReplacement(obj)} // Pass the full user object
                                                     className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-150 flex flex-col items-center p-2 ${isSelectedReplacement ? 'border-primary ring-2 ring-primary/30 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                                                 >
                                                     <div className="w-full h-24 flex items-center justify-center mb-1 bg-gray-50 rounded">
                                                         <img src={obj.thumbnail_url || obj.asset_url} alt={obj.object_name} className="max-h-full max-w-full object-contain" />
                                                     </div>
                                                     <p className="text-xs text-center text-gray-600 truncate w-full px-1">{obj.object_name}</p>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </>
                             ) : (
                                 <div className="text-center text-sm text-gray-500 bg-gray-50 p-4 rounded-md">
                                    Select an object from the left list to see replacement options.
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* Bottom Controls - Spanning full width */}
                <footer className="mt-auto border-t border-gray-200 py-4 px-6 flex items-center flex-shrink-0 bg-white"> {/* Removed justify-center */}
                    {/* Dynamic Selectors - Spanning full width */}
                    <div className="grid grid-cols-5 gap-4 items-start w-full"> {/* Removed max-w-2xl */}
                         <div className="col-span-1"> {/* View Type takes 1 column */}
                            <label className="block text-xs font-medium text-gray-500 mb-1 text-center">View Type</label>
                            <ViewTypeSelector
                                value={selectedViewType || ''}
                                onChange={setSelectedViewType}
                                renderingType={selectedRenderingType}
                             />
                         </div>
                         <div className="col-span-1"> {/* Rendering Type takes 1 column */}
                             <label className="block text-xs font-medium text-gray-500 mb-1 text-center">Rendering Type</label>
                             <RenderingTypeSelector
                                value={selectedRenderingType || ''}
                                onChange={setSelectedRenderingType}
                             />
                         </div>
                         <div className="col-span-3"> {/* Color Tone takes 3 columns */}
                             <label className="block text-xs font-medium text-gray-500 mb-1 text-center">Color Tone</label>
                             <ColorToneSelector
                                selectedValue={selectedColorTone || undefined} // Pass tone state
                                onSelect={setSelectedColorTone} // Pass tone setter
                             />
                         </div>
                    </div>
                </footer>
            </div>
        </div>

        {/* Info Modal for Success */}
        <InfoModal
            isOpen={isInfoModalOpen}
            onClose={() => {
                setIsInfoModalOpen(false); // Close this info modal
                onClose(); // Close the main modification modal
                onGenerationComplete?.(); // Trigger refresh in parent
            }}
            title="Generation Started"
            message="Your new design variant is being generated. You can see the progress in your projects list. This might take a minute or two."
            // Removed buttonText prop as it's not accepted by InfoModal
        />
        </> // Close fragment
    );
};

export default ImageModificationModal;
