import { useState } from 'react';
import type { Project } from '../lib/projectsService.d';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageComparison } from './ImageComparison';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300"
      >
        <XMarkIcon className="h-8 w-8" />
      </button>

      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{project.room_type}</h2>
              <p className="text-gray-600">{project.style}</p>
            </div>
            <div className="text-gray-500">
              {project.created_at && new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>

          {project.original_image_url && project.generated_image_url ? (
          <ImageComparison 
            originalImage={project.original_image_url}
            generatedImage={project.generated_image_url}
          />
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">Image comparison not available</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleDownload(
                project.original_image_url, 
                `${project.room_type}_original.jpg`
              )}
              disabled={!project.original_image_url}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                project.original_image_url 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Original
            </button>
            <button
              onClick={() => project.generated_image_url && handleDownload(
                project.generated_image_url, 
                `${project.room_type}_generated.jpg`
              )}
              disabled={!project.generated_image_url}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                project.generated_image_url 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Generated
            </button>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <img 
            src={selectedImage} 
            className="max-h-full max-w-full"
            alt="Expanded view" 
          />
        </div>
      )}
    </div>
  );
}
