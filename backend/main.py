# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import re
import asyncio
import websockets
import json
import logging
import os
from datetime import datetime, timedelta
import statistics
from typing import Dict, Set, Optional
from collections import defaultdict
import aiohttp
from fastapi import HTTPException
import pytz
from alpaca_trade_api.rest import REST
import pandas as pd

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HistoricalDataFetcher:
    def __init__(self, api_key, api_secret, base_url):
        self.api = REST(api_key, api_secret, base_url)
        self.logger = logging.getLogger(__name__)

    async def fetch_historical_data(self, symbol, start_date, end_date, timeframe):
        """
        Fetch historical price and volume data for a symbol.
        
        Args:
            symbol (str): The stock symbol
            start_date (str): Start date in YYYY-MM-DD format
            end_date (str): End date in YYYY-MM-DD format
            timeframe (str): Time frame for the bars ('1Min', '1Hour', '1Day', etc.)
        """
        self.logger.debug(f"Fetching historical data for {symbol} from {start_date} to {end_date} with timeframe {timeframe}")
        try:
            bars = self.api.get_bars(
                symbol,
                timeframe,
                start=start_date,
                end=end_date,
                adjustment='split'
            ).df

            if bars.empty:
                self.logger.warning(f"No data found for {symbol} in the specified date range")
                return pd.DataFrame()

            # Keep only necessary columns
            bars = bars[['close', 'volume']]

            self.logger.info(f"Fetched {len(bars)} bars for {symbol}")
            return bars

        except Exception as e:
            self.logger.error(f"Error fetching historical data for {symbol}: {str(e)}")
            raise

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self.active_connections.discard(websocket)

    async def broadcast(self, message: str):
        disconnected = set()
        async with self._lock:
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.add(connection)
            
            # Remove disconnected clients
            self.active_connections -= disconnected

class MarketDataManager:
    def __init__(self, update_interval: int, proxy_url: str):
        self.trades: Dict[str, list] = defaultdict(list)
        self.trade_counts: Dict[str, int] = defaultdict(int)
        self.volumes: Dict[str, list] = defaultdict(list)
        self.last_processed: Dict[str, datetime] = {}
        self.connection_manager = ConnectionManager()
        self.proxy_url = proxy_url
        self.proxy_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.proxy_task: Optional[asyncio.Task] = None
        self.broadcast_task: Optional[asyncio.Task] = None
        self.update_interval = update_interval
        self.valid_symbol_pattern = re.compile(r'^[A-Z]{1,4}$')
        self.last_broadcast_time = datetime.now()
        self.reconnection_attempts = 0
        self.max_reconnection_delay = 60  # Maximum delay between reconnection attempts in seconds
        self.buffer_lock = asyncio.Lock()
        self.is_connected = False
        self.connection_event = asyncio.Event()

    def is_valid_symbol(self, symbol: str) -> bool:
        """Check if a stock symbol is valid according to criteria"""
        if not symbol:
            return False
        
        if 'TEST' in symbol:
            return False
            
        if any(char in symbol for char in '.^/'):
            return False
            
        return bool(self.valid_symbol_pattern.match(symbol))

    async def update_stock(self, symbol: str, price: float, volume: int):
        """Update stock data with new trade information"""
        if not self.is_valid_symbol(symbol):
            return
            
        async with self.buffer_lock:
            current_time = datetime.now()
            
            # Update trade data
            self.trades[symbol].append(price)
            self.trade_counts[symbol] += 1
            self.volumes[symbol].append(volume)
            self.last_processed[symbol] = current_time
            
            # Keep only last 24 hours of data
            cutoff_time = current_time - timedelta(hours=24)
            self.cleanup_old_data(cutoff_time)

    def cleanup_old_data(self, cutoff_time: datetime):
        """Remove data older than the cutoff time"""
        for symbol in list(self.last_processed.keys()):
            if self.last_processed[symbol] < cutoff_time:
                del self.trades[symbol]
                del self.trade_counts[symbol]
                del self.volumes[symbol]
                del self.last_processed[symbol]

    async def get_market_stats(self):
        """Calculate and return market statistics"""
        stats = []
        async with self.buffer_lock:
            for symbol in self.trades:
                if not self.is_valid_symbol(symbol):
                    continue
                    
                prices = self.trades[symbol]
                volumes = self.volumes[symbol]
                if not prices:
                    continue

                try:
                    current_price = prices[-1]
                    opening_price = prices[0]
                    percent_change = ((current_price - opening_price) / opening_price) * 100

                    stat = {
                        "symbol": symbol,
                        "current_price": current_price,
                        "percent_change": round(percent_change, 2),
                        "trade_count": self.trade_counts[symbol],
                        "volume": sum(volumes),
                        "high": max(prices),
                        "low": min(prices),
                        "vwap": sum(p * v for p, v in zip(prices, volumes)) / sum(volumes) if sum(volumes) > 0 else 0,
                        "std_dev": statistics.stdev(prices) if len(prices) > 1 else 0
                    }
                    stats.append(stat)
                except Exception as e:
                    logger.error(f"Error calculating stats for {symbol}: {e}")
                    continue

        return stats

    async def handle_proxy_message(self, message: str):
        """Process incoming messages from the proxy server"""
        try:
            data = json.loads(message)
            if isinstance(data, dict) and data.get("T") == "t":
                symbol = data["S"]
                
                # Skip invalid symbols early
                if not self.is_valid_symbol(symbol):
                    return
                    
                price = float(data["p"])
                volume = int(data.get("s", 0))
                await self.update_stock(symbol, price, volume)
        except json.JSONDecodeError:
            logger.error(f"Error decoding message: {message}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    async def connect_to_proxy(self):
        """Connect to the Alpaca proxy server with exponential backoff"""
        while True:
            try:
                if self.proxy_ws:
                    await self.proxy_ws.close()

                async with websockets.connect(self.proxy_url) as websocket:
                    self.proxy_ws = websocket
                    self.is_connected = True
                    self.connection_event.set()
                    self.reconnection_attempts = 0
                    logger.info("Connected to Alpaca proxy server")
                    
                    await websocket.send(json.dumps({
                        "action": "subscribe",
                        "trades": ["*"]
                    }))
                    
                    async for message in websocket:
                        await self.handle_proxy_message(message)

            except websockets.exceptions.ConnectionClosed:
                self.is_connected = False
                self.connection_event.clear()
                logger.warning("Connection to proxy server closed")
                await self.handle_reconnection()
            except Exception as e:
                self.is_connected = False
                self.connection_event.clear()
                logger.error(f"Error in proxy connection: {e}")
                await self.handle_reconnection()

    async def handle_reconnection(self):
        """Handle reconnection with exponential backoff"""
        self.reconnection_attempts += 1
        delay = min(2 ** self.reconnection_attempts, self.max_reconnection_delay)
        logger.info(f"Attempting to reconnect in {delay} seconds (attempt {self.reconnection_attempts})")
        await asyncio.sleep(delay)

    async def broadcast_updates(self):
        """Broadcast market updates to connected clients"""
        while True:
            current_time = datetime.now()
            time_since_last_broadcast = (current_time - self.last_broadcast_time).total_seconds()
            
            if time_since_last_broadcast >= self.update_interval:
                try:
                    stats = await self.get_market_stats()
                    message = json.dumps({
                        "type": "market_data",
                        "data": stats,
                        "timestamp": current_time.isoformat(),
                        "proxy_connected": self.is_connected
                    })
                    
                    await self.connection_manager.broadcast(message)
                    self.last_broadcast_time = current_time
            
                except Exception as e:
                    logger.error(f"Error in broadcast: {e}")

            await asyncio.sleep(1)  # Check interval

market_data = None  # Will be initialized with environment variables
historical_fetcher = None  # Will be initialized with environment variables

@app.get("/api/asset/{symbol}")
async def get_asset_info(symbol: str):
    try:
        url = f"https://paper-api.alpaca.markets/v2/assets/{symbol}"
        headers = {
            "accept": "application/json",
            "APCA-API-KEY-ID": os.getenv('APCA_API_KEY_ID'),
            "APCA-API-SECRET-KEY": os.getenv('APCA_API_SECRET_KEY')
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                if response.status == 404:
                    return {
                        "symbol": symbol,
                        "name": "Unknown",
                        "exchange": "Unknown",
                        "status": "unknown",
                        "tradable": False
                    }
                    
                try:
                    data = await response.json()
                    # Ensure we don't pass any None values
                    return {
                        "symbol": str(data.get("symbol", symbol) or symbol),
                        "name": str(data.get("name", "Unknown") or "Unknown"),
                        "exchange": str(data.get("exchange", "Unknown") or "Unknown"),
                        "status": str(data.get("status", "unknown") or "unknown"),
                        "tradable": bool(data.get("tradable", False))
                    }
                except json.JSONDecodeError as e:
                    logger.error(f"JSON decode error for {symbol}: {e}")
                    return {
                        "symbol": symbol,
                        "name": "Invalid data format",
                        "exchange": "",
                        "status": "error",
                        "tradable": False
                    }
                
    except Exception as e:
        logger.error(f"Unexpected error for {symbol}: {str(e)}")
        return {
            "symbol": symbol,
            "name": "Unknown error",
            "exchange": "",
            "status": "error",
            "tradable": False
        }

@app.get("/api/historical/{symbol}")
async def get_historical_data(symbol: str):
    """Fetch intraday 1-minute data for the current trading day"""
    try:
        eastern_tz = pytz.timezone('America/New_York')
        now = datetime.now(eastern_tz)
        
        # Set start_date to today's market open (9:30 AM ET)
        today = now.date()
        market_open = eastern_tz.localize(
            datetime.combine(today, datetime.min.time().replace(hour=9, minute=30))
        )
        
        # Format dates in YYYY-MM-DD format for Alpaca
        start_date_str = market_open.strftime('%Y-%m-%d')
        end_date_str = now.strftime('%Y-%m-%d')
        
        data = await historical_fetcher.fetch_historical_data(
            symbol,
            start_date_str,
            end_date_str,
            timeframe='1Min'
        )
        
        result = []
        for timestamp, row in data.iterrows():
            if timestamp.tzinfo is None:
                timestamp = pytz.utc.localize(timestamp)
            eastern_time = timestamp.astimezone(eastern_tz)
            result.append({
                "timestamp": eastern_time.isoformat(),
                "price": float(row['close']),
                "volume": int(row['volume']) if 'volume' in row else 0
            })
        
        logger.info(f"Fetched {len(result)} data points for {symbol}")
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Error fetching historical data: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections from clients"""
    await market_data.connection_manager.connect(websocket)
    
    try:
        while True:
            try:
                message = await websocket.receive_text()
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error in websocket connection: {e}")
                break
    finally:
        await market_data.connection_manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "proxy_connected": market_data.is_connected if market_data else False,
        "connected_clients": len(market_data.connection_manager.active_connections) if market_data else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.on_event("startup")
async def startup_event():
    """Initialize tasks when the application starts"""
    global market_data, historical_fetcher
    
    # Get configuration from environment variables
    update_interval = int(os.getenv('UPDATE_INTERVAL', '15'))
    proxy_url = os.getenv('PROXY_URL', 'ws://localhost:8765')
    
    # Add these environment variables for Alpaca
    alpaca_key = os.getenv('ALPACA_API_KEY')
    alpaca_secret = os.getenv('ALPACA_API_SECRET')
    alpaca_url = os.getenv('ALPACA_API_URL', 'https://paper-api.alpaca.markets')
    
    # Initialize market data manager
    market_data = MarketDataManager(
        update_interval=update_interval,
        proxy_url=proxy_url
    )
    
    # Initialize historical data fetcher
    historical_fetcher = HistoricalDataFetcher(
        api_key=alpaca_key,
        api_secret=alpaca_secret,
        base_url=alpaca_url
    )
    
    market_data.proxy_task = asyncio.create_task(market_data.connect_to_proxy())
    market_data.broadcast_task = asyncio.create_task(market_data.broadcast_updates())
    
    logger.info(f"Starting server with {update_interval} second update interval")
    logger.info(f"Using proxy URL: {proxy_url}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up tasks when the application shuts down"""
    if market_data:
        if market_data.proxy_task:
            market_data.proxy_task.cancel()
        if market_data.broadcast_task:
            market_data.broadcast_task.cancel()
        if market_data.proxy_ws:
            await market_data.proxy_ws.close()

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )
