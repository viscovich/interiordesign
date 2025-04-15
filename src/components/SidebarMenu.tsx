import React from 'react';
// Removed Heroicons imports, will use Font Awesome classes directly

interface SidebarMenuProps {
  activeSection: string | null; // Keep activeSection prop
  setActiveSection: (section: string) => void; // Keep setActiveSection prop
  onNewProjectClick: () => void; // Add the new prop
  setShowFullHome: (show: boolean) => void; // Add new prop for full home toggle
}

// Define menu items with Font Awesome classes
const menuItems = [
  // Note: "New Project" is handled separately as a button above the nav
  { name: 'My projects', section: 'projects', iconClass: 'fas fa-folder' },
  { name: 'My Objects', section: 'objects', iconClass: 'fas fa-cube' },
  { name: 'Community', section: 'community', iconClass: 'fas fa-users' }, // Changed icon to match target
];

export function SidebarMenu({ activeSection, setActiveSection, onNewProjectClick, setShowFullHome }: SidebarMenuProps) { // Destructure all props
  return (
    // Changed positioning and styling to match target layout
    <aside className="w-64 bg-gray-50 text-gray-800 border-r border-gray-200">
      <div className="p-4">
        {/* New Project Button */}
        <button
          onClick={() => {
            setShowFullHome(false);
            onNewProjectClick();
          }}
          className="w-full bg-custom text-white p-3 !rounded-button flex items-center justify-center space-x-2 mb-8" // Added margin-bottom
        >
          <i className="fas fa-plus"></i>
          <span>New Project</span> {/* Changed text to English */}
        </button>

        {/* Navigation Links */}
        <nav className="space-y-2"> {/* Removed mt-8, handled by button margin */}
          {menuItems.map((item) => (
            <a // Changed to <a> tag for semantic correctness, though button functionality is kept via onClick
              key={item.name}
              href="#" // Added href for <a> tag
              onClick={(e) => {
                e.preventDefault(); // Prevent default link behavior
                setShowFullHome(false);
                setActiveSection(item.section);
              }}
              className={`flex items-center space-x-3 p-3 rounded-lg ${ // Adjusted padding and spacing
                activeSection === item.section
                  ? 'bg-gray-200 text-custom' // Active state styles
                  : 'text-gray-600 hover:bg-gray-200' // Default and hover styles
              }`}
            >
              <i className={`${item.iconClass} w-5 h-5`}></i> {/* Use iconClass, added width/height */}
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
