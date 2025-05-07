import { useState, useCallback } from 'react';
import { getGenerationPrompt } from '../lib/gemini'; // Import prompt generator
import { uploadImage } from '../lib/storage';
// Import the NEW service function
import { createProjectForAsyncGeneration } from '../lib/projectsService';
import { useCredit } from '../lib/userService';
import { UserObject } from '../lib/userObjectsService';
import toast from 'react-hot-toast'; // Keep toast for errors

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
  onAuthRequired: () => void; // Changed prop name
  setPendingGenerate: (pending: boolean) => void;
}

export default function useDesignGenerator({
  userId,
  onAuthRequired, // Changed prop name
  setPendingGenerate
}: UseDesignGeneratorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // URL for display/generation
  const [lastUsedImageFile, setLastUsedImageFile] = useState<File | null>(null); // Store the actual File object
  // State for generated image/description is less relevant now,
  // as results come asynchronously. We might need state to track pending projects.
  // const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Still useful for button state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false); // State for the info modal
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
  const [selectedColorToneState, _setSelectedColorToneState] = useState<string>(() => {
    // Initialize with empty string for logged-in users, default palette for others
    return userId ? '' : 'palette:neutrals';
  });

  const setSelectedColorTone = useCallback((tone: string | ((prevState: string) => string)) => {
    if (typeof tone === 'function') {
      // If a function is passed, it's likely a state updater function.
      // We should call it to get the actual string value.
      // However, our state expects a direct string.
      // This scenario indicates a potential misuse from the calling component.
      // For now, we'll log an error and set to empty string or handle as appropriate.
      console.error("setSelectedColorTone received a function. It should receive a string value. Setting to empty string.");
      _setSelectedColorToneState(''); // Or handle more gracefully depending on desired behavior
    } else {
      _setSelectedColorToneState(tone);
    }
  }, []);
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
          // Update state with the final storage URL. This is crucial so that
          // handleGenerate uses the correct URL.
          setUploadedImage(storageUrl); // *** Uncommented this line ***
          console.log('Image uploaded to storage and state updated:', storageUrl);
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
  const handleGenerate = useCallback(async (selectedObjects: UserObject[] = []): Promise<string | undefined> => { // Add return type
    // --- 1. Input Validation ---
    if (!uploadedImage || !selectedStyle || !selectedRoomType ||
        !selectedColorToneState || !selectedView || !_selectedRenderingType) { // Use selectedColorToneState
      toast.error('Completa tutte le selezioni del design', {
        position: 'top-center',
        duration: 4000
      });
      return;
    }

    // --- 2. Authentication ---
    if (!userId) {
      console.log('User not authenticated - saving state and triggering auth');
      // Gather current state
      const currentState = {
        uploadedImage,
        selectedStyle,
        selectedRoomType,
        selectedColorTone: selectedColorToneState, // Use selectedColorToneState
        selectedView,
        selectedRenderingType: _selectedRenderingType,
        // Consider if lastUsedImageFile needs saving/restoring
      };
      // Save state to sessionStorage
      try {
        sessionStorage.setItem('pendingDesignState', JSON.stringify(currentState));
        console.log('Pending design state saved:', currentState);
      } catch (e) {
        console.error("Error saving state to sessionStorage:", e);
        toast.error("Could not save your selections. Please try logging in first.");
        // Don't proceed if saving failed
        return;
      }
      // Trigger the auth flow (which should open Register modal)
      onAuthRequired();
      setPendingGenerate(true);
      return; // Stop generation process here
    }

    // Show the info modal IMMEDIATELY
    setIsInfoModalOpen(true);

    // REMOVED toast.success call

    try {
      // Deduct credits
      await useCredit(userId, 5);
      
      // Generate prompt
      const prompt = getGenerationPrompt(
        _selectedRenderingType,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorToneState, // Use selectedColorToneState
        selectedView,
        selectedObjects.length > 0
      );

      // Create async generation and store the returned ID
      const projectId = await createProjectForAsyncGeneration({
        userId,
        originalImageUrl: uploadedImage,
        style: selectedStyle.name,
        roomType: selectedRoomType.name,
            renderingType: _selectedRenderingType,
            colorTone: typeof selectedColorToneState === 'function' ? '' : selectedColorToneState, // Use selectedColorToneState
            view: selectedView,
        prompt,
        inputUserObjectIds: selectedObjects.map(obj => obj.id),
        model: 'gpt-image-1', // Updated to correct model name
        size: '1536x1024',
        quality: 'low'
      });

      // Return the created project ID (modal is already open)
      return projectId;

    } catch (error) {
      console.error('Initiation error:', error);
      
      // First, check if this might be a transient network error
      const isNetworkError = error instanceof Error && (
        error.message.includes('Network') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('timeout')
      );

      if (isNetworkError) {
        // Wait 2 seconds before showing error to allow for network recovery
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try one automatic retry before showing error
        try {
          console.log('Attempting automatic retry...');
          const projectId = await createProjectForAsyncGeneration({
            userId,
            originalImageUrl: uploadedImage,
            style: selectedStyle.name,
            roomType: selectedRoomType.name,
            renderingType: _selectedRenderingType,
            colorTone: typeof selectedColorToneState === 'function' ? '' : selectedColorToneState, // Use selectedColorToneState
            view: selectedView,
            prompt,
            inputUserObjectIds: selectedObjects.map(obj => obj.id),
            model: 'gpt-image-1',
            size: '1536x1024',
            quality: 'low'
          });
          return projectId;
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          error = retryError; // Fall through to show error
        }
      }

      let errorMessage = 'Errore sconosciuto';
      if (error instanceof Error) {
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (typeof error.message === 'function') {
          // If error.message is a function, it might be an i18n-style t() function.
          // Try to call it, or fall back to a generic message.
          try {
            const potentialMessage = (error.message as any)(); // Call the function
            if (typeof potentialMessage === 'string') {
              errorMessage = potentialMessage;
            } else {
              console.warn('error.message function did not return a string:', potentialMessage);
            }
          } catch (e) {
            console.warn('Failed to execute error.message function:', e);
          }
        } else {
          // If error.message is neither string nor function, log it and use default
          console.warn('error.message was not a string or function:', error.message);
        }
      }

      // Check if this is the specific error we want to handle differently
      if (typeof errorMessage === 'string' && errorMessage.includes('Failed to invoke generation function')) {
        console.error('Function invocation failed (logged only):', errorMessage);
        // Optionally, still attempt refund if applicable, but don't show modal for this specific error
        if (userId) { // Ensure userId is available for credit refund
          try {
            await useCredit(userId, -5); // Attempt refund
            console.log('Credit refunded due to function invocation failure.');
          } catch (refundError) {
            console.error('Refund failed after function invocation error:', refundError);
          }
        }
        // Do not set error modal for this specific case, allow the async process to potentially recover
        // or fail more definitively later (e.g., project status remains 'pending' or becomes 'failed' by edge function)
      } else {
        // For all other errors, show the modal
        setErrorModal({
          isOpen: true,
          title: 'Errore',
          message: errorMessage,
          retryHandler: () => handleGenerate(selectedObjects)
        });
        
        // Attempt refund if error occurred after credit deduction
        if (userId) { // Ensure userId is available
          try {
            await useCredit(userId, -5);
          } catch (refundError) {
            console.error('Refund failed:', refundError);
          }
        }
      }
      return undefined;
    }
  }, [
    uploadedImage,
    selectedStyle, // Keep dependencies
    selectedRoomType, // Keep dependencies
    selectedColorToneState, 
    selectedView, // Keep dependencies
    _selectedRenderingType, // Keep dependencies
    userId, // Keep dependencies
    onAuthRequired, // Use the new prop in dependencies
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
    selectedColorTone: selectedColorToneState, // Return the state variable
    selectedView, // Keep
    selectedRenderingType: _selectedRenderingType, // Keep
    isInfoModalOpen, // Add info modal state
    handleImageUpload, // Keep
    resetUpload, // Keep
    handleGenerate, // Keep (updated version)
    setSelectedRoomType, // Keep
    setSelectedColorTone, // Keep, now it's the wrapped version
    setSelectedView, // Keep
    setSelectedStyle, // Keep
    setSelectedRenderingType: updateRenderingType, // Keep
    startNewProject, // Keep
    errorModal, // Keep
    setErrorModal, // Keep
    setIsInfoModalOpen, // Add info modal setter
    setUploadedImage // Expose setter for state restoration
  };
}
