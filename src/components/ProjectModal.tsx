import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Project } from '../lib/projectsService.d';
import { ArrowDownTrayIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ImageComparison } from './ImageComparison';
import { motion, AnimatePresence } from 'framer-motion';

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

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>

          <motion.div
            key="modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            // Main container is flex-col, handles max-height and overflow for the description
            className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col"
          >
            {/* Top Row: Title/Date + Buttons */}
            <div className="flex justify-between items-start p-8 flex-shrink-0">
              {/* Left side: Title/Style/Date */}
              <div className="mb-0"> {/* Removed mb-6 */}
                <h1 className="text-2xl font-bold text-gray-900">{project.room_type}</h1>
                  {/* Changed p to h2 */}
                  <h2 className="text-base text-gray-500">{project.style}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {project.created_at &&
                      new Date(project.created_at).toLocaleDateString()}
                  </p>
              </div>
              {/* Right side: Download Buttons */}
              <div className="flex justify-end gap-3 flex-wrap">
                <button
                  onClick={() =>
                      handleDownload(
                        project.original_image_url,
                        `${project.room_type}_original.jpg`
                      )
                    }
                    disabled={!project.original_image_url}
                    // Updated styling: bg-black, text-white, rounded-lg
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      project.original_image_url
                        ? 'bg-black hover:bg-gray-800 text-white' // Adjusted hover
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Original
                  </button>
                  <button
                    onClick={() =>
                      project.generated_image_url &&
                      handleDownload(
                        project.generated_image_url,
                        `${project.room_type}_generated.jpg`
                      )
                    }
                    disabled={!project.generated_image_url}
                    // Updated styling: bg-black, text-white, rounded-lg
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      project.generated_image_url
                        ? 'bg-black hover:bg-gray-800 text-white' // Adjusted hover and color
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Generated
                  </button>
                </div>

            </div>

            {/* Image Section */}
            <div className="px-8 mb-4 flex-shrink-0">
              {project.original_image_url && project.generated_image_url ? (
                <div className="overflow-hidden">
                  <ImageComparison
                    originalImage={project.original_image_url}
                      generatedImage={project.generated_image_url}
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Image comparison not available</p>
                  </div>
                )}

            </div>

            {/* Description Section (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {project.description && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <h3 className="text-lg font-semibold p-4 pb-2 text-gray-800">Description</h3>
                  <div className="p-4 pt-0">
                      <div className="prose max-w-none text-gray-700 leading-relaxed">
                        <ReactMarkdown>{project.description}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
