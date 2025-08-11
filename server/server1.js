// rock
const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8081 });

let players = [];
let gameState = {
  player1Choice: null,
  player2Choice: null,
  result: null,
};

server.on('connection', (ws) => {
  players.push(ws);
  ws.id = players.length;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'choice') {
      if (ws.id === 1) {
        gameState.player1Choice = data.choice;
      } else if (ws.id === 2) {
        gameState.player2Choice = data.choice;
      }

      if (gameState.player1Choice && gameState.player2Choice) {
        determineWinner();
        broadcastGameState();
        resetGameState();
      }
    }
  });

  ws.on('close', () => {
    players = players.filter((player) => player !== ws);
  });

  ws.send(JSON.stringify({ type: 'id', id: ws.id }));
});

const determineWinner = () => {
  const { player1Choice, player2Choice } = gameState;
  if (player1Choice === player2Choice) {
    gameState.result = "It's a tie!";
  } else if (
    (player1Choice === 'Rock' && player2Choice === 'Scissors') ||
    (player1Choice === 'Paper' && player2Choice === 'Rock') ||
    (player1Choice === 'Scissors' && player2Choice === 'Paper')
  ) {
    gameState.result = 'Player 1 wins!';
  } else {
    gameState.result = 'Player 2 wins!';
  }
};

const broadcastGameState = () => {
  players.forEach((player) => {
    player.send(JSON.stringify({ type: 'gameState', gameState }));
  });
};

const resetGameState = () => {
  gameState.player1Choice = null;
  gameState.player2Choice = null;
  gameState.result = null;
};

console.log('Server is running on ws://localhost:8081');
