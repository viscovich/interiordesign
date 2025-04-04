import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { ImageUploader } from './components/ImageUploader';
import { TabbedSelector } from './components/TabbedSelector';
import { Style } from './components/StyleSelector';
import { RoomType } from './components/RoomTypeSelector';
import { ColorPaletteSelector, ColorPalette } from './components/ColorPaletteSelector';
import { RenderingTypeSelector } from './components/RenderingTypeSelector';
import { ViewTypeSelector } from './components/ViewTypeSelector';
import { ImageComparison } from './components/ImageComparison';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ProjectsList } from './components/ProjectsList';
import { SidebarMenu } from './components/SidebarMenu'; // Import SidebarMenu
import { UserObjectsSection } from './components/UserObjectsSection'; // Import UserObjectsSection
import { CommunitySection } from './components/CommunitySection'; // Import CommunitySection
import { FloatingObjectsSidebar } from './components/FloatingObjectsSidebar';
import ImageModificationModal from './components/ImageModificationModal';
import { UserAccountDropdown } from './components/UserAccountDropdown';
import { useAuth } from './lib/auth';
import { generateInteriorDesign } from './lib/gemini';
import { uploadImage } from './lib/storage';
import { createProject } from './lib/projectsService'; // Removed saveDetectedObjects as it's unused here
import type { Project } from './lib/projectsService.d';
import { hasEnoughCredits, useCredit, getUserProfile } from './lib/userService';
import { getUserObjects, deleteUserObject, UserObject } from './lib/userObjectsService'; // Import user object functions and type
import { getStripe, startCheckout } from './lib/stripe';
import type { UserProfile } from './lib/userService.d';
import toast from 'react-hot-toast';
import SeoWrapper from './components/SeoWrapper';

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
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [selectedRenderingType, setSelectedRenderingType] = useState<string | null>(null);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [isModificationModalOpen, setIsModificationModalOpen] = useState(false);
  const [projectToModify, setProjectToModify] = useState<Project | null>(null);
  const [isObjectsSidebarOpen, setIsObjectsSidebarOpen] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [userObjects, setUserObjects] = useState<UserObject[]>([]); // State for user objects
  const [loadingObjects, setLoadingObjects] = useState(false); // State for loading objects

  // Fetch user objects when user logs in or activeSection changes to 'objects'
  React.useEffect(() => {
    const fetchObjects = async () => {
      if (user && activeSection === 'objects') {
        setLoadingObjects(true);
        try {
          const objects = await getUserObjects(user.id);
          setUserObjects(objects);
        } catch (error) {
          console.error("Failed to fetch user objects:", error);
          toast.error("Could not load your objects.");
        } finally {
          setLoadingObjects(false);
        }
      }
    };
    fetchObjects();
  }, [user, activeSection]);

  // Handler for deleting an object
  const handleDeleteObject = async (id: string) => {
    if (!user) return;
    // Optimistic UI update
    const originalObjects = [...userObjects];
    setUserObjects(currentObjects => currentObjects.filter(obj => obj.id !== id));
    setSelectedObjects(currentSelected => currentSelected.filter(objId => objId !== id));

    try {
      await deleteUserObject(id); // Corrected: Removed user.id argument
      toast.success("Object deleted successfully.");
    } catch (error) {
      console.error("Failed to delete object:", error);
      toast.error("Failed to delete object. Please try again.");
      // Revert UI if delete fails
      setUserObjects(originalObjects);
    }
  };

  const handleSelectObject = (id: string) => {
    setSelectedObjects(prev =>
      prev.includes(id)
        ? prev.filter(objId => objId !== id)
        : [...prev, id]
    );
  };

  const handleImageUpload = async (file: File) => {
    try {
      console.log('Starting image upload...');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });
      console.log('Created data URL successfully');

      const originalImageUrl = await uploadImage(
        dataUrl,
        `original/${Date.now()}_${file.name}`
      );
      console.log('Uploaded image to storage:', originalImageUrl);

      setUploadedImage(originalImageUrl);
      setGeneratedImage(null);
      setDesignDescription(null);
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      toast.error('Failed to process image upload');
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
  };

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
  };

  const handleStyleSelect = (style: Style) => {
    setSelectedStyle(style);
  };

  const handleViewSelect = (view: string) => {
    setSelectedView(view);
  };

  const handleRenderingTypeSelect = (renderingType: string) => {
    setSelectedRenderingType(renderingType);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType) return;
    if (!user) {
      setIsLoginModalOpen(true);
      setPendingGenerate(true);
      return;
    }
    setPendingGenerate(false);

    setIsGenerating(true);
    try {
      const { description, imageData } = await generateInteriorDesign(
        uploadedImage,
        selectedStyle.name,
        selectedRoomType.name,
        selectedColorPalette.name,
        selectedRenderingType,
        selectedView,
        user.id
      );

      const generatedImageUrl = await uploadImage(
        imageData,
        `generated/${Date.now()}.jpg`
      );

      if (user) {
      await createProject(
        user.id,
        uploadedImage,
        generatedImageUrl,
        selectedStyle.name,
        selectedRoomType.name,
        description,  // Use the description returned from generateInteriorDesign
        selectedView,
        selectedColorPalette.name
      );
      }

      setGeneratedImage(imageData);
      setDesignDescription(description);
      setActiveSection('results');
      toast.success('Design generated and saved successfully!');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate design. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenModificationModal = (project: Project) => {
    setProjectToModify(project);
    setIsModificationModalOpen(true);
  };

  const handleCloseModificationModal = () => {
    setIsModificationModalOpen(false);
    setProjectToModify(null);
  };

  React.useEffect(() => {
    if (user && pendingGenerate) {
      handleGenerate();
    }
  }, [user, pendingGenerate]);

  return (
    <SeoWrapper
      title="Transform Your Space with AI"
      description="Upload a photo and let AI redesign your room in your preferred style. Get stunning results in seconds."
      ogImage="/images/before_after.jpg"
    >
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
              {/* My Projects button removed from header */}
              {!authLoading && (
                user ? (
                    <div className="flex items-center gap-4">
                      <UserAccountDropdown />
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

      <div className="flex pt-20"> {/* Main flex container for sidebar + content */}
        {user && (
          <SidebarMenu
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />
        )}
        <main className={`flex-1 ${user ? 'ml-64' : ''}`}> {/* Main content area */}
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
        {/* Conditionally render Design section only if activeSection is 'design' */}
        {activeSection === 'design' && (
          <section id="design-section" className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4">Transform Your Space</h2>
                <p className="text-xl text-gray-600">Upload a photo and customize your design</p>
              </div>

              <div className="max-w-5xl mx-auto">

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
                    <TabbedSelector
                      styles={{
                        onStyleSelect: handleStyleSelect,
                        selectedStyleId: selectedStyle?.id
                      }}
                      roomTypes={{
                        onRoomTypeSelect: handleRoomTypeSelect,
                        selectedRoomTypeId: selectedRoomType?.id
                      }}
                    />


                    <ColorPaletteSelector
                      onPaletteSelect={setSelectedColorPalette}
                      selectedPaletteId={selectedColorPalette?.id}
                    />

                    <div className="mb-2">
                      {(!uploadedImage || !selectedStyle || !selectedRoomType || !selectedColorPalette || !selectedView || !selectedRenderingType) && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {!uploadedImage && (
                            <span className="text-sm text-red-500">• Upload an image</span>
                          )}
                          {uploadedImage && !selectedStyle && (
                            <span className="text-sm text-red-500">• Select style</span>
                          )}
                          {uploadedImage && !selectedRoomType && (
                            <span className="text-sm text-red-500">• Select room type</span>
                          )}
                          {uploadedImage && !selectedColorPalette && (
                            <span className="text-sm text-red-500">• Select color palette</span>
                          )}
                          {uploadedImage && !selectedView && (
                            <span className="text-sm text-red-500">• Select view</span>
                          )}
                          {uploadedImage && !selectedRenderingType && (
                            <span className="text-sm text-red-500">• Select rendering</span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={handleGenerate}
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
                    </div>

                    {isGenerating && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 relative overflow-hidden">
                        <div
                          className="bg-custom h-1.5 rounded-full absolute top-0 left-0"
                          style={{
                            animation: 'progress 15s linear forwards'
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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

              <div className="text-center mt-12">
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setDesignDescription(null);
                    setActiveSection('design');
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
        {activeSection === 'projects' && user && ( // Ensure user exists
          <section className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <ProjectsList
                user={user}
                onModifyProject={handleOpenModificationModal}
              />
            </div>
          </section>
        )}

        {/* Objects Section */}
        {activeSection === 'objects' && user && (
          <section className="py-20">
            <div className="container max-w-8xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8 text-center">My Objects</h2>
              {loadingObjects ? (
                <p className="text-center text-gray-500">Loading objects...</p>
              ) : (
                <UserObjectsSection
                  objects={userObjects} // Pass userObjects state
                  onDelete={handleDeleteObject} // Pass handleDeleteObject function
                  selectedObjects={selectedObjects} // Pass selectedObjects state
                  onSelectObject={handleSelectObject} // Pass handleSelectObject function
                />
              )}
              {/* Consider adding an UploadObjectModal trigger here */}
            </div>
          </section>
        )}

        {/* Community Section */}
        {activeSection === 'community' && user && (
          <CommunitySection />
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
                  <h3 className="text-xl font-semibold mb-3">Enhance Designs with Your Personal Items</h3>
                  <p className="text-gray-600">Personalize your designs by easily inserting items from your own object library – from sofas to lamps and beyond."</p>
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
                      50 credits
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Standard generation: 5 credits/image
                    </li>
                    <li className="flex items-center">
                      <i className="fas fa-check text-custom mr-2"></i>
                      Image Resolution: 1024x720 pixel
                    </li>
                  </ul>
                  <button className="!rounded-button w-full py-3 border border-custom text-custom hover:bg-custom hover:text-white transition">Get Started</button>
                </div>
                <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-custom relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-custom text-white px-4 py-1 rounded-full text-sm">Most popular</div>
                  <h3 className="text-2xl font-bold mb-4">🟦 Pro</h3>
                  <div className="text-4xl font-bold mb-6">
                    $19<span className="text-xl font-normal">/month</span>
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
                    $49<span className="text-xl font-normal">/month</span>
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
                      <i className="fas fa-check text_custom mr-2"></i>
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
                <div className="rounded-lg overflow-hidden h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageComparison
                      originalImage="/images/planimetria-casa.jpg"
                      generatedImage="/images/bedroom-design-example.jpg"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="rounded-lg overflow-hidden h-64 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageComparison
                      originalImage="/images/Cucina_prima.png"
                      generatedImage="/images/kitchen-design-example.jpg"
                      className="h-full w-full object-contain"
                    />
                  </div>
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
                    <p className="text-gray-600">Upload a photo of your room or floor plan, select the desired style, and let the AI do the rest. You'll receive the result in seconds. You may also Integrate Uploaded Objects into Your Scenes </p>
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

      </main> {/* End of main content area */}
      {/* Correctly placed closing div for the main flex container */}
      </div>

      {/* Footer - Moved outside the flex container */}
      <footer className="bg-gray-900 text-white py-12">
          {/* Inner container remains standard */}
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

        {/* Modals */}
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
        <FloatingObjectsSidebar
          isOpen={isObjectsSidebarOpen}
          onClose={() => setIsObjectsSidebarOpen(false)}
          selectedObjects={selectedObjects}
          onSelectObject={handleSelectObject}
        />
        <ImageModificationModal
          isOpen={isModificationModalOpen}
          onClose={handleCloseModificationModal}
          project={projectToModify}
        />
      </SeoWrapper>
  );
}

export default App;
