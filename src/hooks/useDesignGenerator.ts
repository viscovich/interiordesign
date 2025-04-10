import { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { generateInteriorDesign } from '../lib/gemini';
import { uploadImage } from '../lib/storage';
import { createProject, saveDetectedObjects } from '../lib/projectsService';
import { useCredit } from '../lib/userService'; // Import useCredit
import { UserObject } from '../lib/userObjectsService'; // Added UserObject import
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
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // URL for display/generation
  const [lastUsedImageFile, setLastUsedImageFile] = useState<File | null>(null); // Store the actual File object
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Wrap handleGenerate in useCallback to ensure stable reference if passed down
  const handleGenerate = useCallback(async (selectedObjects: UserObject[] = []) => {
    // Updated condition to use selectedColorTone and fixed rendering type reference
    if (!uploadedImage || !selectedStyle || !selectedRoomType ||
        !selectedColorTone || !selectedView || !_selectedRenderingType) {
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
      // Deduct credits before calling the generation function
      await useCredit(userId, 5); // Assuming 5 credits per generation
      console.log('[handleGenerate] Credits deducted.');

      toast.dismiss(loadingToast);
      const { description, imageData, detectedObjects } = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorTone, // Pass the full string ID ('palette:name' or 'color:name')
        _selectedRenderingType, // Fixed reference
        selectedView,
        userId,
        selectedObjects // Pass selected objects
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
      return project.id;
    } catch (error: unknown) {
      console.error('Generation failed:', error);
      let errorMessage = 'Failed to generate design. Please try again later.'; // Default user-friendly message
      if (error instanceof Error) {
        // Check specifically for the insufficient credits error
        if (error.message.includes('Insufficient credits')) {
          errorMessage = 'Your credit is not enough to proceed.';
        // Check for API service unavailable errors (like 503)
        } else if (error.message.includes('Service Unavailable') || error.message.includes('503')) {
           errorMessage = 'The design service is temporarily unavailable. Please try again later.';
        }
        // Optionally, you could add more specific checks here
        // else {
        //   // Keep a more generic message for other types of errors
        //   // errorMessage = error.message; // Or keep the default
        // }
      }
      // Dismiss any loading toast before showing the error
      toast.dismiss(loadingToast);
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 5000 // Increased duration slightly
      });

      // --- Refund Credits on Failure ---
      // Check if userId exists before attempting refund
      if (userId) {
        try {
          // Assuming useCredit accepts negative values for refunds
          await useCredit(userId, -5);
          console.log('[handleGenerate] Credits refunded due to generation failure.');
          // Optionally notify the user about the refund, though the error message might suffice
          // toast.info('Credits refunded due to generation error.', { position: 'top-center' });
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError);
          // Handle refund error (e.g., log it, maybe notify admin)
          // Don't necessarily show another error to the user unless critical
        }
      }
      // ---------------------------------

      return false;
    } finally {
      setIsGenerating(false);
    }
  // Add dependencies for useCallback, fixed rendering type reference
  }, [
    uploadedImage,
    selectedStyle,
    selectedRoomType,
    selectedColorTone,
    selectedView,
    _selectedRenderingType, // Fixed reference
    userId,
    setIsLoginModalOpen,
    setPendingGenerate
  ]);

  // Function to reset state for a new project, pre-filling the last used image
  const startNewProject = useCallback(() => {
    // Reset generation results
    setGeneratedImage(null);
    setDesignDescription(null);
    setIsGenerating(false); // Ensure loading state is reset

    // DO NOT reset selections - keep the previous criteria
    // setSelectedStyle(userId ? null : defaultStyle);
    // setSelectedRoomType(userId ? null : defaultRoomType);
    // setSelectedColorTone(userId ? null : 'palette:neutrals');
    // setSelectedView(userId ? null : 'frontal');
    // _setSelectedRenderingType(userId ? null : '3d');

    // Ensure the last uploaded image is still displayed
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
    } else {
      setUploadedImage(null); // Clear image if no last used image exists
    }
  // Add dependencies for useCallback
  }, [userId, lastUsedImageFile]); // Include lastUsedImageFile

  return {
    uploadedImage,
    generatedImage,
    designDescription,
    isGenerating,
    selectedStyle,
    selectedRoomType,
    selectedColorTone, // Return renamed state
    selectedView,
    selectedRenderingType: _selectedRenderingType, // Fixed reference in return object
    handleImageUpload,
    resetUpload,
    handleGenerate,
    setSelectedRoomType,
    setSelectedColorTone, // Return renamed setter
    setSelectedView,
    setSelectedStyle,
    setSelectedRenderingType: updateRenderingType, // Return the custom setter
    startNewProject // Return the new function
  };
}
