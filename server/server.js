const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Track all room states
const rooms = {};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // Join room handler
  socket.on('joinRoom', (roomId) => {
    if (!roomId) {
      socket.emit('error', 'Room ID is required');
      return;
    }

    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Initialize room if new
    if (!rooms[roomId]) {
      rooms[roomId] = {
        leader: socket.id,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        players: [socket.id],
        gameStarted: false,
        whitePlayer: socket.id,
        blackPlayer: null
      };
      socket.emit('playerRole', { color: 'white', isLeader: true });
      console.log(`Room ${roomId} created by ${socket.id} (White)`);
    } 
    else {
      // Add as black player if slot available
      if (!rooms[roomId].blackPlayer) {
        rooms[roomId].blackPlayer = socket.id;
        rooms[roomId].players.push(socket.id);
        socket.emit('playerRole', { color: 'black', isLeader: false });
        console.log(`Player ${socket.id} joined as Black in room ${roomId}`);
        
        // Notify both players that game can start
        io.to(roomId).emit('playersReady', {
          white: rooms[roomId].whitePlayer,
          black: socket.id
        });
      } 
      else {
        // Room is full
        socket.emit('error', 'Room is full (2/2 players)');
        socket.leave(roomId);
        return;
      }
    }

    // Send current game state if game in progress
    if (rooms[roomId].gameStarted) {
      socket.emit('fenUpdate', rooms[roomId].fen);
    }
  });

  // Start game handler
  socket.on('startGame', (roomId) => {
    if (!rooms[roomId] || rooms[roomId].leader !== socket.id) {
      socket.emit('error', 'Only the room leader can start the game');
      return;
    }

    if (rooms[roomId].players.length < 2) {
      socket.emit('error', 'Waiting for opponent to join');
      return;
    }

    rooms[roomId].gameStarted = true;
    io.to(roomId).emit('gameStarted', {
      fen: rooms[roomId].fen,
      white: rooms[roomId].whitePlayer,
      black: rooms[roomId].blackPlayer
    });
    console.log(`Game started in room ${roomId}`);
  });

  // FEN update handler
  socket.on('fenUpdate', ({ roomId, fen }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].fen = fen;
    socket.to(roomId).emit('fenUpdate', fen);
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Clean up rooms
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.indexOf(socket.id);
      
      if (index !== -1) {
        // Remove player
        room.players.splice(index, 1);
        
        // Handle if white player left
        if (room.whitePlayer === socket.id) {
          room.whitePlayer = null;
          io.to(roomId).emit('playerLeft', 'white');
        }
        // Handle if black player left
        else if (room.blackPlayer === socket.id) {
          room.blackPlayer = null;
          io.to(roomId).emit('playerLeft', 'black');
        }
        
        // Clean up empty rooms
        if (room.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} cleaned up`);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
