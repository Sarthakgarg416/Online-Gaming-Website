// src/Game.js
import React, { useEffect, useState } from 'react';
import './rock.css'; // Import the CSS file for styling

const Game = () => {
  const [userChoice, setUserChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [result, setResult] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [ws, setWs] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8081');
    setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'id') {
        setPlayerId(data.id);
      } else if (data.type === 'gameState') {
        const { player1Choice, player2Choice, result } = data.gameState;
        setUserChoice(playerId === 1 ? player1Choice : player2Choice);
        setOpponentChoice(playerId === 1 ? player2Choice : player1Choice);
        setResult(result);
        setGameOver(true);
      }
    };

    return () => {
      socket.close();
    };
  }, [playerId]);

  const handleClick = (choice) => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'choice', choice }));
      setUserChoice(choice); // Highlight the chosen button
    }
  };

  const handleReplay = () => {
    setUserChoice(null);
    setOpponentChoice(null);
    setResult(null);
    setGameOver(false);
  };

  const choices = [
    { name: 'Rock', emoji: '✊' },
    { name: 'Paper', emoji: '✋' },
    { name: 'Scissors', emoji: '✌️' },
  ];

  return (
    <div className="game-container">
      <h1>Rock, Paper, Scissors</h1>
      <div className="choices">
        {choices.map((choice) => (
          <button
            key={choice.name}
            onClick={() => handleClick(choice.name)}
            className={userChoice === choice.name ? 'chosen' : ''}
            disabled={gameOver}
          >
            {choice.emoji} {choice.name}
          </button>
        ))}
      </div>
      {gameOver && (
        <div className="result">
          <p>You chose: {userChoice}</p>
          <p>Opponent chose: {opponentChoice}</p>
          <p>{result}</p>
          <button onClick={handleReplay} className="replay-button">
            Replay
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;
