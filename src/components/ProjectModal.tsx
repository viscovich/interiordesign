import { useState, useRef, useEffect } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (project && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [project]);

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
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Scrollable description with auto-scroll to top on open */}
            <div
              className="flex-1 flex flex-col items-center px-4 py-0 overflow-y-auto"
              ref={scrollRef}
            >
              {project.description && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 w-full max-w-5xl mx-auto px-12 py-8 shadow-lg">
                  <div className="prose max-w-none text-gray-700 leading-relaxed text-lg">
<ReactMarkdown>
  {(() => {
    let desc = project.description || "";
    // Rimuovi eventuali spazi iniziali/finali e linee vuote in eccesso
    desc = desc.trim().replace(/\n{3,}/g, "\n\n");
    // Correggi "** " (due asterischi seguiti da spazio) in "**" per il markdown bold
    desc = desc.replace(/(\*\*)\s+/g, "$1");
    // Assicura che inizi con una riga vuota per il markdown
    if (desc && !desc.startsWith('\n')) desc = '\n' + desc;
    return desc;
  })()}
</ReactMarkdown>
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


// AccordionDescription component
function AccordionDescription({ description }: { description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200">
      <button
        className="w-full flex justify-between items-center p-4 pb-2 text-gray-800 text-lg font-semibold focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Description
        <span className="ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="p-4 pt-0 max-h-60 overflow-y-auto">
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
