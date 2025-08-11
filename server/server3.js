const WebSocket = require('ws');
const express = require('express');
const http = require('http');
//tic tac toe
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
let turn = 'X';

wss.on('connection', (ws) => {
  console.log('New player connected:', ws._socket.remoteAddress);

  // Assign player
  if (!players.X) {
    players.X = ws;
    ws.send(JSON.stringify({ type: 'SYMBOL', symbol: 'X' }));
  } else if (!players.O) {
    players.O = ws;
    ws.send(JSON.stringify({ type: 'SYMBOL', symbol: 'O' }));
  } else {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Game is full' }));
    ws.close();
    return;
  }

  // Move handler
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'MOVE') {
      if ((turn === 'X' && ws !== players.X) ||
          (turn === 'O' && ws !== players.O)) {
        console.log('Invalid move by:', ws._socket.remoteAddress);
        return;
      }
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'MOVE', row: data.row, col: data.col, symbol: data.symbol }));
        }
      });
      turn = turn === 'X' ? 'O' : 'X';
    } else if (data.type === 'TIMEUP') {
      if ((turn === 'X' && ws === players.X) ||
          (turn === 'O' && ws === players.O)) {
        turn = turn === 'X' ? 'O' : 'X';
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'TURN_SWITCHED', newTurn: turn }));
          }
        });
      }
    } else if (data.type === 'RESTART') {
      turn = 'X';
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'RESET' }));
        }
      });
    }
  });

  // Disconnect logic
  ws.on('close', () => {
    console.log('Player disconnected:', ws._socket.remoteAddress);
    if (players.X === ws) delete players.X;
    if (players.O === ws) delete players.O;
    turn = 'X';
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'RESET' }));
      }
    });
  });
});

server.listen(5000, () => {
  console.log('✅ Server running on ws://localhost:5000');
});
