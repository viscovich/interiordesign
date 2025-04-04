import React from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { TabbedSelector } from '../components/TabbedSelector';
import { ColorPaletteSelector } from '../components/ColorPaletteSelector';
import toast from 'react-hot-toast';
import useModals from '../hooks/useModals';

interface DesignSectionProps {
  uploadedImage: string | null;
  isGenerating: boolean;
  selectedStyle: any | null;
  selectedRoomType: any | null;
  selectedColorPalette: any | null;
  selectedView: string | null;
  selectedRenderingType: string | null;
  onImageUpload: (file: File) => void;
  onReset: () => void;
  onGenerate: () => Promise<boolean | void>;
  onStyleSelect: (style: any) => void;
  onRoomTypeSelect: (roomType: any) => void;
  onColorPaletteSelect: (palette: any) => void;
  onViewChange: (view: string) => void;
  onRenderingTypeChange: (renderingType: string) => void;
}

export default function DesignSection({
  uploadedImage,
  isGenerating,
  selectedStyle,
  selectedRoomType,
  selectedColorPalette,
  selectedView,
  selectedRenderingType,
  onImageUpload,
  onReset,
  onGenerate,
  onStyleSelect,
  onRoomTypeSelect,
  onColorPaletteSelect,
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

        <div className="max-w-5xl mx-auto">
          <ImageUploader
            onImageUpload={onImageUpload}
            onReset={onReset}
            viewValue={selectedView}
            renderingTypeValue={selectedRenderingType}
            onViewChange={onViewChange}
            onRenderingTypeChange={onRenderingTypeChange}
          />

          {uploadedImage && (
            <div className="space-y-8 mt-8">
              <TabbedSelector
                styles={{
                  onStyleSelect: (style) => {
                  console.log('Style selected:', style);
                  onStyleSelect(style);
                },
                  selectedStyleId: selectedStyle?.id
                }}
                roomTypes={{
                  onRoomTypeSelect: onRoomTypeSelect,
                  selectedRoomTypeId: selectedRoomType?.id
                }}
              />

              <ColorPaletteSelector
                onPaletteSelect={onColorPaletteSelect}
                selectedPaletteId={selectedColorPalette?.id}
              />

              <div className="mb-2">
                {(!uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType) && (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {!uploadedImage && (
                      <span className="text-sm text-red-500">• Upload an image</span>
                    )}
                    {uploadedImage && !selectedStyle && (
                      <span className="text-sm text-red-500">• Select style</span>
                    )}
                    {uploadedImage && !selectedRoomType && (
                      <span className="text-sm text-red-500">• Select room type</span>
                    )}
                    {uploadedImage && !selectedColorPalette && (
                      <span className="text-sm text-red-500">• Select color palette</span>
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
                      await onGenerate();
                    } catch (error: unknown) {
                      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
                      toast.error(errorMessage);
                    }
                  }}
                  disabled={isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType}
                  className={`
                    !rounded-button w-full py-4 text-white transition
                    ${isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType
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
