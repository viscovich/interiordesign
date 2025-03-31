import React, { useCallback, useState, useEffect } from 'react';
import { ViewTypeSelector } from './ViewTypeSelector';
import { RenderingTypeSelector } from './RenderingTypeSelector';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon for the button

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onReset?: () => void;
  // Add props for view and rendering type state/handlers
  viewValue: string | null;
  renderingTypeValue: string | null;
  onViewChange: (value: string) => void;
  onRenderingTypeChange: (value: string) => void;
}

export function ImageUploader({ 
  onImageUpload, 
  onReset,
  viewValue,
  renderingTypeValue,
  onViewChange,
  onRenderingTypeChange 
}: ImageUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when file is selected
  useEffect(() => {
    if (!selectedFile) {
      return;
    }
    
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    
    // Free memory when component unmounts
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

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

  const handleReplace = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (onReset) {
      onReset();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  });

  // Remove internal state management for view and rendering type
  // const [viewType, setViewType] = useState('front');
  // const [renderingType, setRenderingType] = useState('3d');

  return (
    <div className="flex gap-4 h-[300px]">
      <div className="w-2/4 h-full flex flex-col">
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
              {selectedFile?.name} ({selectedFile ? Math.round(selectedFile.size / 1024) : 0} KB)
            </p>
          </div>
        </div>
      )}
      </div>
      <div className="w-2/4 space-y-6 h-full flex flex-col justify-center pl-4">
        {/* Pass props down to selectors */}
        <ViewTypeSelector 
          value={viewValue || ''} // Use prop value
          onChange={onViewChange} // Use prop handler
        />
        <RenderingTypeSelector
          value={renderingTypeValue || ''} // Use prop value
          onChange={onRenderingTypeChange} // Use prop handler
        />
      </div>
    </div>
  );
}
