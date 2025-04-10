import React from 'react';
import { Camera, Box, Map } from 'lucide-react';

interface ViewTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  renderingType: string | null; // Add renderingType prop
}

export function ViewTypeSelector({ value, onChange, renderingType }: ViewTypeSelectorProps) { // Add renderingType to destructuring
  const options = [
    { value: 'frontal', label: 'Front view', icon: Camera },
    { value: 'side', label: 'Side view', icon: Box },
    { value: 'top', label: 'Top view', icon: Map }
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map((option) => {
        const isDisabled = renderingType === '2d' && option.value !== 'top';
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => !isDisabled && onChange(option.value)} // Prevent onClick if disabled
            disabled={isDisabled} // Add disabled attribute
            className={`flex flex-col items-center justify-center p-1 rounded border transition-colors h-12 
              ${value === option.value 
                ? 'border-blue-500 bg-blue-50' 
                : isDisabled 
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' // Disabled styling
                  : 'border-gray-300 hover:border-blue-400'}`} // Normal styling
          >
            <option.icon className={`h-5 w-5 mb-0.5 ${isDisabled ? 'text-gray-400' : 'text-gray-700'}`} /> {/* Adjust icon color when disabled */}
          <span className="text-[10px] text-center leading-tight">
            {option.value === 'frontal' ? 'Frontale' : 
             option.value === 'side' ? 'Laterale' : 'Dall\'alto'}
          </span>
          </button>
        );
      })}
    </div>
  );
}
