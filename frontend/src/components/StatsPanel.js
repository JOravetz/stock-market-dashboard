// src/components/StatsPanel.js
import React, { useMemo } from 'react';
import { TrendingUp, BarChart2, Activity, DollarSign } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend = null, trendValue = null, isDark }) => (
  <div className={`${
    isDark ? 'bg-gray-800' : 'bg-white'
  } rounded-lg shadow-md p-6 transition-all hover:shadow-lg`}>
    <div className="flex items-center justify-between space-x-4">
      <div className="flex-1">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {title}
        </h3>
        <p className={`mt-3 text-2xl font-bold ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {value}
        </p>
        {trend && trendValue && (
          <p className={`mt-2 text-sm font-medium flex items-center ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            <TrendingUp 
              className={`w-4 h-4 mr-1 transition-transform ${
                trend === 'up' ? '' : 'rotate-180'
              }`}
            />
            {trendValue}
          </p>
        )}
      </div>
      <div className={`rounded-full p-3 ${
        isDark ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <Icon className={`w-6 h-6 ${
          isDark ? 'text-gray-400' : 'text-gray-400'
        }`} />
      </div>
    </div>
  </div>
);

const StockList = ({ title, stocks, type = null, isDark }) => (
  <div className={`${
    isDark ? 'bg-gray-800' : 'bg-white'
  } rounded-lg shadow-md p-6 h-full`}>
    <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${
      isDark 
        ? 'text-gray-100 border-gray-700' 
        : 'text-gray-900 border-gray-200'
    }`}>
      {title}
    </h3>
    <div className="space-y-3">
      {stocks.map(stock => (
        <div 
          key={stock.symbol}
          className={`flex items-center justify-between py-2 px-2 rounded ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <span className={`font-medium ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {stock.symbol}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {type === 'price' && (
              <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                {stock.value}
              </span>
            )}
            {type === 'volume' && (
              <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                {stock.value}
              </span>
            )}
            {(type === 'gainers' || type === 'losers') && (
              <span className={`font-semibold ${
                stock.percent_change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {stock.percent_change >= 0 ? '+' : ''}{stock.percent_change.toFixed(2)}%
              </span>
            )}
            {type === 'trades' && (
              <span className={isDark ? 'text-gray-300' : 'text-gray-900'}>
                {stock.value}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const formatLargeNumber = (num) => {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toLocaleString();
};

const formatPrice = (price) => {
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const StatsPanel = ({ stocks, isDark }) => {
  const stats = useMemo(() => {
    if (!stocks.length) return null;

    // Sort stocks by various metrics
    const sortedByGain = [...stocks].sort((a, b) => b.percent_change - a.percent_change);
    const sortedByVolume = [...stocks].sort((a, b) => b.volume - a.volume);
    const sortedByTrades = [...stocks].sort((a, b) => b.trade_count - a.trade_count);

    // Calculate market stats
    const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
    const totalTrades = stocks.reduce((sum, stock) => sum + stock.trade_count, 0);
    const avgPrice = stocks.reduce((sum, stock) => sum + stock.current_price, 0) / stocks.length;
    
    // Calculate market trend
    const gainers = stocks.filter(stock => stock.percent_change > 0);
    const marketTrend = {
      gainers: gainers.length,
      losers: stocks.length - gainers.length,
      ratio: ((gainers.length / stocks.length) * 100).toFixed(1)
    };

    // Format the lists with consistent structure
    const formatStockList = (list, type, valueKey, formatFn) => {
      return list.slice(0, 5).map(stock => ({
        symbol: stock.symbol,
        percent_change: stock.percent_change,
        value: formatFn(stock[valueKey])
      }));
    };

    return {
      totalVolume,
      totalTrades,
      avgPrice,
      marketTrend,
      topGainers: formatStockList(sortedByGain, 'gainers', 'current_price', formatPrice),
      topLosers: formatStockList(sortedByGain.slice(-5).reverse(), 'losers', 'current_price', formatPrice),
      mostActiveVolume: formatStockList(sortedByVolume, 'volume', 'volume', formatLargeNumber),
      mostActiveTrades: formatStockList(sortedByTrades, 'trades', 'trade_count', formatLargeNumber)
    };
  }, [stocks]);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Volume"
          value={formatLargeNumber(stats.totalVolume)}
          icon={BarChart2}
          isDark={isDark}
        />
        <StatCard
          title="Total Trades"
          value={formatLargeNumber(stats.totalTrades)}
          icon={Activity}
          isDark={isDark}
        />
        <StatCard
          title="Average Price"
          value={formatPrice(stats.avgPrice)}
          icon={DollarSign}
          isDark={isDark}
        />
        <StatCard
          title="Market Breadth"
          value={`${stats.marketTrend.ratio}% Up`}
          icon={TrendingUp}
          trend={stats.marketTrend.gainers > stats.marketTrend.losers ? 'up' : 'down'}
          trendValue={`${stats.marketTrend.gainers} ↑ ${stats.marketTrend.losers} ↓`}
          isDark={isDark}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StockList
          title="Top Gainers"
          stocks={stats.topGainers}
          type="gainers"
          isDark={isDark}
        />
        <StockList
          title="Top Losers"
          stocks={stats.topLosers}
          type="losers"
          isDark={isDark}
        />
        <StockList
          title="Most Active by Volume"
          stocks={stats.mostActiveVolume}
          type="volume"
          isDark={isDark}
        />
        <StockList
          title="Most Active by Trades"
          stocks={stats.mostActiveTrades}
          type="trades"
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default StatsPanel;
