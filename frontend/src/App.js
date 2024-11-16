// src/App.js
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import StockTable from './components/StockTable';
import FilterControls from './components/FilterControls';
import StatsPanel from './components/StatsPanel';
import TradeChartModal from './components/TradeChartModal';
import { Moon, Sun } from 'lucide-react';

// Network configuration
const API_HOST = process.env.REACT_APP_API_HOST || window.location.hostname;
const API_PORT = process.env.REACT_APP_API_PORT || '8000';
const WS_PORT = process.env.REACT_APP_WS_PORT || '8000';

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WEBSOCKET_URL = `${protocol}//${API_HOST}:${WS_PORT}/ws`;
const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

function App() {
  // State for data management
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'trade_count',
    direction: 'desc'
  });
  const [filterConfig, setFilterConfig] = useState({
    minPrice: 0,
    maxPrice: Infinity,
    minVolume: 0,
    maxVolume: Infinity,
    minTradeCount: 0,
    displayCount: 50
  });
  
  // State for modal and chart
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('darkTheme');
    return saved ? JSON.parse(saved) : false;
  });

  // WebSocket connection
  const { lastMessage, connectionStatus } = useWebSocket(WEBSOCKET_URL);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
    localStorage.setItem('darkTheme', JSON.stringify(isDarkTheme));
  }, [isDarkTheme]);

  // Process incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === 'market_data') {
          setStocks(message.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...stocks];

    filtered = filtered.filter(stock => {
      return (
        stock.current_price >= filterConfig.minPrice &&
        stock.current_price <= filterConfig.maxPrice &&
        stock.volume >= filterConfig.minVolume &&
        stock.volume <= filterConfig.maxVolume &&
        stock.trade_count >= filterConfig.minTradeCount
      );
    });

    filtered.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    filtered = filtered.slice(0, filterConfig.displayCount);
    setFilteredStocks(filtered);
  }, [stocks, sortConfig, filterConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSymbolClick = async (symbol) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedSymbol(symbol);
      setIsModalOpen(true);
      
      const response = await fetch(`${API_BASE_URL}/api/historical/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        const chartData = data.data.map(point => ({
          timestamp: new Date(point.timestamp),
          price: point.price,
          volume: point.volume // Added volume to the historical data
        }));
        setHistoricalData(chartData);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError(error.message);
      console.error('Error fetching historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkTheme ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${
                isDarkTheme ? 'text-white' : 'text-gray-900'
              }`}>
                JoeBob's Stock Market Stream
              </h1>
              <p className={`mt-2 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Real-time market data and analysis
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                isDarkTheme ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span>
                  {connectionStatus === 'connected' ? 'Connected' :
                   connectionStatus === 'connecting' ? 'Connecting...' :
                   'Disconnected'}
                </span>
              </div>
              <button
                onClick={() => setIsDarkTheme(!isDarkTheme)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkTheme 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label="Toggle theme"
              >
                {isDarkTheme ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </header>
        
        <main className="space-y-8">
          <section>
            <StatsPanel 
              stocks={stocks} 
              isDark={isDarkTheme}
            />
          </section>

          <section className={`${
            isDarkTheme ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-md p-6`}>
            <FilterControls 
              filterConfig={filterConfig}
              setFilterConfig={setFilterConfig}
              isDark={isDarkTheme}
            />
          </section>

          <section className={`${
            isDarkTheme ? 'bg-gray-800' : 'bg-white'
          } rounded-lg shadow-md overflow-hidden`}>
            <StockTable 
              stocks={filteredStocks}
              sortConfig={sortConfig}
              onSort={handleSort}
              onSymbolClick={handleSymbolClick}
              isDark={isDarkTheme}
            />
          </section>
        </main>

        <TradeChartModal
          symbol={selectedSymbol}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trades={historicalData}
          isLoading={isLoading}
          error={error}
          isDark={isDarkTheme}
        />
      </div>
    </div>
  );
}

export default App;
