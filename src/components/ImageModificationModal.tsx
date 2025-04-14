import React, { useState, useEffect, useCallback } from 'react';
import { Project, ImageObject, UserObject } from '../lib/projectsService.d';
import {
    getImageObjects,
    getUserObjects,
    regenerateImageWithSubstitution,
    createProject,
    saveDetectedObjects
} from '../lib/projectsService';
import { uploadImage } from '../lib/storage'; // Import uploadImage
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';
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

// Helper function to generate thumbnail using Canvas (Copied from useDesignGenerator)
const generateThumbnail = (
  imageDataUrl: string,
  targetWidth: number = 400, // Increased target width to 400px
  quality: number = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const aspectRatio = img.height / img.width;
      const targetHeight = targetWidth * aspectRatio;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', quality)); // Use JPEG for smaller size
    };
    img.onerror = (error) => {
      console.error('Error loading image for thumbnail generation:', error);
      reject(error);
    };
    img.src = imageDataUrl;
  });
};


const ImageModificationModal: React.FC<ImageModificationModalProps> = ({ isOpen, onClose, project, onGenerationComplete }) => {
    const { user } = useAuth();
    const [recognizedObjects, setRecognizedObjects] = useState<ImageObject[]>([]);
    const [userObjectLibrary, setUserObjectLibrary] = useState<UserObject[]>([]);
    const [selectedObjectName, setSelectedObjectName] = useState<string | null>(null); // Which original object's options are shown
    const [selectedReplacementsMap, setSelectedReplacementsMap] = useState<Record<string, UserObject | null>>({}); // Map: original_object_name -> replacement_object
    const [isLoadingGeneration, setIsLoadingGeneration] = useState(false);
    const [error, setError] = useState<string | null>(null); // For fetch errors primarily
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    // State for dynamic selectors
    const [selectedViewType, setSelectedViewType] = useState<string | null>(null);
    const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null);
    const [selectedColorTone, setSelectedColorTone] = useState<string | null>(null); // Using ColorTone state

    // --- Data Fetching and State Reset ---
    useEffect(() => {
        if (isOpen && project) {
            setCurrentImageUrl(project.generated_image_url || project.original_image_url);
            setSelectedObjectName(null);
            setSelectedReplacementsMap({}); // Reset the map
            setError(null); // Clear errors on open
            setIsLoadingGeneration(false);
            // Initialize selectors with project values or defaults
            setSelectedViewType(project.view_type || null);
            setSelectedColorTone(project.color_tone || null); // Reset color tone
            setSelectedRenderingType(null); // Reset rendering type choice

            fetchRecognizedObjects(); // Call fetch
            fetchUserLibrary();
        } else if (!isOpen) {
            // Clear state when modal closes
            setRecognizedObjects([]);
            setUserObjectLibrary([]);
            setCurrentImageUrl(null);
            setError(null);
            setSelectedObjectName(null);
            setSelectedReplacementsMap({});
            setSelectedViewType(null);
            setSelectedRenderingType(null);
            setSelectedColorTone(null); // Clear color tone state
        }
    }, [isOpen, project]); // Dependency array includes isOpen and project

    const fetchRecognizedObjects = useCallback(async () => {
        if (!project || !user) return; // Guard clause
        console.log(`Fetching recognized objects for project ID: ${project.id}`);
        setError(null); // Clear previous errors before fetching
        try {
            const objects = await getImageObjects(project.id);
            console.log("Fetched recognized objects:", objects);
            setRecognizedObjects(objects);
            if (objects.length === 0) {
                console.log("getImageObjects returned an empty array.");
            }
        } catch (err) {
            console.error("Error fetching recognized objects:", err);
            const fetchErrorMsg = err instanceof Error ? err.message : "Unknown error";
            setError(`Failed to load objects: ${fetchErrorMsg}`); // Set specific error message in state
            toast.error(`Failed to load objects: ${fetchErrorMsg}`);
        }
    }, [project, user]); // Dependencies for useCallback

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

    // --- Event Handlers ---
    const handleSelectObject = (objectName: string) => {
        setSelectedObjectName(objectName);
    };

    const handleSelectReplacement = (replacementObject: UserObject) => {
        if (!selectedObjectName) return;
        setSelectedReplacementsMap(prevMap => ({
            ...prevMap,
            [selectedObjectName]: replacementObject
        }));
    };

    const handleRemoveReplacement = (originalObjectName: string) => {
        setSelectedReplacementsMap(prevMap => {
            const newMap = { ...prevMap };
            delete newMap[originalObjectName];
            return newMap;
        });
    };


    const handleGenerate = async () => {
        if (!project || !currentImageUrl) {
            setError("Project or image not loaded.");
            toast.error("Project or image not loaded.");
            return;
        }

        // Determine what to send for generation
        const activeReplacementObject = selectedObjectName ? selectedReplacementsMap[selectedObjectName] : null;
        const isObjectReplacement = !!(selectedObjectName && activeReplacementObject);

        setIsLoadingGeneration(true);
        setError(null); // Clear errors before generation
        try {
            const viewTypeToSend = selectedViewType || project.view_type;
            const colorToneToSend = selectedColorTone || project.color_tone; // Use selectedColorTone state
            const renderingTypeToSend = selectedRenderingType;

            console.log("Generating with:", {
                viewTypeToSend,
                colorToneToSend, // Sending selected or original tone
                renderingTypeToSend,
                isObjectReplacement,
                selectedObjectName: isObjectReplacement ? selectedObjectName : null,
                activeReplacementObjectId: activeReplacementObject?.id,
            });

            const regenerationResult = await regenerateImageWithSubstitution(
                project,
                currentImageUrl,
                isObjectReplacement ? activeReplacementObject : null,
                isObjectReplacement ? selectedObjectName : null,
                viewTypeToSend,
                renderingTypeToSend,
                colorToneToSend // Sending selected or original tone
            );

            const { imageData: newImageDataUrl, detectedObjects } = regenerationResult; // Renamed to newImageDataUrl

            // --- Thumbnail Generation and Upload ---
            let generatedImageUrl = ''; // Initialize URLs
            let thumbnailUrl = '';
            const timestamp = Date.now();
            const baseFileName = `${timestamp}_variant.jpg`; // Indicate it's a variant
            const fullImagePath = `generated/${baseFileName}`;
            const thumbnailPath = `thumbnails/generated/${baseFileName}`;

            try {
                const thumbnailDataUrl = await generateThumbnail(newImageDataUrl);
                // Upload both images in parallel
                const [generatedImageUrlResult, thumbnailUrlResult] = await Promise.all([
                    uploadImage(newImageDataUrl, fullImagePath),
                    uploadImage(thumbnailDataUrl, thumbnailPath)
                ]);
                generatedImageUrl = generatedImageUrlResult; // Store the full image URL
                thumbnailUrl = thumbnailUrlResult; // Store the thumbnail URL
                console.log('Uploaded variant full image:', generatedImageUrl);
                console.log('Uploaded variant thumbnail:', thumbnailUrl);
            } catch (uploadError) {
                console.error("Error during variant image/thumbnail upload:", uploadError);
                toast.error('Failed to upload variant image or thumbnail.', { position: 'top-center' });
                // Attempt to upload just the main image as a fallback
                try {
                    generatedImageUrl = await uploadImage(newImageDataUrl, fullImagePath);
                    thumbnailUrl = generatedImageUrl; // Fallback: use main image URL if thumbnail fails
                    console.log('Fallback: Uploaded variant full image only:', generatedImageUrl);
                } catch (fallbackUploadError) {
                     console.error("Fallback image upload also failed:", fallbackUploadError);
                     throw new Error("Failed to upload generated image."); // Throw if even fallback fails
                }
            }
            // --- End Thumbnail Logic ---


            // Create new project entry using the uploaded URLs
            const newProject = await createProject(
                project.user_id,
                project.original_image_url, // Keep original source project's image
                generatedImageUrl,          // Use the *uploaded* full image URL
                project.style,
                project.room_type,
                project.description,
                viewTypeToSend,
                colorToneToSend,            // Save the used tone
                thumbnailUrl,               // Pass the *uploaded* thumbnail URL
                currentImageUrl             // Pass the parent image URL for the new field
            );

            // Save detected objects for the new project
            if (newProject && detectedObjects && detectedObjects.length > 0) {
                await saveDetectedObjects(newProject.id, newProject.user_id, detectedObjects);
                console.log(`Saved ${detectedObjects.length} objects for new project ${newProject.id}`);
            } else {
                console.log(`No objects detected or project creation failed, skipping object save for new project.`);
            }

            toast.success(`New variant generated and saved!`);
            onClose(); // Close modal on success
            onGenerationComplete?.(); // Trigger refresh in parent
        } catch (err) {
            console.error("Error generating new image:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to generate new image.";
            setError(errorMessage); // Show generation error
            toast.error(`Generation failed: ${errorMessage}`);
        } finally {
            setIsLoadingGeneration(false);
        }
    };

    // --- Filtering Logic ---
    const compatibleObjects = userObjectLibrary.filter(obj => {
        if (!selectedObjectName) return false;
        const nameParts = selectedObjectName.toLowerCase().split(' ');
        const keyword = nameParts[nameParts.length - 1];
        const keywordSingular = keyword.endsWith('s') ? keyword.slice(0, -1) : keyword;
        const typeMatch = obj.object_type.toLowerCase() === keyword || obj.object_type.toLowerCase() === keywordSingular;
        const nameMatch = obj.object_name.toLowerCase().includes(keyword) || obj.object_name.toLowerCase().includes(keywordSingular);
        return typeMatch || nameMatch;
    });

    // --- Render Logic ---
    if (!isOpen || !project) {
        return null;
    }

    const getIconForObject = (name: string | null): string => {
        if (!name) return 'ri-question-line';
        const lowerName = name.toLowerCase();
        if (lowerName.includes('lamp')) return 'ri-lamp-line';
        if (lowerName.includes('sofa') || lowerName.includes('couch')) return 'ri-sofa-line';
        if (lowerName.includes('table')) return 'ri-table-line';
        if (lowerName.includes('shelf') || lowerName.includes('shelves')) return 'ri-install-line';
        if (lowerName.includes('cushion') || lowerName.includes('pillow')) return 'ri-layout-grid-line';
        return 'ri-box-3-line';
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
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
                                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">REPLACEABLE OBJECTS</h2>
                                <span className="text-xs text-gray-400">({recognizedObjects.length} found)</span>
                            </div>
                            <div className="divide-y divide-gray-200 overflow-y-auto flex-grow">
                                {/* Display error message if fetch failed */}
                                {error && <p className="p-4 text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded m-2">{error}</p>}
                                {/* Display message if no objects and no error */}
                                {recognizedObjects.length === 0 && !error && (
                                    <p className="p-4 text-sm text-gray-500 italic">No replaceable objects identified.</p>
                                )}
                                {/* Map objects if available */}
                                {recognizedObjects.length > 0 && recognizedObjects.map((obj) => (
                                    <div
                                        key={obj.id}
                                        onClick={() => handleSelectObject(obj.object_name)}
                                        className={`object-item flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 ${selectedObjectName === obj.object_name ? 'active bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                                    >
                                        <div className="w-6 h-6 flex items-center justify-center mr-3 text-gray-500">
                                            <i className={getIconForObject(obj.object_name)}></i>
                                        </div>
                                        <span className="text-gray-700 text-sm">{obj.object_name}</span>
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
                                    {Object.entries(selectedReplacementsMap).map(([originalName, replacement]) => {
                                        if (!replacement) return null;
                                        return (
                                            <div key={originalName} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                     <img
                                                         src={replacement.thumbnail_url || replacement.asset_url}
                                                         alt={replacement.object_name}
                                                         className="w-8 h-8 object-contain rounded flex-shrink-0"
                                                     />
                                                     <div className="overflow-hidden">
                                                         <p className="font-medium truncate text-gray-700" title={originalName}>Replace: {originalName}</p>
                                                         <p className="text-gray-500 truncate" title={replacement.object_name}>With: {replacement.object_name}</p>
                                                     </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveReplacement(originalName)}
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
                             {selectedObjectName ? (
                                 <>
                                     <h3 className="text-sm font-medium text-gray-700 mb-2">Replace '{selectedObjectName}' with:</h3>
                                     {compatibleObjects.length === 0 && (
                                         <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">No compatible objects found in your library for '{selectedObjectName}'. Upload objects from the main dashboard.</p>
                                     )}
                                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                         {compatibleObjects.map((obj) => {
                                             const isSelectedReplacement = selectedReplacementsMap[selectedObjectName]?.id === obj.id;
                                             return (
                                                 <div
                                                     key={obj.id}
                                                     onClick={() => handleSelectReplacement(obj)}
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
    );
};

export default ImageModificationModal;
