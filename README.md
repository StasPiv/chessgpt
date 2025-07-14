# Chess Analysis App

A modern React-based chess analysis application with real-time engine evaluation powered by Stockfish.

![Chess Analysis App Screenshot](https://img.shields.io/badge/Status-v1.0-green) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![Redux](https://img.shields.io/badge/Redux-Toolkit-purple)

## Features

### 🎯 Core Functionality
- **Interactive Chess Board**: Drag-and-drop interface with move validation
- **Real-time Engine Analysis**: Stockfish integration via WebSocket with multi-PV analysis
- **Modern React/Redux Architecture**: Clean, maintainable codebase
- **Move Validation**: Prevents illegal moves and handles errors gracefully
- **PGN Support**: Load complete games from PGN notation

### 🎮 User Interface
- **Auto-Analysis Toggle**: Enable/disable automatic analysis on moves
- **Horizontal Move Notation**: Clean display format (1.e4 e5 2.Nf3 Nc6...)
- **Fixed-Height Move Panel**: With automatic scrolling for long games
- **Responsive Layout**: Optimized for desktop chess analysis
- **Move Navigation**: Undo moves and browse game history

### ⚙️ Technical Features
- **WebSocket Communication**: Real-time engine communication
- **ES Modules**: Modern JavaScript module system
- **Error Handling**: Robust validation and error recovery
- **Configurable Analysis**: Toggle analysis on/off as needed

## Prerequisites

Before installation, ensure you have:

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Stockfish chess engine** installed on your system
- **Git** for cloning the repository

### Installing Stockfish

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install stockfish
```

#### macOS:
```bash
brew install stockfish
```

#### Windows:
Download from [Stockfish official website](https://stockfishchess.org/download/)

## Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd chessgpt
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Stockfish path:**
Edit `polyglot.ini` and update the `EngineCommand` path to your Stockfish installation:
```ini
[PolyGlot]
EngineCommand = /path/to/your/stockfish
```

Common paths:
- Ubuntu/Debian: `/usr/bin/stockfish`
- macOS (Homebrew): `/opt/homebrew/bin/stockfish`
- Windows: `C:\path\to\stockfish.exe`

## Running the Application

The application consists of three components that need to be running simultaneously:

### 1. Start the WebSocket Server
```bash
node server.js
```
This starts the WebSocket server on `ws://localhost:8080`

### 2. Start the Chess Analysis Service
```bash
node index.js
```
This connects Stockfish to the WebSocket server for real-time analysis

### 3. Start the React Development Server
```bash
npm start
```
This starts the web application on `http://localhost:9000`

### Quick Start Script
For convenience, you can run all services in separate terminals:

**Terminal 1:**
```bash
node server.js
```

**Terminal 2:**
```bash
node index.js
```

**Terminal 3:**
```bash
npm start
```

Then open your browser to `http://localhost:9000`

## Usage

### Basic Chess Playing
1. **Make moves**: Click and drag pieces on the board
2. **View analysis**: Real-time engine evaluation appears on the right
3. **Undo moves**: Use the "Undo Move" button
4. **Auto-analysis**: Toggle the checkbox to enable/disable automatic analysis

### Loading Games
1. **PGN Input**: Paste PGN notation in the text area
2. **Load PGN**: Click "Load PGN" to import the game
3. **Navigate**: Use undo to step through the loaded game

### Analysis Control
- **Auto-analyze moves**: Check/uncheck to control automatic analysis
- **Manual control**: When auto-analysis is off, analysis won't run on moves
- **Real-time updates**: Analysis updates continuously when enabled

## Project Structure

```
chessgpt/
├── src/
│   ├── components/
│   │   ├── ChessBoard.js      # Interactive chess board component
│   │   ├── MoveList.js        # Game move history display
│   │   └── AnalysisPanel.tsx   # Engine analysis display
│   ├── redux/
│   │   ├── store.js           # Redux store configuration
│   │   ├── reducers.js        # Chess game state management
│   │   ├── analysisReducer.js # Analysis state management
│   │   └── actions.js         # Redux actions
│   ├── websocket.js           # WebSocket client service
│   ├── App.js                 # Main application component
│   └── index.js               # Application entry point
├── public/
│   └── index.html             # HTML template
├── server.js                  # WebSocket server
├── index.js                   # Stockfish analysis service
├── polyglot.ini               # Stockfish configuration
├── webpack.config.cjs         # Webpack configuration
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Architecture

### Frontend (React/Redux)
- **React Components**: Modular UI components for board, moves, and analysis
- **Redux Store**: Centralized state management for game and analysis
- **WebSocket Client**: Real-time communication with analysis engine

### Backend Services
- **WebSocket Server**: Message broker between frontend and engine
- **Analysis Service**: Stockfish integration via PolyGlot adapter
- **Chess Engine**: Stockfish providing position evaluation

### Data Flow
1. User makes move on board → Redux updates game state
2. If auto-analysis enabled → WebSocket sends position to engine
3. Stockfish analyzes → Returns evaluation via WebSocket
4. Frontend receives analysis → Updates UI in real-time

## Configuration

### Engine Settings
Edit `polyglot.ini` to customize Stockfish behavior:

```ini
[PolyGlot]
EngineCommand = /path/to/stockfish
Book = true
BookFile = Titans.bin

[Engine]
Threads = 16           # CPU threads for analysis
Hash = 512            # Memory allocation (MB)
MultiPV = 3           # Number of analysis lines
Skill Level = 20      # Engine strength (0-20)
```

### Development Settings
- **Port Configuration**: WebSocket server runs on port 8080
- **Dev Server**: React app runs on port 9000
- **Hot Reloading**: Enabled in development mode

## Troubleshooting

### Common Issues

**"WebSocket connection failed"**
- Ensure `node server.js` is running
- Check port 8080 is not blocked by firewall

**"No analysis appearing"**
- Verify `node index.js` is running
- Check Stockfish path in `polyglot.ini`
- Ensure auto-analysis checkbox is enabled

**"Moves not working"**
- Check browser console for JavaScript errors
- Verify all three services are running
- Try refreshing the page

**"PGN won't load"**
- Ensure PGN format is correct
- Check for special characters or encoding issues

### Debug Mode
Enable console logging by opening browser DevTools (F12) to see:
- WebSocket connection status
- Move validation messages
- Analysis data flow

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature description"`
6. Push: `git push origin feature-name`
7. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Changelog

### v1.0 (Latest)
- Complete React/Redux rewrite
- Modern ES Modules architecture
- Improved move display with horizontal notation
- Auto-analysis toggle functionality
- Enhanced error handling and move validation
- Clean, responsive UI design

### v1.0-beta
- Initial React implementation
- Basic WebSocket integration
- Core chess functionality

## Acknowledgments

- **Stockfish**: World's strongest chess engine
- **Chess.js**: Chess game logic library
- **chessboardjsx**: React chess board component
- **PolyGlot**: Chess engine adapter

---

Built with ❤️ for chess enthusiasts and developers