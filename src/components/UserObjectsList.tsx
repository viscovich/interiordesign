import React from 'react';
import { ImageLoader } from './ImageLoader';
import type { UserObject } from '../lib/userObjectsService';
import { TrashIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast'; // Added toast import

interface UserObjectsListProps {
  objects: UserObject[];
  selectedObjects: string[];
  onSelectObject: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UserObjectsList({ objects, selectedObjects, onSelectObject, onDelete }: UserObjectsListProps) {
  // Replaced handleDownload with handleDownloadImage from ProjectsList
  const handleDownloadImage = async (imageUrl: string | null | undefined, filename: string | null | undefined) => {
    if (!imageUrl) {
      toast.error("No image URL available for download.");
      return;
    }
    const downloadFilename = filename || 'downloaded-object.jpg'; // Ensure a filename
    try {
      // Try fetch as blob (works for same-origin or CORS-enabled)
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Network error or CORS issue");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadFilename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      // Use setTimeout to allow download to initiate before revoking
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: open image in new tab for manual download
      window.open(imageUrl, "_blank", "noopener");
      toast("Immagine aperta in una nuova scheda per il download manuale.", { icon: "⬇️" });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-8"> {/* Increased padding to p-8 */}
      {objects.map((object) => (
        <div
          key={object.id}
          className={`bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-transform duration-200 cursor-pointer ${
            selectedObjects.includes(object.id) ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectObject(object.id);
          }}
        >
            <ImageLoader
              src={object.thumbnail_url || object.asset_url || ''}
              alt={object.object_name}
              className="w-full h-48 object-cover"
            />
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{object.object_name}</h3>
            <p className="text-sm text-gray-600">{object.object_type}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => onSelectObject(object.id)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  // Updated to call handleDownloadImage
                  handleDownloadImage(object.asset_url || object.thumbnail_url, object.object_name); 
                }}
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                title="Download Object" // Add tooltip
                disabled={!object.asset_url && !object.thumbnail_url} // Disable if no URL
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onDelete(object.id);
                }}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
