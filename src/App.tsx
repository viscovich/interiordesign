import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './lib/auth';
import SeoWrapper from './components/SeoWrapper';
import { SidebarMenu } from './components/SidebarMenu';
import { CommunitySection } from './components/CommunitySection';
import { FloatingObjectsSidebar } from './components/FloatingObjectsSidebar';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import ImageModificationModal from './components/ImageModificationModal';
import { UserAccountDropdown } from './components/UserAccountDropdown';
import useUserObjects from './hooks/useUserObjects';
import useDesignGenerator from './hooks/useDesignGenerator';
import useModals from './hooks/useModals';
import HeroSection from './sections/HeroSection';
import DesignSection from './sections/DesignSection';
import ResultsSection from './sections/ResultsSection';
import ProjectsSection from './sections/ProjectsSection';
import ObjectsSection from './sections/ObjectsSection';
import FeaturesSection from './sections/FeaturesSection';
import PricingSection from './sections/PricingSection';
import PortfolioSection from './sections/PortfolioSection';
import FAQSection from './sections/FAQSection';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = React.useState<string>('design');
  const [projectsRefreshKey, setProjectsRefreshKey] = React.useState(0); // State for triggering refresh

  // Custom hooks
  const modals = useModals();
  const design = useDesignGenerator({
    userId: user?.id,
    setIsLoginModalOpen: modals.setIsLoginModalOpen,
    setPendingGenerate: modals.setPendingGenerate
  });
  const objects = useUserObjects(user?.id, activeSection);

  const handleNewDesign = () => {
    design.resetUpload();
    setActiveSection('design');
  };

  const handleScrollToDesign = () => {
    setActiveSection('design');
    document.getElementById('design-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenerate = async () => {
    const result = await design.handleGenerate();
    console.log('Generation result:', result);
    if (result === true) {
      setActiveSection('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle pending generation after login
  React.useEffect(() => {
    if (user && modals.pendingGenerate) {
      handleGenerate();
      modals.setPendingGenerate(false);
    }
  }, [user, modals.pendingGenerate, handleGenerate]); // Added handleGenerate dependency

  const triggerProjectsRefresh = () => {
    setProjectsRefreshKey(prevKey => prevKey + 1);
  };

  console.log('App.tsx rendering - isLoginModalOpen:', modals.isLoginModalOpen); // DEBUG LOG

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
                  <a href="#features" className="text-gray-极6 hover:text-custom">Features</a>
                  <a href="#pricing" className="text-gray-600 hover:text-custom">Pricing</a>
                  <a href="#portfolio" className="text-gray-600 hover:text-custom">Portfolio</a>
                  <a href="#faq" className="text-gray-600 hover:text-custom">FAQ</a>
                </>
              )}
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
                      onClick={() => modals.setIsLoginModalOpen(true)}
                      className="!rounded-button px-6 py-2 text-custom border border-custom hover:bg-custom hover:text-white transition"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => modals.setIsRegisterModalOpen(true)}
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

      {/* Render sidebar conditionally (it's fixed, so position is independent) */}
      {user && (
        <SidebarMenu
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      )}

      {/* Main content area: Apply top padding for header and conditional left margin for sidebar */}
      <main className={`pt-20 ${user ? 'ml-64' : ''}`}> 
        {/* Render sections based on activeSection and user status */}
        {!user && (
            <>
              <HeroSection 
                onScrollToDesign={handleScrollToDesign}
                onScrollToFeatures={handleScrollToFeatures}
              />
              <DesignSection
                uploadedImage={design.uploadedImage}
                isGenerating={design.isGenerating}
                selectedStyle={design.selectedStyle}
                selectedRoomType={design.selectedRoomType}
                selectedColorPalette={design.selectedColorPalette}
                selectedView={design.selectedView}
                selectedRenderingType={design.selectedRenderingType}
                onImageUpload={design.handleImageUpload}
                onReset={design.resetUpload}
                onGenerate={handleGenerate}
                onStyleSelect={design.setSelectedStyle}
                onRoomTypeSelect={design.setSelectedRoomType}
                onColorPaletteSelect={design.setSelectedColorPalette}
                onViewChange={design.setSelectedView}
                onRenderingTypeChange={design.setSelectedRenderingType}
              />
              <FeaturesSection />
              <PricingSection />
              <PortfolioSection />
              <FAQSection />
            </>
          )}

          {activeSection === 'design' && user && (
            <DesignSection
              uploadedImage={design.uploadedImage}
              isGenerating={design.isGenerating}
              selectedStyle={design.selectedStyle}
              selectedRoomType={design.selectedRoomType}
              selectedColorPalette={design.selectedColorPalette}
              selectedView={design.selectedView}
              selectedRenderingType={design.selectedRenderingType}
              onImageUpload={design.handleImageUpload}
              onReset={design.resetUpload}
              onGenerate={handleGenerate}
              onStyleSelect={design.setSelectedStyle}
              onRoomTypeSelect={design.setSelectedRoomType}
              onColorPaletteSelect={design.setSelectedColorPalette}
              onViewChange={design.setSelectedView}
              onRenderingTypeChange={design.setSelectedRenderingType}
            />
          )}

          {design.generatedImage && activeSection === 'results' && (
            <ResultsSection
              originalImage={design.uploadedImage!}
              generatedImage={design.generatedImage}
              onNewDesign={handleNewDesign}
            />
          )}

          {activeSection === 'projects' && user && (
            <ProjectsSection
              user={user}
              onModifyProject={modals.handleOpenModificationModal}
              refreshKey={projectsRefreshKey} // Pass refresh key down
            />
          )}

          {activeSection === 'objects' && user && (
            <ObjectsSection
              objects={objects.userObjects}
              loading={objects.loadingObjects}
              selectedObjects={objects.selectedObjects}
              onSelectObject={objects.handleSelectObject}
              onDeleteObject={objects.handleDeleteObject}
            />
          )}

          {activeSection === 'community' && user && (
            <CommunitySection />
        )}
      </main>

      {/* Footer: Apply conditional left margin for sidebar */}
      <footer className={`bg-gray-900 text-white py-12 ${user ? 'ml-64' : ''}`}> 
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
      {/* Removed outer flex column wrapper */}


      {/* Modals */}
      <LoginModal
        isOpen={modals.isLoginModalOpen}
        onClose={() => modals.setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          modals.setIsLoginModalOpen(false);
          modals.setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={modals.isRegisterModalOpen}
        onClose={() => modals.setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          modals.setIsRegisterModalOpen(false);
          modals.setIsLoginModalOpen(true);
        }}
      />
      <FloatingObjectsSidebar
        isOpen={modals.isObjectsSidebarOpen}
        onClose={() => modals.setIsObjectsSidebarOpen(false)}
        selectedObjects={objects.selectedObjects}
        onSelectObject={objects.handleSelectObject}
      />
      <ImageModificationModal
        isOpen={modals.isModificationModalOpen}
        onClose={modals.handleCloseModificationModal}
        project={modals.projectToModify}
        onGenerationComplete={triggerProjectsRefresh} // Pass refresh trigger function
      />
      </SeoWrapper>
  );
}

export default App;
