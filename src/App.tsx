import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ImageUploader } from './components/ImageUploader';
import { StyleSelector, Style } from './components/StyleSelector';
import { RoomTypeSelector, RoomType } from './components/RoomTypeSelector';
import { ColorPaletteSelector, ColorPalette } from './components/ColorPaletteSelector';
import { RenderingTypeSelector } from './components/RenderingTypeSelector'; // Removed RenderingType import
import { ViewTypeSelector } from './components/ViewTypeSelector'; // Removed ViewType import
// Removed TransformationMode import
import { ImageComparison } from './components/ImageComparison';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ProjectsList } from './components/ProjectsList';
import ImageModificationModal from './components/ImageModificationModal'; // Import the new modal
import { UserCredits } from './components/UserCredits';
import { useAuth } from './lib/auth';
import { generateInteriorDesign } from './lib/gemini';
import { uploadImage } from './lib/storage';
import { createProject, recognizeAndSaveObjects } from './lib/projectsService'; // Import recognizeAndSaveObjects
import type { Project } from './lib/projectsService.d';
import { hasEnoughCredits, useCredit, getUserProfile } from './lib/userService';
import { getStripe, startCheckout } from './lib/stripe';
import type { UserProfile } from './lib/userService.d';
import toast from 'react-hot-toast';
// Removed duplicate import of Project type here, it's already imported on line 17

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [designDescription, setDesignDescription] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('design');
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedColorPalette, setSelectedColorPalette] = useState<ColorPalette | null>(null);
  const [selectedView, setSelectedView] = useState<string | null>(null); // Change state type to string | null
  const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null); // Change state type to string | null
  // Removed selectedTransformationMode state
  const [pendingGenerate, setPendingGenerate] = useState(false);
  // State for the modification modal
  const [isModificationModalOpen, setIsModificationModalOpen] = useState(false);
  const [projectToModify, setProjectToModify] = useState<Project | null>(null);


  const handleImageUpload = async (file: File) => {
    // Convert file to data URL for upload
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
    });
    
    // Upload to storage
    const originalImageUrl = await uploadImage(
      dataUrl,
      `original/${Date.now()}_${file.name}`
    );
    
    setUploadedImage(originalImageUrl);
    setGeneratedImage(null);
    setDesignDescription(null);
  };

  const resetUpload = () => {
    setUploadedImage(null);
  };

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
  };

  // Removed handleTransformationModeSelect

  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
  };

  // Update handler for ViewType
  const handleViewSelect = (view: string) => { // Accept string
    setSelectedView(view);
  };

  // Update handler for RenderingType
  const handleRenderingTypeSelect = (renderingType: string) => { // Accept string
    setSelectedRenderingType(renderingType);
  };


  const handleGenerate = async () => {
    // Update condition to check for view and rendering type, remove transformation mode
    if (!uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType) return;
    if (!user) {
      setIsLoginModalOpen(true);
      setPendingGenerate(true);
      return;
    }
    setPendingGenerate(false);

    setIsGenerating(true);
    try {
      const result = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorPalette.name,
        selectedRenderingType, // Pass rendering type string directly
        selectedView // Pass view string directly
      );

      // First upload the generated image to storage
      const generatedImageUrl = await uploadImage(
        result.imageData, 
        `generated/${Date.now()}.jpg`
      );
      
      // Then create the project in database
      let newProject: Project | null = null; // Variable to hold the created project
      if (user) {
        newProject = await createProject( // Assign the result
          user.id,
          uploadedImage,
          generatedImageUrl,
          selectedStyle.name,
          selectedRoomType.name
        );

        // --- New Step: Recognize and save objects ---
        if (newProject && user) { // Check if project creation was successful
          try {
            console.log(`Recognizing objects for project ${newProject.id} using image ${generatedImageUrl}`);
            // Call the imported function directly
            await recognizeAndSaveObjects(newProject.id, user.id, generatedImageUrl);
            console.log(`Objects recognized and saved for project ${newProject.id}`);
          } catch (recognitionError) {
            console.error('Failed to recognize or save objects after generation:', recognitionError);
            // Decide if we should notify the user - maybe a soft error?
            toast.error('Could not automatically identify objects in the generated image.');
          }
        }
        // --- End New Step ---
      }

      console.log('Generated image data:', result.imageData);
      setGeneratedImage(result.imageData); // Still use the base64 data for immediate display if needed
      setDesignDescription(result.description);
      setActiveSection('results');
      toast.success('Design generated and saved successfully!');
      
      setTimeout(() => {
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('[handleGenerate] Generation failed:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to generate design. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (user && pendingGenerate) {
      handleGenerate();
    }
  }, [user, pendingGenerate]);

  // Function to open the modification modal
  const handleOpenModificationModal = (project: Project) => {
    setProjectToModify(project);
    setIsModificationModalOpen(true);
  };

  // Function to close the modification modal
  const handleCloseModificationModal = () => {
    setIsModificationModalOpen(false);
    setProjectToModify(null);
  };


  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <nav className="container max-w-8xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-10" />
              <span className="ml-2 text-xl font-bold text-custom">DreamCasa AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              {!user && (
                <>
                  <a href="#features" className="text-gray-600 hover:text-custom">Features</a>
                  <a href="#pricing" className="text-gray-600 hover:text-custom">Pricing</a>
                  <a href="#portfolio" className="text-gray-600 hover:text-custom">Portfolio</a>
                  <a href="#faq" className="text-gray-600 hover:text-custom">FAQ</a>
                </>
              )}
              {user && (
                <button 
                  onClick={() => setActiveSection('projects')}
                  className="text-gray-600 hover:text-custom"
                >
                  My Projects
                </button>
              )}
              {!authLoading && (
                user ? (
                  <div className="flex items-center gap-4">
                    <UserCredits />
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
                      onClick={() => setIsLoginModalOpen(true)} 
                      className="!rounded-button px-6 py-2 text-custom border border-custom hover:bg-custom hover:text-white transition"
                    >
                      Sign In
                    </button>
                    <button 
                      onClick={() => setIsRegisterModalOpen(true)} 
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
        {/* Hero Section - Only shown when not logged in */}
        {!user && (
          <section className="relative bg-gray-50 py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h1 className="text-5xl font-bold mb-6">DreamCasa AI: Transform Your Space with AI</h1>
                  <p className="text-xl text-gray-600 mb-8">Upload a photo or a full floor plan and let AI redesign your selected room in your preferred style.
                  Get stunning, professional results in seconds.</p>
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
                    src="/images/before_after.jpg"
                    alt="DreamCasa AI Transform" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Design Section */}
        <section id="design-section" className="py-20">
          <div className="container max-w-8xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
              <p className="text-xl text-gray-600">Upload a photo and customize your design</p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              {/* Pass props to ImageUploader and remove duplicate selectors */}
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                onReset={resetUpload}
                viewValue={selectedView}
                renderingTypeValue={selectedRenderingType}
                onViewChange={handleViewSelect}
                onRenderingTypeChange={handleRenderingTypeSelect}
              />
              
              {uploadedImage && (
                <div className="space-y-8 mt-8">
                  <StyleSelector
                    onStyleSelect={handleStyleSelect}
                    selectedStyleId={selectedStyle?.id}
                  />
                  <RoomTypeSelector
                    onRoomTypeSelect={handleRoomTypeSelect}
                    selectedRoomTypeId={selectedRoomType?.id}
                  />
                  <ColorPaletteSelector
                    onPaletteSelect={setSelectedColorPalette}
                    selectedPaletteId={selectedColorPalette?.id}
                  />
                  
                  <button
                    onClick={handleGenerate}
                    // Update disabled check
                    disabled={isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType}
                    className={`
                      !rounded-button w-full py-4 text-white transition
                      ${isGenerating || !uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-custom hover:bg-custom/90'
                      }
                    `}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Design'}
                  </button>
                  
                  {isGenerating && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 relative overflow-hidden">
                      <div 
                        className="bg-custom h-1.5 rounded-full absolute top-0 left-0"
                        style={{ 
                          width: '0%',
                          animation: 'progress 15s linear forwards',
                          animationFillMode: 'forwards'
                        }}
                      />
                      <div className="text-xs text-gray-500 text-center mt-1">
                        Generating your design...
                      </div>
                    </div>
                  )}
                </div>
              )}
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

        {/* Projects Section */}
        {activeSection === 'projects' && (
          <section className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <ProjectsList
                user={user}
                onModifyProject={handleOpenModificationModal} // Pass the handler function
              />
            </div>
          </section>
        )}

        {/* Features Section - Only shown when not logged in */}
        {!user && (
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
        )}

        {/* Pricing Section - Only shown when not logged in */}
        {!user && (
          <section id="pricing" className="py-20 bg-gray-50">
            <div className="container max-w-8xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Plans and Pricing</h2>
                <p className="text-xl text-gray-600">Choose the plan that best suits your needs</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold mb-4">💎 Free</h3>
                  <div className="text-4xl font-bold mb-6">
                    $0<span className="text-xl font-normal">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Access to the Standard model
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-times text-gray-400 mr-2"></i>
                      Advanced model not available
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      50 credits/month
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Standard generation: 5 credits/image
                    </li>
                  </ul>
                  <button className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition">Get Started</button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-custom relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-custom text-white px-4 py-1 rounded-full text-sm">Most popular</div>
                  <h3 className="text-2xl font-bold mb-4">🟦 Pro</h3>
                  <div className="text-4xl font-bold mb-6">
                    $9<span className="text-xl font-normal">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Full access to Standard + Advanced models
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      250 credits/month
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Standard: 5 credits/image
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Advanced: 15 credits/image
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      High-resolution images
                    </li>
                  </ul>
                  <button className="!rounded-button w-full py-3 bg-custom text-white hover:bg-custom/90 transition">Upgrade Now</button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-2xl font-bold mb-4">🟥 Enterprise</h3>
                  <div className="text-4xl font-bold mb-6">
                    $29<span className="text-xl font-normal">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Full access to Standard + Advanced models
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      1200 credits/month
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Standard: 5 credits/image
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Advanced: 15 credits/image
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      High-resolution images
                    </li>
                  </ul>
                  <button className="!rounded-button w-full py-3 bg-custom text-white hover:bg-custom/90 transition">Upgrade Now</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Portfolio Section - Only shown when not logged in */}
        {!user && (
          <section id="portfolio" className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">Our Results</h2>
                <p className="text-xl text-gray-600">See some of our transformations</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="rounded-lg overflow-hidden h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageComparison
                      originalImage="/images/Salotto_vecchio.png" 
                      generatedImage="/images/Salotto_nuovo.png"
                      className="h-full w-full object-contain"
                    />
                  </div>
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
        )}

        {/* FAQ Section - Only shown when not logged in */}
        {!user && (
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
                    <p className="text-gray-600">Upload a photo of your room or floor plan, select the desired style, and let the AI do the rest. You'll receive the result in seconds.</p>
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
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container max-w-8xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 mb-4 brightness-0 invert" />
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
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DreamCasa AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      {/* Render the Image Modification Modal */}
      <ImageModificationModal
        isOpen={isModificationModalOpen}
        onClose={handleCloseModificationModal}
        project={projectToModify}
      />
    </>
  );
}

export default App;
