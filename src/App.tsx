import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ImageUploader } from './components/ImageUploader';
import { StyleSelector, Style } from './components/StyleSelector';
import { RoomTypeSelector, RoomType } from './components/RoomTypeSelector';
import { TransformationModeSelector, TransformationMode } from './components/TransformationModeSelector';
import { ImageComparison } from './components/ImageComparison';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './lib/auth';
import { generateInteriorDesign } from './lib/gemini';
import toast from 'react-hot-toast';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('design');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedTransformationMode, setSelectedTransformationMode] = useState<TransformationMode | null>(null);

  const handleImageUpload = async (file: File) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
    setGeneratedImage(null);
    setDesignDescription(null);
  };

  const resetUpload = () => {
    setUploadedImage(null);
  };

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
  };

  const handleTransformationModeSelect = (mode: TransformationMode) => {
    setSelectedTransformationMode(mode);
  };

  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedStyle || !selectedRoomType || !selectedTransformationMode || !user) return;

    setIsGenerating(true);
    try {
      console.log(`[handleGenerate] Starting generation with: style=${selectedStyle.name}, roomType=${selectedRoomType.name}, mode=${selectedTransformationMode.id}`);
      
      const result = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedRoomType.name,
        selectedTransformationMode.id
      );
      
      console.log(`[handleGenerate] Generation successful, received description and image data`);
      setGeneratedImage(result.imageData);
      setDesignDescription(result.description);
      setActiveSection('results');
      toast.success('Design generated successfully!');
      
      // Scroll to results section after setting the active section
      setTimeout(() => {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('[handleGenerate] Generation failed:', error);
      // Display the specific error message to the user
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate design. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <nav className="container max-w-8xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src="/src/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-10" />
              <span className="ml-2 text-xl font-bold text-custom">DreamCasa AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-custom">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-custom">Pricing</a>
              <a href="#portfolio" className="text-gray-600 hover:text-custom">Portfolio</a>
              <a href="#faq" className="text-gray-600 hover:text-custom">FAQ</a>
              {!authLoading && (
                user ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <button
                      onClick={() => signOut()}
                      className="!rounded-button px-6 py-2 text-custom border border-custom hover:bg-custom hover:text-white transition"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsAuthModalOpen(true)} 
                      className="!rounded-button px-6 py-2 text-custom border border-custom hover:bg-custom hover:text-white transition"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => {
                        setIsAuthModalOpen(true);
                      }} 
                      className="!rounded-button px-6 py-2 bg-custom text-white hover:bg-custom/90 transition"
                    >
                      Register
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative bg-gray-50 py-20">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl font-bold mb-6">DreamCasa AI: Transform Your Space with AI</h1>
                <p className="text-xl text-gray-600 mb-8">Upload a photo of your room and let AI transform it according to your preferred style. Professional results in seconds.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => document.getElementById('design-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="!rounded-button px-8 py-4 bg-custom text-white hover:bg-custom/90 transition flex items-center"
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Upload a photo
                  </button>
                  <button 
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    className="!rounded-button px-8 py-4 border border-custom text-custom hover:bg-custom hover:text-white transition"
                  >
                    Learn more
                  </button>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://creatie.ai/ai/api/search-image?query=A 3D vector-style image showing a modern living room transformation, with a clean, minimalist design. The scene features a before/after split view demonstrating AI-powered interior design changes. The background is a solid light color&width=600&height=400&orientation=landscape&removebg=true&flag=5b95a6e3-e05c-4e24-bd6b-141ab90fd7bb" 
                  alt="DreamCasa AI Transform" 
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Design Section */}
        <section id="design-section" className="py-20">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
              <p className="text-xl text-gray-600">Upload a photo and customize your design</p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              {/* Image Upload */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Upload Your Photo</h3>
                <ImageUploader 
                  onImageUpload={handleImageUpload} 
                  onReset={resetUpload}
                />
              </div>
              
              {/* Transformation Mode Selector */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Choose Transformation Mode</h3>
                <TransformationModeSelector
                  onModeSelect={handleTransformationModeSelect}
                  selectedModeId={selectedTransformationMode?.id}
                />
              </div>
              
              {/* Style Selector */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Choose Your Style</h3>
                <StyleSelector
                  onStyleSelect={handleStyleSelect}
                  selectedStyleId={selectedStyle?.id}
                />
              </div>
              
              {/* Room Type Selector */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Choose Room Type</h3>
                <RoomTypeSelector
                  onRoomTypeSelect={handleRoomTypeSelect}
                  selectedRoomTypeId={selectedRoomType?.id}
                />
              </div>
              
              {/* Generate Button */}
              <div className="mt-8 max-w-md mx-auto">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedTransformationMode}
                  className={`
                    !rounded-button w-full py-4 text-white transition
                    ${isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedTransformationMode
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-custom hover:bg-custom/90'
                    }
                  `}
                >
                  {isGenerating ? 'Generating...' : 'Generate Design'}
                </button>
                
                {!uploadedImage && (
                  <p className="text-sm text-gray-500 mt-2">Please upload an image to continue</p>
                )}
                {uploadedImage && !selectedStyle && (
                  <p className="text-sm text-gray-500 mt-2">Please select a style to continue</p>
                )}
                {uploadedImage && selectedStyle && !selectedRoomType && (
                  <p className="text-sm text-gray-500 mt-2">Please select a room type to continue</p>
                )}
                {uploadedImage && selectedStyle && selectedRoomType && !selectedTransformationMode && (
                  <p className="text-sm text-gray-500 mt-2">Please select a transformation mode to continue</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        {generatedImage && activeSection === 'results' && (
          <section id="results-section" className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Your Transformed Space</h2>
                <p className="text-xl text-gray-600">See the before and after comparison</p>
              </div>
              <ImageComparison
                originalImage={uploadedImage!}
                generatedImage={generatedImage}
              />
              
              {designDescription && (
                <div className="mt-12 max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-100 p-6 overflow-hidden">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-custom/10 rounded-full flex items-center justify-center mr-3">
                      <i className="fas fa-lightbulb text-custom"></i>
                    </div>
                    <h3 className="text-2xl font-semibold">AI Design Insights</h3>
                  </div>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    <ReactMarkdown>{designDescription}</ReactMarkdown>
                  </div>
                </div>
              )}
              <div className="text-center mt-12">
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setSelectedStyle(null);
                    setGeneratedImage(null);
                    setDesignDescription(null);
                    setActiveSection(null);
                    document.getElementById('design-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="!rounded-button px-8 py-4 bg-custom text-white hover:bg-custom/90 transition"
                >
                  Start New Design
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Features</h2>
              <p className="text-xl text-gray-600">Discover all the tools to transform your spaces</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-couch text-custom text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Virtual Staging</h3>
                <p className="text-gray-600">Virtually furnish your empty rooms with photorealistic furniture.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-eraser text-custom text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Empty Your Space</h3>
                <p className="text-gray-600">Remove furniture and objects to create a neutral environment.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-custom/10 rounded-lg flex items-center justify-center mb-4">
                  <i className="fas fa-paint-roller text-custom text-xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3">Redesign & Style</h3>
                <p className="text-gray-600">Renovate existing rooms with new design styles.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gray-50">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Plans and Pricing</h2>
              <p className="text-xl text-gray-600">Choose the plan that best suits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold mb-4">Basic</h3>
                <div className="text-4xl font-bold mb-6">
                  Free
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    3 generations per month
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    Standard resolution
                  </li>
                </ul>
                <button className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition">Start for free</button>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-custom relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-custom text-white px-4 py-1 rounded-full text-sm">Most popular</div>
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <div className="text-4xl font-bold mb-6">
                  $29<span className="text-xl font-normal">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    50 generations per month
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    High resolution
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    Priority support
                  </li>
                </ul>
                <button className="!rounded-button w-full py-3 bg-custom text-white hover:bg-custom/90 transition">Start now</button>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold mb-4">Business</h3>
                <div className="text-4xl font-bold mb-6">
                  $99<span className="text-xl font-normal">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    Unlimited generations
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    Maximum resolution
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-custom mr-2"></i>
                    API access
                  </li>
                </ul>
                <button className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition">Contact us</button>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="portfolio" className="py-20">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Results</h2>
              <p className="text-xl text-gray-600">See some of our transformations</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-lg overflow-hidden">
                <img src="https://creatie.ai/ai/api/search-image?query=A modern minimalist living room with clean lines, neutral colors, and contemporary furniture. The scene features natural light, hardwood floors, and large windows. Professional interior design photography with high-end finishes and styling&width=400&height=300&orientation=landscape&flag=54f50f6b-f152-4847-ae4e-60c0786d7ef4" alt="Living Room Transform" className="w-full h-64 object-cover" />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img src="https://creatie.ai/ai/api/search-image?query=A luxurious master bedroom with elegant furnishings, soft textiles, and a calming color palette. The scene includes a king-size bed, designer lighting, and tasteful artwork. Professional interior design photography with attention to detail&width=400&height=300&orientation=landscape&flag=683b4d05-6475-4e10-9998-0dc08f72955a" alt="Bedroom Transform" className="w-full h-64 object-cover" />
              </div>
              <div className="rounded-lg overflow-hidden">
                <img src="https://creatie.ai/ai/api/search-image?query=A contemporary kitchen with sleek cabinetry, marble countertops, and high-end appliances. The space features excellent lighting, clean lines, and a sophisticated design aesthetic. Professional interior design photography showcasing modern luxury&width=400&height=300&orientation=landscape&flag=8f07e65d-12a6-4b1f-aa2c-f373726533d8" alt="Kitchen Transform" className="w-full h-64 object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-gray-50">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Find answers to your questions</p>
            </div>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">How does the transformation process work?</h3>
                  <p className="text-gray-600">Upload a photo of your room, select the desired style, and let the AI do the rest. You'll receive the result in seconds.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">What type of photos can I upload?</h3>
                  <p className="text-gray-600">We accept photos in JPG and PNG format. For best results, use well-lit, high-resolution images.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">Can I edit the result?</h3>
                  <p className="text-gray-600">Yes, you can generate multiple variants and further customize the design according to your preferences.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container max-w-8xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="/src/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 mb-4 brightness-0 invert" />
              <span className="text-white text-lg font-bold block mb-2">DreamCasa AI</span>
              <p className="text-gray-400">Transform your spaces with artificial intelligence</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#portfolio" className="text-gray-400 hover:text-white">Portfolio</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#faq" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 mb-4">Subscribe to receive updates</p>
              <div className="flex">
                <input type="email" placeholder="Your email" className="!rounded-button flex-1 px-4 py-2 bg-gray-800 border border-gray-700 focus:outline-none focus:border-custom" />
                <button className="!rounded-button ml-2 px-6 py-2 bg-custom text-white hover:bg-custom/90">Subscribe</button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DreamCasa AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

export default App;
