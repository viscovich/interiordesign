import React from 'react';
import {
  PlusIcon,
  FolderIcon,
  CubeIcon, // Using CubeIcon for 'I miei oggetti' as a placeholder for 🛋️
  GlobeAltIcon, // Using GlobeAltIcon for 'Community' as a placeholder for 🌐
} from '@heroicons/react/24/outline'; // Using outline icons for a cleaner look

interface SidebarMenuProps {
  activeSection: string | null;
  setActiveSection: (section: string) => void;
}

const menuItems = [
  { name: 'New Projects', section: 'design', icon: PlusIcon }, // 'design' section seems appropriate for new project creation
  { name: 'My projects', section: 'projects', icon: FolderIcon },
  { name: 'My Objects', section: 'objects', icon: CubeIcon },
  { name: 'Community', section: 'community', icon: GlobeAltIcon },
];

export function SidebarMenu({ activeSection, setActiveSection }: SidebarMenuProps) {
  return (
    // Revert to fixed positioning, spanning from below header to viewport bottom
    <aside className="fixed top-20 bottom-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-700 overflow-y-auto"> 
      <div className="px-3 py-4"> {/* Adjusted padding */}
        <ul className="space-y-2 font-medium">
          {menuItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => setActiveSection(item.section)}
                className={`flex items-center p-2 text-gray-100 rounded-lg hover:bg-gray-700 group w-full text-left ${ // Kept text color, hover background
                  activeSection === item.section ? 'bg-gray-700' : '' // Adjusted active background slightly for gray-900
                }`}
              >
                <item.icon
                  className={`w-6 h-6 text-gray-400 transition duration-75 group-hover:text-gray-100 ${ // Kept icon color, hover icon color
                    activeSection === item.section ? 'text-gray-100' : '' // Kept active icon color
                  }`}
                  aria-hidden="true"
                />
                <span className="ml-3">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
