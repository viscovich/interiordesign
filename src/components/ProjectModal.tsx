import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Project } from '../lib/projectsService.d';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
            className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-xl p-6"
          >
            <div className="flex flex-col lg:flex-row gap-8 h-full items-start">
              {/* Left Column */}
              <div className="w-full lg:w-1/3 flex flex-col overflow-hidden">
                <div className="mb-4">
                  <h2 className="text-3xl font-bold">{project.room_type}</h2>
                  <p className="text-gray-600 text-lg">{project.style}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {project.created_at &&
                      new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>

                {project.description && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col flex-1 overflow-hidden">
                    <h3 className="text-lg font-semibold p-4 pb-2 text-gray-800">Description</h3>
                    <div className="overflow-y-auto px-4 pb-4 pt-0 flex-1 max-h-[60vh]">
                      <div className="prose max-w-none text-gray-700 text-sm">
                        <ReactMarkdown>{project.description}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-2/3 flex flex-col gap-6 self-start">
                {/* Download Buttons */}
                <div className="flex justify-center gap-4 flex-wrap">
                  <button
                    onClick={() =>
                      handleDownload(
                        project.original_image_url,
                        `${project.room_type}_original.jpg`
                      )
                    }
                    disabled={!project.original_image_url}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      project.original_image_url
                        ? 'bg-black hover:bg-custom-800 text-white'
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

                {/* Image Comparison */}
                {project.original_image_url && project.generated_image_url ? (
                  <div className="h-[60vh] overflow-hidden rounded-lg">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
