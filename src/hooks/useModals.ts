import { useState } from 'react';

export default function useModals() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isModificationModalOpen, setIsModificationModalOpen] = useState(false);
  const [isObjectsSidebarOpen, setIsObjectsSidebarOpen] = useState(false);
  const [projectToModify, setProjectToModify] = useState<any | null>(null);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  
  // Handle pending generation after successful login
  const handlePendingGenerate = () => {
    if (pendingGenerate) {
      setPendingGenerate(false);
      return true;
    }
    return false;
  };

  const handleOpenModificationModal = (project: any) => {
    setProjectToModify(project);
    setIsModificationModalOpen(true);
  };

  const handleCloseModificationModal = () => {
    setIsModificationModalOpen(false);
    setProjectToModify(null);
  };

  const toggleLoginModal = () => setIsLoginModalOpen(!isLoginModalOpen);
  const toggleRegisterModal = () => setIsRegisterModalOpen(!isRegisterModalOpen);
  const toggleObjectsSidebar = () => setIsObjectsSidebarOpen(!isObjectsSidebarOpen);

  return {
    isLoginModalOpen,
    isRegisterModalOpen, 
    isModificationModalOpen,
    isObjectsSidebarOpen,
    projectToModify,
    pendingGenerate,
    setIsLoginModalOpen,
    setIsRegisterModalOpen,
    setIsModificationModalOpen,
    setIsObjectsSidebarOpen,
    setPendingGenerate,
    handleOpenModificationModal,
    handleCloseModificationModal,
    toggleLoginModal,
    toggleRegisterModal,
    toggleObjectsSidebar
  };
}
