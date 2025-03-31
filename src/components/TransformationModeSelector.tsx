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
  const TRANSFORMATION_MODES: TransformationMode[] = [];

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
