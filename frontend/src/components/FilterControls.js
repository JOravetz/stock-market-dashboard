// src/components/FilterControls.js
import React, { useCallback } from 'react';
import { Select, SelectItem } from '../components/ui/select';
import { Slider } from '../components/ui/slider';

const displayOptions = [
  { value: 10, label: 'Top 10' },
  { value: 20, label: 'Top 20' },
  { value: 50, label: 'Top 50' },
  { value: 100, label: 'Top 100' },
  { value: 200, label: 'Top 200' }
];

const FilterControls = ({ filterConfig, setFilterConfig, isDark }) => {
  const handleChange = useCallback((field, value) => {
    setFilterConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFilterConfig]);

  const handleRangeChange = useCallback((field, values) => {
    const [min, max] = values;
    setFilterConfig(prev => ({
      ...prev,
      [`min${field}`]: min,
      [`max${field}`]: max
    }));
  }, [setFilterConfig]);

  return (
    <div className="space-y-6">
      <h2 className={`text-lg font-semibold ${
        isDark ? 'text-gray-100' : 'text-gray-900'
      }`}>
        Filters
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Price Range Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Price Range (${filterConfig.minPrice} - ${filterConfig.maxPrice === Infinity ? 'Max' : filterConfig.maxPrice})
          </label>
          <Slider
            defaultValue={[filterConfig.minPrice, filterConfig.maxPrice === Infinity ? 1000 : filterConfig.maxPrice]}
            max={1000}
            step={1}
            onValueChange={(values) => handleRangeChange('Price', values)}
            className={`w-full ${isDark ? 'slider-dark' : ''}`}
            isDark={isDark}
          />
        </div>

        {/* Volume Range Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Volume Range ({formatLargeNumber(filterConfig.minVolume)} - {
              filterConfig.maxVolume === Infinity ? 'Max' : formatLargeNumber(filterConfig.maxVolume)
            })
          </label>
          <Slider
            defaultValue={[filterConfig.minVolume, filterConfig.maxVolume === Infinity ? 1000000 : filterConfig.maxVolume]}
            max={1000000}
            step={1000}
            onValueChange={(values) => handleRangeChange('Volume', values)}
            className={`w-full ${isDark ? 'slider-dark' : ''}`}
            isDark={isDark}
          />
        </div>

        {/* Trade Count Filter */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Minimum Trade Count ({formatLargeNumber(filterConfig.minTradeCount)})
          </label>
          <Slider
            defaultValue={[filterConfig.minTradeCount]}
            max={10000}
            step={100}
            onValueChange={([value]) => handleChange('minTradeCount', value)}
            className={`w-full ${isDark ? 'slider-dark' : ''}`}
            isDark={isDark}
          />
        </div>

        {/* Display Count Selector */}
        <div className="space-y-2">
          <label className={`block text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Display Count
          </label>
          <Select
            value={filterConfig.displayCount.toString()}
            onValueChange={(value) => handleChange('displayCount', parseInt(value))}
            isDark={isDark}
          >
            {displayOptions.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value.toString()}
              >
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Reset Filters Button */}
      <button
        onClick={() => setFilterConfig({
          minPrice: 0,
          maxPrice: Infinity,
          minVolume: 0,
          maxVolume: Infinity,
          minTradeCount: 0,
          displayCount: 50
        })}
        className={`mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isDark 
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Reset Filters
      </button>
    </div>
  );
};

// Helper function for formatting large numbers
const formatLargeNumber = (num) => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
};

export default React.memo(FilterControls);
