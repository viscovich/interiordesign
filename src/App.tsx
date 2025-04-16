import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './lib/auth';
import SeoWrapper from './components/SeoWrapper';
import { SidebarMenu } from './components/SidebarMenu';
import { FloatingObjectsSidebar } from './components/FloatingObjectsSidebar';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import ImageModificationModal from './components/ImageModificationModal';
import { UserAccountDropdown } from './components/UserAccountDropdown';
import useUserObjects from './hooks/useUserObjects';
import { UserObject } from './lib/userObjectsService';
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
import UserObjectsManager from './components/UserObjectsManager';
import CommunityProjectsSection from './sections/CommunityProjectsSection';
import ErrorModal from './components/ErrorModal';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeSection, setActiveSection] = React.useState<string>('design');
  const [showFullHome, setShowFullHome] = React.useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = React.useState(0);

  // Custom hooks
  const modals = useModals();
  const design = useDesignGenerator({
    userId: user?.id,
    setIsLoginModalOpen: modals.setIsLoginModalOpen,
    setPendingGenerate: modals.setPendingGenerate
  });
  const objects = useUserObjects(user?.id); 

  const handleNewDesign = () => {
    design.startNewProject();
    setActiveSection('design');
  };

  const handleScrollToDesign = () => {
    setActiveSection('design');
    document.getElementById('design-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [newProjectId, setNewProjectId] = useState<string | null>(null);

  const handleGenerate = async (selectedObjects: UserObject[]) => { 
    const projectId = await design.handleGenerate(selectedObjects); 
    if (projectId) {
      setNewProjectId(projectId);
      triggerProjectsRefresh();
      setActiveSection('projects');
    }
  };

  React.useEffect(() => {
    if (user && modals.pendingGenerate) {
      handleGenerate([]);
      modals.setPendingGenerate(false);
    }
  }, [user, modals.pendingGenerate, handleGenerate]);

  const triggerProjectsRefresh = () => {
    setProjectsRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <SeoWrapper
      title="Transform Your Space with AI"
      description="Upload a photo and let AI redesign your room in your preferred style. Get stunning results in seconds."
      ogImage="/images/before_after.jpg"
    >
      <header className="bg-white shadow-sm border-b border-gray-200">
        <nav className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center ml-16 lg:ml-0">
              <img 
                src="/images/Dreamcasa3-removebg-preview.png" 
                alt="DreamCasa AI Logo" 
                className="h-8 w-auto cursor-pointer"
                onClick={() => {
                  setActiveSection('design');
                  setShowFullHome(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
              <span className="ml-2 text-xl font-semibold text-custom">DreamCasa AI</span>
            </div>
            <div className="flex items-center space-x-4">
              {!authLoading && user && (
                 <div className="flex items-center gap-4">
                    <UserAccountDropdown />
                  </div>
              )}
              {!authLoading && !user && (
                 <div className="hidden md:flex items-center space-x-4">
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
                 </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {user && (
          <SidebarMenu
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onNewProjectClick={handleNewDesign}
            setShowFullHome={setShowFullHome}
          />
        )}

        <main className={`flex-1 overflow-y-auto ${user ? 'lg:pl-0 pl-16' : 'w-full'}`}>
          <div className="p-8">
            {(showFullHome || !user) && (
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
                  selectedColorTone={design.selectedColorTone}
                  selectedView={design.selectedView}
                  selectedRenderingType={design.selectedRenderingType}
                  onImageUpload={design.handleImageUpload}
                  onReset={design.resetUpload}
                  onGenerate={handleGenerate}
                  onStyleSelect={design.setSelectedStyle}
                  onRoomTypeSelect={design.setSelectedRoomType}
                  onColorToneSelect={design.setSelectedColorTone}
                  onViewChange={design.setSelectedView}
                  onRenderingTypeChange={design.setSelectedRenderingType}
                  isAuthenticated={!!user}
                  hasObjects={objects.userObjects.length > 0}
                />
                <FeaturesSection />
                <PricingSection />
                <PortfolioSection />
                <FAQSection />
              </>
            )}

            {!showFullHome && activeSection === 'design' && user && (
              <DesignSection
                uploadedImage={design.uploadedImage}
                isGenerating={design.isGenerating}
                selectedStyle={design.selectedStyle}
                selectedRoomType={design.selectedRoomType}
                selectedColorTone={design.selectedColorTone}
                selectedView={design.selectedView}
                selectedRenderingType={design.selectedRenderingType}
                onImageUpload={design.handleImageUpload}
                onReset={design.resetUpload}
                onGenerate={handleGenerate}
                onStyleSelect={design.setSelectedStyle}
                onRoomTypeSelect={design.setSelectedRoomType}
                onColorToneSelect={design.setSelectedColorTone}
                onViewChange={design.setSelectedView}
                onRenderingTypeChange={design.setSelectedRenderingType}
                isAuthenticated={!!user}
                hasObjects={objects.userObjects.length > 0}
                userId={user?.id}
              />
            )}

            {activeSection === 'projects' && user && (
              <ProjectsSection
                user={user}
                onModifyProject={modals.handleOpenModificationModal}
                refreshKey={projectsRefreshKey}
              />
            )}

            {activeSection === 'objects' && user && objects.userObjects.length > 0 && (
              <UserObjectsManager />
            )}

            {activeSection === 'objects' && user && objects.userObjects.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <h2 className="text-2xl font-semibold mb-4">My Objects</h2>
                <p>You haven't uploaded any objects yet.</p>
              </div>
            )}

            {activeSection === 'community' && user && (
              <CommunityProjectsSection />
            )}
          </div>
        </main>
      </div>

      <footer className={`bg-gray-900 text-white py-12 ${user ? '' : 'w-full'}`}>
        <div className="container max-w-8xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 mb-4 brightness-0 invert" />
              <span className="text-white text-lg font-bold block mb-2">DreamCasa AI</span>
              <p className="text-gray-400">Transform your spaces with AI</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  {user ? (
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection('design');
                        setShowFullHome(true);
                        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Features
                    </a>
                  ) : (
                    <a href="#features" className="text-gray-400 hover:text-white">Features</a>
                  )}
                </li>
                <li>
                  {user ? (
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection('design');
                        setShowFullHome(true);
                        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Pricing
                    </a>
                  ) : (
                    <a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a>
                  )}
                </li>
                <li>
                  {user ? (
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection('design');
                        setShowFullHome(true);
                        document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Portfolio
                    </a>
                  ) : (
                    <a href="#portfolio" className="text-gray-400 hover:text-white">Portfolio</a>
                  )}
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  {user ? (
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection('design');
                        setShowFullHome(true);
                        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      FAQ
                    </a>
                  ) : (
                    <a href="#faq" className="text-gray-400 hover:text-white">FAQ</a>
                  )}
                </li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DreamCasa AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

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
        onGenerationComplete={triggerProjectsRefresh}
      />
      <ErrorModal
        isOpen={design.errorModal.isOpen}
        onClose={() => design.setErrorModal({...design.errorModal, isOpen: false})}
        title={design.errorModal.title}
        message={design.errorModal.message}
      />
    </SeoWrapper>
  );
}

export default App;
