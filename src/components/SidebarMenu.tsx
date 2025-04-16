import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarMenuProps {
  activeSection: string | null;
  setActiveSection: (section: string) => void;
  onNewProjectClick: () => void;
  setShowFullHome: (show: boolean) => void;
}

const menuItems = [
  { name: 'My projects', section: 'projects', iconClass: 'fas fa-folder' },
  { name: 'My Objects', section: 'objects', iconClass: 'fas fa-cube' },
  { name: 'Community', section: 'community', iconClass: 'fas fa-users' },
];

export function SidebarMenu({ activeSection, setActiveSection, onNewProjectClick, setShowFullHome }: SidebarMenuProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
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

      {/* Sidebar - hidden on mobile unless menu is open */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-50 text-gray-800 border-r border-gray-200 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out`}>
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
            {menuItems.map((item) => (
              <a
                key={item.name}
                href="#"
              onClick={(e) => {
                e.preventDefault();
                setShowFullHome(false);
                setActiveSection(item.section);
                setIsMobileMenuOpen(false); // Close mobile menu when item is selected
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
