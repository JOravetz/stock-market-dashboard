// src/components/StockTable.js
import React, { memo } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const formatInt = (num) => {
  return Math.round(num).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const formatNumber = (num, decimals = 2) => {
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const formatLargeNumber = (num) => {
  if (num >= 1e9) {
    return formatNumber(num / 1e9, 2) + 'B';
  } else if (num >= 1e6) {
    return formatNumber(num / 1e6, 2) + 'M';
  } else if (num >= 1e3) {
    return formatNumber(num / 1e3, 2) + 'K';
  }
  return formatNumber(num);
};

const SortIcon = ({ sortConfig, columnKey, isDark }) => {
  if (sortConfig.key !== columnKey) {
    return null;
  }
  const iconClass = `w-4 h-4 inline-block ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
  return sortConfig.direction === 'asc' ? 
    <ArrowUp className={iconClass} /> : 
    <ArrowDown className={iconClass} />;
};

const columns = [
  { 
    key: 'symbol', 
    label: 'Symbol', 
    sortable: true,
    className: 'text-left cursor-pointer hover:text-blue-600'
  },
  { 
    key: 'current_price', 
    label: 'Price', 
    sortable: true, 
    format: (val) => `$${formatNumber(val, 3)}`,
    className: 'text-right'
  },
  { 
    key: 'percent_change', 
    label: 'Change %', 
    sortable: true, 
    format: (val) => `${formatNumber(val, 2)}%`,
    className: 'text-right'
  },
  { 
    key: 'trade_count', 
    label: 'Trades', 
    sortable: true, 
    format: formatInt,
    className: 'text-right'
  },
  { 
    key: 'volume', 
    label: 'Volume', 
    sortable: true, 
    format: formatLargeNumber,
    className: 'text-right'
  },
  { 
    key: 'high', 
    label: 'High', 
    sortable: true, 
    format: (val) => `$${formatNumber(val, 3)}`,
    className: 'text-right'
  },
  { 
    key: 'low', 
    label: 'Low', 
    sortable: true, 
    format: (val) => `$${formatNumber(val, 3)}`,
    className: 'text-right'
  },
  { 
    key: 'vwap', 
    label: 'VWAP', 
    sortable: true, 
    format: (val) => `$${formatNumber(val, 3)}`,
    className: 'text-right'
  },
  { 
    key: 'std_dev', 
    label: 'StdDev', 
    sortable: true, 
    format: (val) => formatNumber(val, 3),
    className: 'text-right'
  }
];

const StockTable = memo(({ stocks, sortConfig, onSort, onSymbolClick, isDark }) => {
  const handleHeaderClick = (key) => {
    if (columns.find(col => col.key === key)?.sortable) {
      onSort(key);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${
        isDark ? 'divide-gray-700' : 'divide-gray-200'
      }`}>
        <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'}>
          <tr>
            {columns.map(({ key, label, sortable, className }) => (
              <th
                key={key}
                onClick={() => handleHeaderClick(key)}
                className={`px-6 py-3 text-xs font-medium tracking-wider ${
                  sortable ? 'cursor-pointer hover:bg-opacity-80' : ''
                } ${isDark ? 'text-gray-300' : 'text-gray-500'} ${className}`}
              >
                <div className={`flex items-center ${key === 'symbol' ? '' : 'justify-end'}`}>
                  {label}
                  <SortIcon 
                    sortConfig={sortConfig} 
                    columnKey={key} 
                    isDark={isDark}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`${
          isDark ? 'bg-gray-900 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'
        }`}>
          {stocks.map((stock) => (
            <tr
              key={stock.symbol}
              className={`${
                isDark 
                  ? 'hover:bg-gray-800 transition-colors duration-150'
                  : 'hover:bg-gray-50 transition-colors duration-150'
              }`}
            >
              {columns.map(({ key, format, className }) => (
                <td
                  key={`${stock.symbol}-${key}`}
                  onClick={() => key === 'symbol' && onSymbolClick(stock.symbol)}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    key === 'symbol' && isDark
                      ? 'text-blue-400 hover:text-blue-300'
                      : key === 'symbol'
                      ? 'text-blue-600 hover:text-blue-700'
                      : key === 'percent_change'
                      ? stock[key] >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                      : isDark
                      ? 'text-gray-300'
                      : 'text-gray-900'
                  } ${className || ''}`}
                >
                  {format ? format(stock[key]) : stock[key]}
                </td>
              ))}
            </tr>
          ))}
          {stocks.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className={`px-6 py-4 text-center text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

StockTable.displayName = 'StockTable';

export default StockTable;
