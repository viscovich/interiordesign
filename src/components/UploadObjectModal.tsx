import React, { useState, useRef, useCallback } from 'react';
import { useAuth } from '../lib/auth'; // Assuming you have an auth context/hook
// Removed unused uploadImage import from here as addUserObject handles it
import { addUserObject } from '../lib/projectsService'; // Import from the correct service

interface UploadObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void; // Callback to refresh the list
}

const objectCategories = ["Sofa", "Chair", "Table", "Lamp", "Other"];

const UploadObjectModal: React.FC<UploadObjectModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const { user } = useAuth(); // Get current user
  const [objectName, setObjectName] = useState('');
  const [objectType, setObjectType] = useState(objectCategories[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null); // Clear previous errors
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const resetForm = useCallback(() => {
    setObjectName('');
    setObjectType(objectCategories[0]);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !objectName || !user) {
      setError('Please provide an object name and select an image file.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call addUserObject directly, passing the required parameters including the File
      // addUserObject will handle conversion, upload, description generation, and DB insert
      await addUserObject(
        user.id,
        objectName,
        objectType,
        selectedFile // Pass the File object directly
        // dimensions can be added here if collected from the form
      );

      // Success
      onUploadSuccess(); // Trigger list refresh
      handleClose(); // Close modal and reset form

    } catch (err) {
      // Catch errors from addUserObject (which includes upload, description gen, db insert)
      console.error('Error adding user object:', err);
      setError(`Failed to add object. ${err instanceof Error ? err.message : 'Please try again.'}`);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload New Item</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="mb-4">
            <label htmlFor="objectName" className="block text-sm font-medium text-gray-700 mb-1">
              Object Name
            </label>
            <input
              type="text"
              id="objectName"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="objectType" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="objectType"
              value={objectType}
              onChange={(e) => setObjectType(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              disabled={isLoading}
            >
              {objectCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="objectImage" className="block text-sm font-medium text-gray-700 mb-1">
              Image
            </label>
            <input
              type="file"
              id="objectImage"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png" // Only accept PNG files
              required
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Only PNG files are accepted</p>
            {previewUrl && (
              <div className="mt-2 border border-gray-200 rounded p-2 inline-block">
                <img src={previewUrl} alt="Preview" className="h-20 w-auto object-contain" />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !objectName}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadObjectModal;
