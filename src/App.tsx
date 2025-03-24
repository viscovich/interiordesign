import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { StyleSelector, Style } from './components/StyleSelector';
import { ImageComparison } from './components/ImageComparison';
import { AuthModal } from './components/AuthModal';
import { Upload, Wand2, LogIn } from 'lucide-react';
import { useAuth } from './lib/auth';
import { generateInteriorDesign } from './lib/gemini';
import toast from 'react-hot-toast';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setGeneratedImage(null);
    setDesignDescription(null);
    setSelectedStyle(null);
  };

  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedStyle || !user) return;

    setIsGenerating(true);
    try {
      const result = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedStyle.rooms[0] // Using the first room type as default
      );
      
      setGeneratedImage(result.imageData);
      setDesignDescription(result.description);
      toast.success('Design generated successfully!');
    } catch (error) {
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">AI Interior Design</h1>
          {!authLoading && (
            user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Transform Your Space with AI
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Upload a photo of your room and let AI help you visualize your dream interior design.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Step 1: Upload */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="h-6 w-6" />
              Step 1: Upload Your Room Photo
            </h2>
            <div className="mt-6">
              <ImageUploader onImageUpload={handleImageUpload} />
            </div>
          </section>

          {/* Step 2: Select Style */}
          {uploadedImage && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wand2 className="h-6 w-6" />
                Step 2: Choose Your Style
              </h2>
              <div className="mt-6">
                <StyleSelector
                  onStyleSelect={handleStyleSelect}
                  selectedStyleId={selectedStyle?.id}
                />
              </div>
            </section>
          )}

          {/* Generate Button */}
          {uploadedImage && selectedStyle && (
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`
                  inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm
                  ${isGenerating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                {isGenerating ? 'Generating...' : 'Generate Design'}
              </button>
            </div>
          )}

          {/* Results */}
          {generatedImage && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Your Transformed Space
              </h2>
              {designDescription && (
                <div className="mb-8 prose max-w-none">
                  <h3 className="text-xl font-semibold mb-4">Design Description</h3>
                  <p className="text-gray-700">{designDescription}</p>
                </div>
              )}
              <ImageComparison
                originalImage={uploadedImage!}
                generatedImage={generatedImage}
              />
            </section>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default App;