import React from 'react';

export interface TransformationMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface TransformationModeSelectorProps {
  onModeSelect: (mode: TransformationMode) => void;
  selectedModeId?: string;
}

export function TransformationModeSelector({ onModeSelect, selectedModeId }: TransformationModeSelectorProps) {
  const TRANSFORMATION_MODES: TransformationMode[] = [
    {
      id: 'virtual-staging',
      name: 'Virtual Staging',
      description: 'Furnish your empty rooms with photorealistic furniture',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      id: 'empty-space',
      name: 'Empty Your Space',
      description: 'Remove furniture and objects to create a neutral environment',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="15"></line>
          <line x1="15" y1="9" x2="9" y2="15"></line>
        </svg>
      )
    },
    {
      id: 'redesign',
      name: 'Redesign & Style',
      description: 'Renovate existing rooms with new design styles',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20"></path>
          <path d="M6 12a10 10 0 0 1 10-10v10z"></path>
          <path d="M18 12a10 10 0 0 1-10 10v-10z"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TRANSFORMATION_MODES.map((mode) => (
        <div
          key={mode.id}
          className={`
            p-3 rounded-lg border-2 cursor-pointer transition-all
            ${selectedModeId === mode.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }
          `}
          onClick={() => onModeSelect(mode)}
        >
          <div className="flex items-center relative group">
            <div className={`w-6 h-6 flex items-center justify-center mr-2 ${selectedModeId === mode.id ? 'text-blue-500' : 'text-gray-500'}`}>
              {mode.icon}
            </div>
            <h3 className="font-semibold text-sm">{mode.name}</h3>
            
            {/* Tooltip that appears on hover */}
            <div className="absolute left-0 right-0 bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-left">
                <p className="text-sm text-gray-600">{mode.description}</p>
              </div>
              <div className="w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45 absolute left-1/2 -ml-1.5"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
