import React, { useState } from 'react'; // Added useState
import { ImageUploader } from '../components/ImageUploader';
// import { TabbedSelector } from '../components/TabbedSelector'; // Removed
import { StyleSelector } from '../components/StyleSelector'; // Added
import { ObjectSelector } from '../components/ObjectSelector'; // Added ObjectSelector import
import { UserObject } from '../lib/userObjectsService'; // Added UserObject import
import { RoomTypeSelector } from '../components/RoomTypeSelector'; // Added
import { ColorToneSelector } from '../components/ColorToneSelector'; // Changed import
import { ViewTypeSelector } from '../components/ViewTypeSelector'; // Added import
import { RenderingTypeSelector } from '../components/RenderingTypeSelector'; // Added import
import toast from 'react-hot-toast';
import useModals from '../hooks/useModals';

interface DesignSectionProps {
  uploadedImage: string | null;
  isGenerating: boolean;
  selectedStyle: any | null;
  selectedRoomType: any | null;
  selectedColorTone: string | null; // Renamed prop
  selectedView: string | null;
  selectedRenderingType: string | null;
  onImageUpload: (file: File) => void;
  onReset: () => void;
  // Update onGenerate prop type to accept selectedObjects
  onGenerate: (selectedObjects: UserObject[]) => Promise<boolean | void>; 
  onStyleSelect: (style: any) => void;
  onRoomTypeSelect: (roomType: any) => void;
  onColorToneSelect: (tone: string) => void; // Renamed prop handler
  onViewChange: (view: string) => void;
  onRenderingTypeChange: (renderingType: string) => void;
  isAuthenticated: boolean;
  hasObjects: boolean;
  userId?: string | null;
  // Add a prop for selected objects if needed from parent, or manage locally
}

export default function DesignSection({
  uploadedImage,
  isGenerating,
  selectedStyle,
  selectedRoomType,
  selectedColorTone, // Renamed prop
  selectedView,
  selectedRenderingType,
  onImageUpload,
  onReset,
  onGenerate,
  onStyleSelect,
  onRoomTypeSelect,
  onColorToneSelect, // Renamed prop handler
  onViewChange,
  onRenderingTypeChange,
  isAuthenticated,
  userId,
}: DesignSectionProps) {
  const modals = useModals();
  // State for selected objects
  const [selectedObjects, setSelectedObjects] = useState<UserObject[]>([]);

  // Handler for object selection changes
  const handleObjectSelectionChange = (objects: UserObject[]) => {
    setSelectedObjects(objects);
    // Optional: Pass selection up if needed by parent component
  };


  return (
    <section id="design-section" className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
          <p className="text-xl text-gray-600">Upload a photo and customize your design</p>
        </div>

        {/* Main content area */}
        <div className="max-w-4xl mx-auto"> {/* Reduced max-width again */}
          {/* Two-column layout for Uploader and Core Selectors */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            {/* Left Column: Image Uploader */}
            <div className="w-full md:w-1/2">
              <ImageUploader
                uploadedImage={uploadedImage} // Pass the prop down
                onImageUpload={onImageUpload}
                onReset={onReset}
              />
            </div>

            {/* Right Column: Core Selectors (Always Visible) */}
            <div className="w-full md:w-1/2 space-y-1">
              <RenderingTypeSelector
                value={selectedRenderingType || ''}
                onChange={onRenderingTypeChange}
              />
              <ViewTypeSelector
                value={selectedView || ''}
                onChange={onViewChange}
                renderingType={selectedRenderingType} // Pass renderingType prop
              />
              {/* Moved RoomTypeSelector to be always visible */}
              <RoomTypeSelector
                onRoomTypeSelect={onRoomTypeSelect} // Corrected prop name
                selectedRoomTypeId={selectedRoomType?.id} // Corrected prop name and value
              />
            </div>
          </div>

          {/* Conditional Elements below the two-column layout */}
          {uploadedImage && (
            <div className="space-y-4"> {/* Reduced spacing */}
              {/* StyleSelector */}
              <StyleSelector
                onStyleSelect={onStyleSelect} // Corrected prop name
                selectedStyleId={selectedStyle?.id} // Corrected prop name and value
              />
              {/* ColorToneSelector */}
              <ColorToneSelector
                selectedValue={selectedColorTone || undefined} // Use renamed prop
                onSelect={onColorToneSelect} // Use renamed handler
              />
              {/* ObjectSelector */}
              <ObjectSelector 
                onSelectionChange={handleObjectSelectionChange}
                userId={isAuthenticated ? userId || null : null}
              />

              {/* Generate Button and Validation */}
              <div className="mb-2 pt-4"> {/* Added padding top */}
                {/* Updated validation check - No change needed here for objects, as they are optional */}
                {(!uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorTone || !selectedView || !selectedRenderingType) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {/* No changes needed here, just the condition above */}
                    {!uploadedImage && (
                      <span className="text-sm text-red-500">• Upload an image</span>
                    )}
                    {uploadedImage && !selectedStyle && (
                      <span className="text-sm text-red-500">• Select style</span>
                    )}
                    {uploadedImage && !selectedRoomType && (
                      <span className="text-sm text-red-500">• Select room type</span>
                    )}
                    {/* Updated validation message */}
                    {uploadedImage && !selectedColorTone && (
                      <span className="text-sm text-red-500">• Select color tone</span>
                    )}
                    {uploadedImage && !selectedView && (
                      <span className="text-sm text-red-500">• Select view</span>
                    )}
                    {uploadedImage && !selectedRenderingType && (
                      <span className="text-sm text-red-500">• Select rendering</span>
                    )}
                  </div>
                )}

                <button
                  onClick={async () => {
                    try {
                      // Pass selectedObjects to onGenerate
                      const success = await onGenerate(selectedObjects); 
                      if (success) {
                        // Scroll to projects section on success
                        document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
                      toast.error(errorMessage);
                    }
                  }}
                  // Updated disabled condition
                  disabled={isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorTone || !selectedView || !selectedRenderingType}
                  className={`
                    !rounded-button w-full py-4 text-white transition
                    ${isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorTone || !selectedView || !selectedRenderingType // Updated condition for styling
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-custom hover:bg-custom/90'
                    }
                  `}
                >
                  {isGenerating ? 'Generating...' : 'Generate Design'}
                </button>
              </div>

              {isGenerating && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 relative overflow-hidden">
                  <div
                    className="bg-custom h-1.5 rounded-full absolute top-0 left-0"
                    style={{
                      animation: 'progress 15s linear forwards'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
