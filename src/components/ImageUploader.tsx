import React, { useCallback, useState, useEffect } from 'react';
// Removed ViewTypeSelector and RenderingTypeSelector imports
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon for the button

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onReset?: () => void;
  uploadedImage: string | null; // Add prop to receive image URL from parent
}

export function ImageUploader({
  onImageUpload,
  onReset,
  uploadedImage // Destructure the new prop
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Effect to sync internal preview with the uploadedImage prop from parent
  useEffect(() => {
    // Only update preview from prop if it's different from the current preview
    // and if no local file is currently selected (to avoid overriding a new local selection)
    if (uploadedImage && uploadedImage !== previewUrl && !selectedFile) {
      setPreviewUrl(uploadedImage);
    } else if (!uploadedImage && !selectedFile) {
      // Clear preview if prop is null and no local file is selected
      setPreviewUrl(null);
    }
  }, [uploadedImage, selectedFile, previewUrl]); // Re-run if prop, local file, or preview changes


  // Create preview URL when a new local file is selected
  useEffect(() => {
    if (!selectedFile) {
      // If file is cleared (e.g., by handleReplace), also clear previewUrl
      // unless it's already being set by the uploadedImage prop effect
      if (!uploadedImage) {
         setPreviewUrl(null);
      }
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Free memory when component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, uploadedImage]); // Added uploadedImage dependency to avoid race condition

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
      onImageUpload(acceptedFiles[0]);
    }
  }, [onImageUpload]);

  // Function to handle using the sample image
  const handleUseSampleImage = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent opening file dialog
    try {
      const response = await fetch('/images/stanza.jpg'); // Fetch the sample image
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const fileName = 'stanza.jpg';
      const file = new File([blob], fileName, { type: blob.type });

      setSelectedFile(file); // Update local state for preview
      onImageUpload(file); // Call the prop handler
    } catch (error) {
      console.error("Error fetching or processing sample image:", error);
      // TODO: Add user-facing error handling (e.g., a toast notification)
    }
  }, [onImageUpload]); // Dependency array includes the prop function

  // Updated handleReplace to clear local state and call parent reset
  const handleReplace = () => {
    setSelectedFile(null); // Clear local file state
    setPreviewUrl(null); // Clear local preview
    if (onReset) {
      onReset(); // Call parent reset to clear uploadedImage state in the hook
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  // Removed internal state management comments

  return (
    // Reduced height
    <div className="h-[240px]">
      <div className="w-full h-full flex flex-col">
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors flex-grow flex flex-col items-center justify-center
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-base font-medium text-gray-900">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
          </p>
          {/* Sample Image Button */}
          <button
            type="button"
            onClick={handleUseSampleImage}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ImageIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Use sample image
          </button>
          {/* Text below button */}
          <p className="mt-4 text-sm text-gray-500">or click to select a file</p>
          <p className="mt-1 text-xs text-gray-400">
            Supported formats: JPEG, PNG
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden h-full flex flex-col">
          <div className="relative">
            <div className="flex-grow flex items-center justify-center bg-gray-50">
              <img
                src={previewUrl}
                alt="Uploaded room"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              onClick={handleReplace}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              title="Replace image"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-sm font-medium text-gray-700">
              Immagine caricata
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {/* Display file name only if selectedFile exists */}
              {selectedFile?.name} {selectedFile ? `(${Math.round(selectedFile.size / 1024)} KB)` : ''}
            </p>
          </div>
        </div>
      )}
      </div>
      {/* Removed the right-side div containing ViewTypeSelector and RenderingTypeSelector */}
    </div>
  );
}
