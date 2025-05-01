import { useState, useCallback } from 'react';
import { getGenerationPrompt } from '../lib/gemini'; // Import prompt generator
import { uploadImage } from '../lib/storage';
// Import the NEW service function (we'll create it next)
import { createProjectForAsyncGeneration } from '../lib/projectsService';
import { useCredit } from '../lib/userService';
import { UserObject } from '../lib/userObjectsService';
import toast from 'react-hot-toast';

// REMOVED Thumbnail Generation Helper - This will move to the Edge Function

/*
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
});
};
*/

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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // URL for display/generation
  const [lastUsedImageFile, setLastUsedImageFile] = useState<File | null>(null); // Store the actual File object
  // State for generated image/description is less relevant now,
  // as results come asynchronously. We might need state to track pending projects.
  // const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Still useful for button state
  const [errorModal, setErrorModal] = useState({
    isOpen: false, // Keep for immediate errors (credits, initial DB insert)
    title: '',
    message: '',
    retryHandler: undefined as (() => void) | undefined
  });

  // Default style object for Modern
  const defaultStyle = {
    id: 'modern',
    name: 'Modern',
    image: '/images/selectors/styles/modern.jpg',
    description: 'Clean lines, minimal decoration, and functional furniture',
    rooms: ['Living Room', 'Bedroom', 'Office']
  };

  // Default room type object for Living Room
  const defaultRoomType = {
    id: 'living-room',
    name: 'Living Room',
    image: '/images/selectors/room-types/living-room.jpg'
  };

  const [selectedStyle, _setSelectedStyle] = useState<any | null>(userId ? null : defaultStyle);
  const setSelectedStyle = (style: any) => {
    console.log('Updating selected style:', style);
    _setSelectedStyle(style);
  };
  const [selectedRoomType, setSelectedRoomType] = useState<any | null>(userId ? null : defaultRoomType);
  const [selectedColorTone, setSelectedColorTone] = useState<string | null>(userId ? null : 'palette:neutrals');
  const [selectedView, setSelectedView] = useState<string | null>(userId ? null : 'frontal');
  const [_selectedRenderingType, _setSelectedRenderingType] = useState<string | null>(userId ? null : '3d'); // Renamed state and setter

  // Custom setter for Rendering Type to enforce View Type for 2D
  const updateRenderingType = (renderingType: string | null) => {
    _setSelectedRenderingType(renderingType);
    if (renderingType === '2d') {
      setSelectedView('top'); // Force 'Top View' when '2D Plan' is selected (Corrected value)
    }
  };

  const handleImageUpload = async (file: File) => {
    setLastUsedImageFile(file); // Store the file object
    // setGeneratedImage(null); // REMOVED - State no longer exists
    // setDesignDescription(null); // REMOVED - State no longer exists

    // 1. Generate local data URL for immediate preview
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // 2. Set state immediately with data URL to show selectors
      setUploadedImage(dataUrl);

      // 3. Upload to storage in the background (no need to await here for UI update)
      uploadImage(dataUrl, `original/${Date.now()}_${file.name}`)
        .then(storageUrl => {
          // Optional: Update state again with the final storage URL if needed elsewhere,
          // but the UI update already happened.
          // setUploadedImage(storageUrl); // Uncomment if storage URL is strictly needed later
          console.log('Image uploaded to storage:', storageUrl);
        })
        .catch(error => {
          console.error('Error uploading image to storage:', error);
          toast.error('Failed to save image to storage');
          // Optionally revert uploadedImage state or handle error
          // setUploadedImage(null); // Revert if upload fails?
        });
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast.error('Failed to read image file');
      setUploadedImage(null); // Clear image state on read error
    };
  };


  const resetUpload = () => {
    setUploadedImage(null);
  };

  // Wrap handleGenerate in useCallback
  const handleGenerate = useCallback(async (selectedObjects: UserObject[] = []) => {
    // --- 1. Input Validation ---
    if (!uploadedImage || !selectedStyle || !selectedRoomType ||
        !selectedColorTone || !selectedView || !_selectedRenderingType) {
      toast.error('Completa tutte le selezioni del design', {
        position: 'top-center',
        duration: 4000
      });
      return;
    }

    // --- 2. Authentication ---
    if (!userId) {
      console.log('User not authenticated - opening login modal');
      setIsLoginModalOpen(true);
      setPendingGenerate(true);
      return;
    }

    // Show brief confirmation (no loading state)
    toast.success('Generazione avviata! Troverai il progetto nella lista.', {
      position: 'top-center',
      duration: 3000
    });

    try {
      // Deduct credits
      await useCredit(userId, 5);
      
      // Generate prompt
      const prompt = getGenerationPrompt(
        _selectedRenderingType,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorTone,
        selectedView,
        selectedObjects.length > 0
      );

      // Create async generation
      await createProjectForAsyncGeneration({
        userId,
        originalImageUrl: uploadedImage,
        style: selectedStyle.name,
        roomType: selectedRoomType.name,
        renderingType: _selectedRenderingType,
        colorTone: selectedColorTone,
        view: selectedView,
        prompt,
        inputUserObjectIds: selectedObjects.map(obj => obj.id),
        model: 'gpt-image-1', // Updated to correct model name
        size: '1024x1024',
        quality: 'standard'
      });

    } catch (error) {
      console.error('Initiation error:', error);
      setErrorModal({
        isOpen: true,
        title: 'Errore',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
        retryHandler: () => handleGenerate(selectedObjects)
      });
      
      // Attempt refund if error occurred after credit deduction
      try {
        await useCredit(userId, -5);
      } catch (refundError) {
        console.error('Refund failed:', refundError);
      }
    }
  }, [
    uploadedImage,
    selectedStyle, // Keep dependencies
    selectedRoomType, // Keep dependencies
    selectedColorTone, // Keep dependencies
    selectedView, // Keep dependencies
    _selectedRenderingType, // Keep dependencies
    userId, // Keep dependencies
    setIsLoginModalOpen, // Keep dependencies
    setPendingGenerate, // Keep dependencies
    // Add any other state variables used inside handleGenerate
  ]);

  // Function to reset state for a new project, pre-filling the last used image
  const startNewProject = useCallback(() => {
    // Reset generation results (less relevant now)
    // setGeneratedImage(null);
    // setDesignDescription(null);
    setIsGenerating(false); // Ensure loading state is reset

    // Keep previous selections (as per original logic)
    if (lastUsedImageFile) {
      // Convert File back to data URL to display in ImageUploader
      const reader = new FileReader();
      reader.readAsDataURL(lastUsedImageFile);
      reader.onload = () => {
        setUploadedImage(reader.result as string); // Set the URL state
      };
      reader.onerror = () => {
        console.error("Error reading last used image file:", reader.error);
        setUploadedImage(null); // Fallback: clear image if reading fails
        setLastUsedImageFile(null); // Clear the stored file too
      };
      setUploadedImage(null); // Clear image if no last used image exists
    }
  }, [userId, lastUsedImageFile]); // Keep dependencies

  return {
    uploadedImage,
    // generatedImage, // Remove - result is async
    // designDescription, // Remove - result is async
    isGenerating, // Keep
    selectedStyle, // Keep
    selectedRoomType, // Keep
    selectedColorTone, // Keep
    selectedView, // Keep
    selectedRenderingType: _selectedRenderingType, // Keep
    handleImageUpload, // Keep
    resetUpload, // Keep
    handleGenerate, // Keep (updated version)
    setSelectedRoomType, // Keep
    setSelectedColorTone, // Keep
    setSelectedView, // Keep
    setSelectedStyle, // Keep
    setSelectedRenderingType: updateRenderingType, // Keep
    startNewProject, // Keep
    errorModal, // Keep
    setErrorModal // Keep
  };
}
