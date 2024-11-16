# Stock Market Dashboard

A real-time stock market tracking dashboard built with FastAPI and React. Features live WebSocket updates, interactive charts, filtering controls, and statistical analysis panels.

## Features

- 📊 Real-time stock market data updates via WebSocket
- 📈 Interactive trading charts with historical data
- 🔍 Advanced filtering and search capabilities
- 📱 Responsive design with dark/light theme support
- 📊 Statistical analysis panels
- ⚡ High-performance FastAPI backend
- 🎨 Modern UI with Shadcn/UI components

## Tech Stack

### Backend
- FastAPI (Python 3.8+)
- WebSocket for real-time updates
- RESTful API endpoints

### Frontend
- React 18
- Tailwind CSS
- Shadcn/UI components
- WebSocket hooks for real-time data
- Recharts for data visualization

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

## Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
cp .env.example .env
# Edit .env file with your configuration
```

5. Run the server:
```bash
./run.sh
# Or on Windows:
# python main.py
```

The backend server will start at http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env file with your configuration
```

4. Start the development server:
```bash
npm start
# or
yarn start
```

The application will open at http://localhost:3000

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI application entry point
│   ├── requirements.txt  # Python dependencies
│   └── run.sh           # Server startup script
│
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   │   └── ui/     # Reusable UI components
│   │   ├── hooks/      # Custom hooks
│   │   └── utils/      # Utility functions
│   ├── package.json    # Node.js dependencies
│   └── tailwind.config.js  # Tailwind configuration
```

## Available Scripts

### Backend

- `./run.sh` - Start the FastAPI server
- `pytest` - Run backend tests (if implemented)

### Frontend

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linter

## WebSocket Events

The application uses WebSocket for real-time updates. Here are the main events:

- `stock_update`: Real-time stock price updates
- `market_status`: Market open/close status
- `error`: Error events

## Environment Variables

### Backend (.env)
```
API_PORT=8000
WEBSOCKET_URL=ws://localhost:8000/ws
ALLOW_ORIGINS=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000/ws
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/)
