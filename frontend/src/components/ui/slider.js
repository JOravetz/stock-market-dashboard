// src/components/ui/slider.js
import React from 'react';

const Slider = ({ defaultValue, max, step, onValueChange, className }) => {
  return (
    <input
      type="range"
      min="0"
      max={max}
      step={step}
      defaultValue={defaultValue[0]}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className={`w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none 
                  cursor-pointer accent-blue-600 dark:accent-blue-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className}`}
    />
  );
};

export { Slider };
