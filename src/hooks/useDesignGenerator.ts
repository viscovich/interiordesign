import { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { generateInteriorDesign } from '../lib/gemini';
import { uploadImage } from '../lib/storage';
import { createProject, saveDetectedObjects } from '../lib/projectsService';
import { useCredit } from '../lib/userService'; // Import useCredit
import { UserObject } from '../lib/userObjectsService'; // Added UserObject import
import toast from 'react-hot-toast';

// Helper function to generate thumbnail using Canvas
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
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
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

      // --- Thumbnail Generation and Upload ---
      let thumbnailUrl = ''; // Initialize thumbnail URL
      const timestamp = Date.now();
      const baseFileName = `${timestamp}.jpg`;
      const fullImagePath = `generated/${baseFileName}`;
      const thumbnailPath = `thumbnails/generated/${baseFileName}`;

      try {
        const thumbnailDataUrl = await generateThumbnail(imageData);
        // Upload both images in parallel for efficiency
        const [generatedImageUrlResult, thumbnailUrlResult] = await Promise.all([
          uploadImage(imageData, fullImagePath),
          uploadImage(thumbnailDataUrl, thumbnailPath)
        ]);
        thumbnailUrl = thumbnailUrlResult; // Store the thumbnail URL
        console.log('Uploaded full image:', generatedImageUrlResult);
        console.log('Uploaded thumbnail:', thumbnailUrl);
      } catch (uploadError) {
        console.error("Error during image/thumbnail upload:", uploadError);
        // Decide how to handle: proceed without thumbnail? Show error?
        // For now, let's proceed but log the error
        toast.error('Failed to generate or upload image thumbnail.', { position: 'top-center' });
        // Still upload the main image if thumbnail failed
        const generatedImageUrl = await uploadImage(imageData, fullImagePath);
        thumbnailUrl = generatedImageUrl; // Fallback: use main image URL if thumbnail fails? Or null? Let's use main for now.
      }
      // --- End Thumbnail Logic ---

      // Use the URL from the upload result (potentially just the main image if thumbnail failed)
      const generatedImageUrl = await uploadImage(imageData, fullImagePath); // This might be redundant if Promise.all succeeded, but safe fallback

      const project = await createProject(
        userId,
        uploadedImage,
        generatedImageUrl,
        selectedStyle.name,
        selectedRoomType.name,
        description,
        selectedView,
        selectedColorTone, // Pass the full string ID
        thumbnailUrl // Pass the generated thumbnail URL
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
      let errorMessage = 'Failed to generate design. Please try again later.';
      let showModal = false;
      let modalTitle = 'Generation Error';
      let modalMessage = errorMessage;
      let retryHandler: (() => void) | undefined = undefined;

      console.log('Raw error:', error); // Debug log
      if (error instanceof Error) {
        console.log('Error message:', error.message); // Debug log
        if (error.message.includes('Insufficient credits')) {
          errorMessage = 'Your credit is not enough to proceed.';
        } else if (error.message.includes('Service Unavailable') || error.message.includes('503')) {
          errorMessage = 'The design service is temporarily unavailable.';
          modalMessage = 'Our design model is currently overloaded. Please try again in a few minutes.';
          showModal = true;
          retryHandler = () => handleGenerate();
        } else if (error.message.includes('imageData=missing')) {
          console.log('Handling imageData=missing error'); // Debug log
          errorMessage = 'Model is overloaded, try later';
          modalTitle = 'Model Overloaded';
          modalMessage = 'The AI model is currently at capacity. Please try your request again later.';
          showModal = true;
          retryHandler = () => handleGenerate();
        } else if (error.message.includes('500') || error.message.includes('Failed to fetch')) {
          showModal = true;
          modalMessage = 'There was a problem connecting to our servers. Please check your internet connection and try again.';
        }
      }

      toast.dismiss(loadingToast);
      
      // First ensure loading state remains until error is fully handled
      try {
        if (showModal) {
          setErrorModal({
            isOpen: true,
            title: modalTitle,
            message: modalMessage,
            retryHandler
          });
        } else {
          toast.error(errorMessage, {
            position: 'top-center',
            duration: 5000
          });
        }
      } finally {
        setIsGenerating(false);
      }

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
    startNewProject, // Return the new function
    errorModal,
    setErrorModal
  };
}
