import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onReset?: () => void;
}

export function ImageUploader({ onImageUpload, onReset }: ImageUploaderProps) {
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

  return (
    <>
      {!previewUrl ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-base font-medium text-gray-900">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
          </p>
          <p className="mt-1 text-sm text-gray-500">or click to select a file</p>
          <p className="mt-1 text-xs text-gray-400">
            Supported formats: JPEG, PNG
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Uploaded room" 
              className="w-full h-auto max-h-[250px] object-contain"
            />
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
    </>
  );
}
