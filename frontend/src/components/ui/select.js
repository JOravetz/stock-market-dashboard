// src/components/ui/select.js
import React from 'react';

const Select = ({ value, onValueChange, children, className = '', placeholder, isDark }) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    className={`block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
    ${className} 
    ${isDark 
      ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
    }`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {children}
  </select>
);

const SelectTrigger = ({ children }) => children;

const SelectValue = ({ children }) => children;

const SelectContent = ({ children }) => children;

const SelectItem = ({ value, children }) => (
  <option value={value} className="py-2">
    {children}
  </option>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
