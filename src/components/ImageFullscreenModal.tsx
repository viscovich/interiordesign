import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ImageFullscreenModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageFullscreenModal({
  imageUrl,
  onClose,
}: ImageFullscreenModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 bg-black/60 rounded-full p-2"
        aria-label="Close"
      >
        <XMarkIcon className="h-10 w-10" />
      </button>
      <img
        src={imageUrl}
        alt="Project"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        style={{ boxShadow: "0 0 40px 0 rgba(0,0,0,0.7)" }}
      />
    </div>
  );
}
