import { useState } from 'react';
import type { Project } from '../lib/projectsService.d';
import { ArrowLeftIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetails({ project, onBack }: ProjectDetailsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="project-details space-y-4">
      <button 
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-1" />
        Back to projects
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {['original', 'generated'].map((type) => {
          const isOriginal = type === 'original';
          const imageUrl = isOriginal ? project.original_image_url : project.generated_image_url;
          const title = isOriginal ? 'Original Design' : 'Generated Design';
          const alt = isOriginal ? 'Original design' : 'Generated design';

          return (
            <div key={type} className="relative group">
              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt={alt}
                  className="rounded-lg shadow-md w-full cursor-zoom-in"
                  onClick={() => setSelectedImage(imageUrl)}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(imageUrl, `${project.room_type}_${type}.jpg`);
                  }}
                  className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition-opacity opacity-0 group-hover:opacity-100"
                  title="Download image"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
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

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-2">Design Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Room Type</p>
            <p className="font-medium">{project.room_type}</p>
          </div>
          <div>
            <p className="text-gray-600">Style</p>
            <p className="font-medium">{project.style}</p>
          </div>
          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-medium">
              {project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
