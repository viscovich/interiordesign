import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarMenuProps {
  activeSection: string | null;
  setActiveSection: (section: string) => void;
  onNewProjectClick: () => void;
  setShowFullHome: (show: boolean) => void;
  user: any; // TODO: Replace with proper user type
}

const authMenuItems = [
  { name: 'My projects', section: 'projects', iconClass: 'fas fa-folder' },
  { name: 'My Objects', section: 'objects', iconClass: 'fas fa-cube' },
  { name: 'Community', section: 'community', iconClass: 'fas fa-users' },
];

const mainMenuItems = [
  { name: 'Features', section: 'features', iconClass: 'fas fa-star' },
  { name: 'Pricing', section: 'pricing', iconClass: 'fas fa-tag' },
  { name: 'Portfolio', section: 'portfolio', iconClass: 'fas fa-images' },
  { name: 'FAQ', section: 'faq', iconClass: 'fas fa-question-circle' },
];

export function SidebarMenu({ activeSection, setActiveSection, onNewProjectClick, setShowFullHome, user }: SidebarMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - only shown on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar - shown on desktop for authenticated users */}
      {user && (
        <aside className="hidden lg:block w-full h-full bg-gray-50 text-gray-800 overflow-y-auto">
          <div className="p-4">
            {/* New Project Button */}
            <button
              onClick={() => {
                setShowFullHome(false);
                onNewProjectClick();
              }}
              className="w-full bg-custom text-white p-3 !rounded-button flex items-center justify-center space-x-2 mb-8"
            >
              <i className="fas fa-plus"></i>
              <span>New Project</span>
            </button>

            {/* Navigation Links */}
            <nav className="space-y-2">
              {authMenuItems.map((item) => (
                <a
                  key={item.name}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowFullHome(false);
                    setActiveSection(item.section);
                  }}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    activeSection === item.section
                      ? 'bg-gray-200 text-custom'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <i className={`${item.iconClass} w-5 h-5`}></i>
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar - only shown on mobile */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-gray-50 text-gray-800 border-r border-gray-200 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out`}>
        <div className="p-4">
          {/* New Project Button */}
          <button
            onClick={() => {
              setShowFullHome(false);
              onNewProjectClick();
              setIsMobileMenuOpen(false); // Close mobile menu when New Project is clicked
            }}
            className="w-full bg-custom text-white p-3 !rounded-button flex items-center justify-center space-x-2 mb-8"
          >
            <i className="fas fa-plus"></i>
            <span>New Project</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {mainMenuItems.map((item) => (
              <a
                key={item.name}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowFullHome(true);
                  setActiveSection('design');
                  document.getElementById(item.section)?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  activeSection === item.section
                    ? 'bg-gray-200 text-custom'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className={`${item.iconClass} w-5 h-5`}></i>
                <span>{item.name}</span>
              </a>
            ))}

            {user && authMenuItems.map((item) => (
              <a
                key={item.name}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowFullHome(false);
                  setActiveSection(item.section);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  activeSection === item.section
                    ? 'bg-gray-200 text-custom'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className={`${item.iconClass} w-5 h-5`}></i>
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
