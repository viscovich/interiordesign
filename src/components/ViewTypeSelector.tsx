import React from 'react';
import { Camera, Box, Map } from 'lucide-react';

interface ViewTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ViewTypeSelector({ value, onChange }: ViewTypeSelectorProps) {
  const options = [
    { value: 'frontal', label: 'Front view', icon: Camera },
    { value: 'side', label: 'Side view', icon: Box },
    { value: 'top', label: 'Top view', icon: Map }
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
            {option.value === 'frontal' ? 'Frontale' : 
             option.value === 'side' ? 'Laterale' : 'Dall\'alto'}
          </span>
        </button>
      ))}
    </div>
  );
}
