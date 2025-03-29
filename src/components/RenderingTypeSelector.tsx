import React from 'react';
import { Box, Grid3x3, Map as MapIcon } from 'lucide-react';

interface RenderingTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RenderingTypeSelector({ value, onChange }: RenderingTypeSelectorProps) {
  const options = [
    { value: '3d', label: '3D', icon: Box },
    { value: 'wireframe', label: 'Wireframe', icon: Grid3x3 },
    { value: '2d', label: 'Piantina 2D', icon: MapIcon }
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Tipo di rendering</h3>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex flex-col items-center p-2 rounded border transition-colors h-24
              ${value === option.value 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'}`}
          >
            <option.icon className="h-8 w-8 text-gray-700 mb-1" />
            <span className="text-xs">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
