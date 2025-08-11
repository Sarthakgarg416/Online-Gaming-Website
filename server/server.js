const WebSocket = require('ws');
const express = require('express');
const http = require('http');
//chess
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let games = {};
let waitingPlayer = null;

wss.on('connection', (ws) => {
  console.log('New client connected');

  if (waitingPlayer) {
    // If there is a waiting player, create a new game and join both players
    const gameId = Object.keys(games).length + 1;
    games[gameId] = {
      id: gameId,
      players: [waitingPlayer, ws],
      board: createInitialBoard(),
      turn: 'white',
      moveHistory: [],
    };
    waitingPlayer.send(JSON.stringify({ type: 'GAME_CREATED', gameId, color: 'white' }));
    ws.send(JSON.stringify({ type: 'GAME_JOINED', gameId, color: 'black' }));
    waitingPlayer = null;
    console.log(`Game created with ID: ${gameId}`);
  } else {
    // Otherwise, set the current player as the waiting player
    waitingPlayer = ws;
    console.log('Player is waiting for an opponent');
  }

  ws.on('message', (message) => {
    console.log('Received message:', message);
    const data = JSON.parse(message);

    if (data.type === 'MAKE_MOVE') {
      const game = games[data.gameId];
      if (game) {
        game.board = data.board;
        game.turn = game.turn === 'white' ? 'black' : 'white';
        game.moveHistory.push(data.move);
        game.players.forEach(player => {
          if (player !== ws) {
            player.send(JSON.stringify({ type: 'MOVE_MADE', board: data.board, turn: game.turn, move: data.move }));
          }
        });
        console.log(`Move made in game with ID: ${data.gameId}`);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (waitingPlayer === ws) {
      waitingPlayer = null;
      console.log('Waiting player disconnected');
    } else {
      for (const gameId in games) {
        const game = games[gameId];
        game.players = game.players.filter(player => player !== ws);
        if (game.players.length === 0) {
          delete games[gameId];
          console.log(`Game with ID: ${gameId} deleted`);
        } else if (game.players.length === 1) {
          game.players[0].send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED' }));
          console.log(`Opponent disconnected from game with ID: ${gameId}`);
        }
      }
    }
  });
});

function createInitialBoard() {
  const emptyRow = () => Array(8).fill(null);
  const board = Array(8).fill().map(() => emptyRow());

  const placePieces = (color, row1, row2) => {
    const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    board[row1] = backRow.map(type => ({ type, color, hasMoved: false }));
    board[row2] = Array(8).fill().map(() => ({ type: 'pawn', color, hasMoved: false }));
  };

  placePieces('black', 0, 1);
  placePieces('white', 7, 6);
  return board;
}

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
