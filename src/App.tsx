import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './lib/auth';
import SeoWrapper from './components/SeoWrapper';
import { SidebarMenu } from './components/SidebarMenu';
// import { CommunitySection } from './components/CommunitySection'; // Original import, commented out
import { FloatingObjectsSidebar } from './components/FloatingObjectsSidebar';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import ImageModificationModal from './components/ImageModificationModal';
import { UserAccountDropdown } from './components/UserAccountDropdown';
import useUserObjects from './hooks/useUserObjects';
import { UserObject } from './lib/userObjectsService'; // Import UserObject type
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
import CommunityProjectsSection from './sections/CommunityProjectsSection'; // Reverted import path

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
  // Remove activeSection argument from useUserObjects call
  const objects = useUserObjects(user?.id); 

  // Removed duplicate handleNewDesign

  const handleNewDesign = () => {
    design.startNewProject(); // Use the new function to reset and pre-fill image
    setActiveSection('design');
  };

  // Restored handleScrollToDesign
  const handleScrollToDesign = () => {
    setActiveSection('design');
    document.getElementById('design-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [newProjectId, setNewProjectId] = useState<string | null>(null);

  // Update handleGenerate to accept selectedObjects
  const handleGenerate = async (selectedObjects: UserObject[]) => { 
    // Pass selectedObjects to the hook's handleGenerate method
    const projectId = await design.handleGenerate(selectedObjects); 
    console.log('Generation result:', projectId);
    if (projectId) {
      setNewProjectId(projectId);
      triggerProjectsRefresh();
      setActiveSection('projects');
    }
  };

  // Handle pending generation after login - NOTE: This won't have selected objects!
  // This flow might need rethinking if objects are required for pending generations.
  // For now, we'll pass an empty array.
  React.useEffect(() => {
    if (user && modals.pendingGenerate) {
      handleGenerate([]); // Pass empty array for pending generation
      modals.setPendingGenerate(false);
    }
  }, [user, modals.pendingGenerate, handleGenerate]); // Added handleGenerate dependency

  const triggerProjectsRefresh = () => {
    setProjectsRefreshKey(prevKey => prevKey + 1);
  };



  return (
    <SeoWrapper
      title="Transform Your Space with AI"
      description="Upload a photo and let AI redesign your room in your preferred style. Get stunning results in seconds."
      ogImage="/images/before_after.jpg"
    >
      {/* Header - Removed fixed positioning */}
      <header className="bg-white shadow-sm border-b border-gray-200"> {/* Added border like target */}
        <nav className="container max-w-8xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Matched padding */}
          <div className="flex items-center justify-between h-16"> {/* Matched height */}
            <div className="flex items-center"> {/* Kept flex items-center */}
              <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 w-auto" /> {/* Matched height */}
              <span className="ml-2 text-xl font-semibold text-custom">DreamCasa AI</span> {/* Matched font weight */}
            </div>
            {/* Right side of header */}
            <div className="flex items-center space-x-4">
              {/* User Account/Sign Out */}
              {!authLoading && user && (
                 <div className="flex items-center gap-4">
                    <UserAccountDropdown /> {/* Restored dropdown */}
                  </div>
              )}
              {/* Sign In/Register buttons for logged-out state (kept original logic) */}
              {!authLoading && !user && (
                 <div className="hidden md:flex items-center space-x-4"> {/* Kept original responsive logic */}
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
              {/* Original Nav Links (Removed as they are not in the target logged-in view) */}
              {/* {!user && (
                <>
                  <a href="#features" className="text-gray-600 hover:text-custom">Features</a>
                  <a href="#pricing" className="text-gray-600 hover:text-custom">Pricing</a>
                  <a href="#portfolio" className="text-gray-600 hover:text-custom">Portfolio</a>
                  <a href="#faq" className="text-gray-600 hover:text-custom">FAQ</a>
              )} */}
            </div> {/* End right side */}
          </div>
        </nav>
      </header>

      {/* Added flex container for sidebar and main content */}
      <div className="flex-1 flex">
        {/* Render sidebar conditionally */}
        {user && (
          <SidebarMenu
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onNewProjectClick={handleNewDesign} // Pass the handler down
          />
        )}

        {/* Main content area: Removed pt-20 and ml-64 */}
        <main className={`flex-1 ${user ? '' : 'w-full'}`}> {/* Ensure main takes full width if no sidebar */}
          {/* Render sections based on activeSection and user status */}
          {/* Wrap sections in a div with padding */}
          <div className="p-8">
            {!user && (
              <> {/* Keep logged-out view as is */}
                <HeroSection // Keep logged-out view as is
                  onScrollToDesign={handleScrollToDesign} // Keep logged-out view as is
                  onScrollToFeatures={handleScrollToFeatures} // Keep logged-out view as is
                /> {/* Keep logged-out view as is */}
                <DesignSection
                  uploadedImage={design.uploadedImage}
                  isGenerating={design.isGenerating}
                  selectedStyle={design.selectedStyle}
                  selectedRoomType={design.selectedRoomType}
                  selectedColorTone={design.selectedColorTone}
                  selectedView={design.selectedView}
                  selectedRenderingType={design.selectedRenderingType}
                  onImageUpload={design.handleImageUpload}
                  onReset={design.resetUpload} // Re-added prop
                  onGenerate={handleGenerate}
                  onStyleSelect={design.setSelectedStyle}
                  onRoomTypeSelect={design.setSelectedRoomType}
                  onColorToneSelect={design.setSelectedColorTone}
                  onViewChange={design.setSelectedView}
                  onRenderingTypeChange={design.setSelectedRenderingType}
                  isAuthenticated={!!user}
                  hasObjects={objects.userObjects.length > 0}
                />
                <FeaturesSection /> {/* Keep logged-out view as is */}
                <PricingSection /> {/* Keep logged-out view as is */}
                <PortfolioSection /> {/* Keep logged-out view as is */}
                <FAQSection /> {/* Keep logged-out view as is */}
              </> // Keep logged-out view as is
            )}

            {/* Logged-in view sections */}
            {activeSection === 'design' && user && (() => { // Remove console logs
              const hasObjectsValue = objects.userObjects.length > 0;
              // console.log('[App.tsx] Rendering DesignSection:');
              // console.log('  - User:', user);
              // console.log('  - objects.userObjects:', objects.userObjects);
              // console.log('  - hasObjects prop:', hasObjectsValue);
              return (
                <DesignSection
                uploadedImage={design.uploadedImage}
                isGenerating={design.isGenerating}
                selectedStyle={design.selectedStyle}
                selectedRoomType={design.selectedRoomType}
                selectedColorTone={design.selectedColorTone}
                selectedView={design.selectedView}
                selectedRenderingType={design.selectedRenderingType}
                onImageUpload={design.handleImageUpload}
                onReset={design.resetUpload} // Re-added prop
                onGenerate={handleGenerate}
                onStyleSelect={design.setSelectedStyle}
                onRoomTypeSelect={design.setSelectedRoomType}
                onColorToneSelect={design.setSelectedColorTone}
                onViewChange={design.setSelectedView}
                onRenderingTypeChange={design.setSelectedRenderingType}
                  isAuthenticated={!!user}
                  hasObjects={hasObjectsValue}
                  userId={user?.id} // Ensure userId is passed
                />
              );
            })()}

              {/* ResultsSection removed from main flow based on activeSection */}
              {/* {design.generatedImage && activeSection === 'results' && (
              <ResultsSection
                originalImage={design.uploadedImage!}
                generatedImage={design.generatedImage}
                onNewDesign={handleNewDesign}
              />
            )} */}

              {/* Render sections based on activeSection */}
              {activeSection === 'projects' && user && (
                <ProjectsSection
                  user={user}
                  onModifyProject={modals.handleOpenModificationModal}
                  refreshKey={projectsRefreshKey} // Pass refresh key down
                />
              )}

              {/* Render UserObjectsManager only if authenticated AND has objects */}
              {activeSection === 'objects' && user && objects.userObjects.length > 0 && (
                <UserObjectsManager />
              )}

              {/* Optional: Show a message if authenticated but has no objects */}
              {activeSection === 'objects' && user && objects.userObjects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <h2 className="text-2xl font-semibold mb-4">My Objects</h2>
                  <p>You haven't uploaded any objects yet.</p>
                  {/* Consider adding a button/link to upload objects here */}
                </div>
              )}

              {activeSection === 'community' && user && (
                 <CommunityProjectsSection /> // Render the new section
              )}
            </div> {/* End padding div */}
          </main> {/* End main content */}
        </div> {/* End flex container */}

        {/* Footer: Reverted to dark theme, kept layout adjustments */}
        <footer className={`bg-gray-900 text-white py-12 ${user ? '' : 'w-full'}`}> {/* Reverted background, text color */}
          <div className="container max-w-8xl mx-auto px-4"> {/* Kept container adjustments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8"> {/* Reverted to 3 columns like original */}
              {/* Column 1: Logo and tagline */}
              <div>
                <img src="/images/Dreamcasa3-removebg-preview.png" alt="DreamCasa AI Logo" className="h-8 mb-4 brightness-0 invert" /> {/* Restored invert/brightness */}
                <span className="text-white text-lg font-bold block mb-2">DreamCasa AI</span> {/* Restored styles */}
                <p className="text-gray-400">Transform your spaces with artificial intelligence</p> {/* Restored styles */}
              </div>
              {/* Column 2: Product Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Product</h4> {/* Restored styles */}
                <ul className="space-y-2">
                  <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li> {/* Restored styles */}
                  <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li> {/* Restored styles */}
                  <li><a href="#portfolio" className="text-gray-400 hover:text-white">Portfolio</a></li> {/* Restored styles */}
                </ul>
              </div>
              {/* Column 3: Support Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4> {/* Restored styles */}
                <ul className="space-y-2">
                  <li><a href="#faq" className="text-gray-400 hover:text-white">FAQ</a></li> {/* Restored styles */}
                  <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li> {/* Restored styles */}
                  <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li> {/* Restored styles */}
                </ul>
              </div>
              {/* Column 4: Social Links (Removed as it wasn't in original dark footer) */}
            </div>
            {/* Copyright - Restored border-t and text color */}
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400"> {/* Restored styles */}
              <p>&copy; 2025 DreamCasa AI. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Modals (Keep as is) */}
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
    </SeoWrapper> // Added missing closing tag
  );
}

export default App; // Added missing closing tag
