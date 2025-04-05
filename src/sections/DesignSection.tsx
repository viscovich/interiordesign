import React from 'react';
import { ImageUploader } from '../components/ImageUploader';
// import { TabbedSelector } from '../components/TabbedSelector'; // Removed
import { StyleSelector } from '../components/StyleSelector'; // Added
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
  onGenerate: () => Promise<boolean | void>;
  onStyleSelect: (style: any) => void;
  onRoomTypeSelect: (roomType: any) => void;
  onColorToneSelect: (tone: string) => void; // Renamed prop handler
  onViewChange: (view: string) => void;
  onRenderingTypeChange: (renderingType: string) => void;
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
  onRenderingTypeChange
}: DesignSectionProps) {
  const modals = useModals();

  return (
    <section id="design-section" className="py-20">
      <div className="container max-w-8xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
          <p className="text-xl text-gray-600">Upload a photo and customize your design</p>
        </div>

        {/* Main content area */}
        <div className="max-w-4xl mx-auto"> {/* Reduced max-width again */}
          {/* Two-column layout for Uploader and Sidebar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8"> 
            {/* Left Column: Image Uploader */}
            <div className="w-full md:w-1/2"> {/* Changed width back to 1/2 */}
              <ImageUploader
                onImageUpload={onImageUpload}
                onReset={onReset}
                // Removed view/rendering props
              />
            </div>

            {/* Right Column: Sidebar Selectors */}
            {uploadedImage && (
              <div className="w-full md:w-1/2 space-y-1"> {/* Changed width back to 1/2 */}
                <RenderingTypeSelector
                  value={selectedRenderingType || ''}
                  onChange={onRenderingTypeChange}
                />
                <ViewTypeSelector
                  value={selectedView || ''}
                  onChange={onViewChange}
                />
                <ColorToneSelector
                  selectedValue={selectedColorTone || undefined} // Use renamed prop
                  onSelect={onColorToneSelect} // Use renamed handler
                />
              </div>
            )}
          </div>

          {/* Elements below the two-column layout */}
          {uploadedImage && (
            <div className="space-y-4"> {/* Reduced spacing */}
              {/* Added StyleSelector */}
              <StyleSelector
                onStyleSelect={onStyleSelect} // Corrected prop name
                selectedStyleId={selectedStyle?.id} // Corrected prop name and value
              />
              {/* Added RoomTypeSelector */}
              <RoomTypeSelector
                onRoomTypeSelect={onRoomTypeSelect} // Corrected prop name
                selectedRoomTypeId={selectedRoomType?.id} // Corrected prop name and value
              />

              {/* Removed old ColorPaletteSelector */}

              <div className="mb-2 pt-4"> {/* Added padding top */}
                {/* Updated validation check */}
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
                      const success = await onGenerate();
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
