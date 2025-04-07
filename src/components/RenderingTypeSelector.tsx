import React from 'react';
import { Box, Grid3x3, Map as MapIcon } from 'lucide-react';

interface RenderingTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RenderingTypeSelector({ value, onChange }: RenderingTypeSelectorProps) {
  const options = [
    { value: '3d', label: '3D rendering', icon: Box },
    { value: 'wireframe', label: 'Wireframe sketch', icon: Grid3x3 },
    { value: '2d', label: '2D floor plan', icon: MapIcon }
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-12 
            ${value === option.value 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'}`}
        >
          <option.icon className="h-5 w-5 text-gray-700 mb-0.5" />
          <span className="text-[10px] text-center leading-tight">
            {option.value === '3d' ? '3D' : 
             option.value === 'wireframe' ? 'Wireframe' : '2D'}
          </span>
        </button>
      ))}
    </div>
  );
}
