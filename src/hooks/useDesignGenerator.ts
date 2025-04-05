import { useState } from 'react';
import { generateInteriorDesign } from '../lib/gemini';
import { uploadImage } from '../lib/storage';
import { createProject, saveDetectedObjects } from '../lib/projectsService';
import toast from 'react-hot-toast';

interface UseDesignGeneratorProps {
  userId: string | undefined;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  setPendingGenerate: (pending: boolean) => void;
}

export default function useDesignGenerator({
  userId,
  setIsLoginModalOpen,
  setPendingGenerate
}: UseDesignGeneratorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, _setSelectedStyle] = useState<any | null>(null);
  const setSelectedStyle = (style: any) => {
    console.log('Updating selected style:', style);
    _setSelectedStyle(style);
  };
  const [selectedRoomType, setSelectedRoomType] = useState<any | null>(null);
  const [selectedColorTone, setSelectedColorTone] = useState<string | null>(null); // Renamed state and setter
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      const originalImageUrl = await uploadImage(
        dataUrl,
        `original/${Date.now()}_${file.name}`
      );

      setUploadedImage(originalImageUrl);
      setGeneratedImage(null);
      setDesignDescription(null);
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      toast.error('Failed to process image upload');
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
  };

  const handleGenerate = async () => {
    // Updated condition to use selectedColorTone
    if (!uploadedImage || !selectedStyle || !selectedRoomType || 
        !selectedColorTone || !selectedView || !selectedRenderingType) {
      toast.error('Please complete all design selections', {
        position: 'top-center',
        duration: 4000
      });
      return false;
    }

    const loadingToast = toast.loading('Generating your design...', {
      position: 'top-center'
    });

    if (!userId) {
      console.log('User not authenticated - opening login modal');
      setIsLoginModalOpen(true);
      setPendingGenerate(true);
      return false;
    }

    setIsGenerating(true);
    try {
      toast.dismiss(loadingToast);
      const { description, imageData, detectedObjects } = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorTone, // Pass the full string ID ('palette:name' or 'color:name')
        selectedRenderingType,
        selectedView,
        userId
      );

      const generatedImageUrl = await uploadImage(
        imageData,
        `generated/${Date.now()}.jpg`
      );

      const project = await createProject(
        userId,
        uploadedImage,
        generatedImageUrl,
        selectedStyle.name,
        selectedRoomType.name,
        description,
        selectedView,
        selectedColorTone // Pass the full string ID
      );

      if (detectedObjects && detectedObjects.length > 0) {
        await saveDetectedObjects(project.id, userId, detectedObjects);
      }

      setGeneratedImage(imageData);
      setDesignDescription(description);
      toast.success(`Generated ${selectedStyle.name} design for ${selectedRoomType.name}!`, {
        position: 'top-center',
        duration: 4000
      });
      return true;
    } catch (error: unknown) {
      console.error('Generation failed:', error);
      let errorMessage = 'Failed to generate design';
      if (error instanceof Error) {
        // Check specifically for the insufficient credits error
        if (error.message.includes('Insufficient credits')) {
          errorMessage = 'Your credit is not enough to proceed.';
        } else {
          // Use the original error message for other errors
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    uploadedImage,
    generatedImage,
    designDescription,
    isGenerating,
    selectedStyle,
    selectedRoomType,
    selectedColorTone, // Return renamed state
    selectedView,
    selectedRenderingType,
    handleImageUpload,
    resetUpload,
    handleGenerate,
    setSelectedRoomType,
    setSelectedColorTone, // Return renamed setter
    setSelectedView,
    setSelectedStyle,
    setSelectedRenderingType
  };
}
