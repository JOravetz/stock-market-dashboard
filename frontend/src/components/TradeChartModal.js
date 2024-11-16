// src/components/TradeChartModal.js
import React, { useState, useEffect } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Brush,
  Bar
} from 'recharts';
import { X } from 'lucide-react';

// Get API base URL from environment or default
const API_BASE_URL = process.env.REACT_APP_API_HOST 
  ? `http://${process.env.REACT_APP_API_HOST}:${process.env.REACT_APP_API_PORT}`
  : `http://${window.location.hostname}:8000`;

const TradeChartModal = ({ symbol, isOpen, onClose, trades, isLoading, error, isDark }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [companyInfo, setCompanyInfo] = useState({ name: '', exchange: '' });
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch company info when modal opens
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (symbol && isOpen) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/asset/${symbol}`);
          if (response.ok) {
            const data = await response.json();
            setCompanyInfo(data);
          } else {
            console.error('Failed to fetch company info:', await response.text());
          }
        } catch (error) {
          console.error('Error fetching company info:', error);
        }
      }
    };

    fetchCompanyInfo();
  }, [symbol, isOpen]);

  if (!isOpen) return null;

  const formatPrice = (value) => {
    return value ? `$${Number(value).toFixed(3)}` : '';
  };

  const formatVolume = (value) => {
    if (!value) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const formatTimeAxis = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: !isMobile
    });
    return formatter.format(date);
  };

  const formatTooltipTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
    return formatter.format(date);
  };

  // Calculate price statistics and domain
  const prices = trades?.map(t => t.price) || [];
  const volumes = trades?.map(t => t.volume) || [];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;
  const yDomain = [
    Math.max(0, minPrice - padding),
    maxPrice + padding
  ];

  // Calculate volume domain with 20% padding
  const maxVolume = Math.max(...volumes);
  const volumeDomain = [0, maxVolume * 1.2];

  // Calculate price change
  const startPrice = prices[0];
  const endPrice = prices[prices.length - 1];
  const priceChange = endPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const priceData = payload.find(p => p.dataKey === 'price');
      const volumeData = payload.find(p => p.dataKey === 'volume');
      const currentPrice = priceData?.value;
      const currentVolume = volumeData?.value;
      const initialPrice = prices[0];
      const changePercent = ((currentPrice - initialPrice) / initialPrice) * 100;

      return (
        <div className={`px-3 py-2 rounded-lg shadow-lg ${
          isDark 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-xs font-medium mb-1 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {formatTooltipTime(payload[0].payload.timestamp)}
          </p>
          <div className="space-y-1">
            <p className={`text-sm font-bold ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {formatPrice(currentPrice)}
            </p>
            <p className={`text-xs font-medium ${
              changePercent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Vol: {formatVolume(currentVolume)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className={`w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 flex justify-between items-center border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {symbol}
              </h2>
              {companyInfo.exchange && (
                <span className={`text-xs px-2 py-1 rounded ${
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                }`}>
                  {companyInfo.exchange}
                </span>
              )}
            </div>
            {companyInfo.name && (
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {companyInfo.name}
              </p>
            )}
            <div className="flex items-center mt-1 space-x-2">
              <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatPrice(endPrice)}
              </span>
              <span className={`text-sm font-medium ${
                priceChange >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chart Container */}
        <div className={`w-full ${isMobile ? 'h-[60vh]' : 'h-[65vh]'} p-4`}>
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="animate-spin mb-2">⟳</div>
                <span>Loading chart data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <span className="text-red-500">{error}</span>
            </div>
          ) : trades?.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                No data available
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trades}
                margin={{
                  top: 20,
                  right: 65,
                  left: 10,
                  bottom: isMobile ? 60 : 40
                }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDark ? '#374151' : '#e5e7eb'}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimeAxis}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  tick={{ 
                    fill: isDark ? '#9CA3AF' : '#4B5563',
                    fontSize: isMobile ? 10 : 11
                  }}
                  axisLine={{ stroke: isDark ? '#4B5563' : '#E5E7EB' }}
                />
                <YAxis
                  yAxisId="price"
                  domain={yDomain}
                  tickFormatter={formatPrice}
                  width={65}
                  orientation="right"
                  tick={{ 
                    fill: isDark ? '#9CA3AF' : '#4B5563',
                    fontSize: isMobile ? 10 : 11
                  }}
                  axisLine={{ stroke: isDark ? '#4B5563' : '#E5E7EB' }}
                />
                <YAxis
                  yAxisId="volume"
                  domain={volumeDomain}
                  tickFormatter={formatVolume}
                  width={65}
                  orientation="left"
                  tick={{ 
                    fill: isDark ? '#9CA3AF' : '#4B5563',
                    fontSize: isMobile ? 10 : 11
                  }}
                  axisLine={{ stroke: isDark ? '#4B5563' : '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={startPrice}
                  yAxisId="price"
                  stroke={isDark ? '#4B5563' : '#9CA3AF'}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <Bar
                  dataKey="volume"
                  yAxisId="volume"
                  fill={isDark ? '#3B82F6' : '#60A5FA'}
                  opacity={0.3}
                  barSize={20}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  yAxisId="price"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke={isDark ? '#4B5563' : '#9CA3AF'}
                  tickFormatter={formatTimeAxis}
                  fill={isDark ? '#1F2937' : '#F3F4F6'}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Footer - Statistics */}
        <div className={`px-6 py-3 border-t ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Open</span>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatPrice(startPrice)}
              </p>
            </div>
            <div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>High</span>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatPrice(maxPrice)}
              </p>
            </div>
            <div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Low</span>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatPrice(minPrice)}
              </p>
            </div>
            <div>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Close</span>
              <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {formatPrice(endPrice)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeChartModal;
