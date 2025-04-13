import React, { useEffect, useRef, useState } from 'react';

function Chess({ roomId }) {
  const iframeRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      switch (event.data.type) {
        case 'PLAYER_ROLE':
          setPlayerColor(event.data.color);
          setIsLeader(event.data.isLeader);
          break;
        case 'PLAYERS_READY':
          setOpponentConnected(true);
          break;
        case 'GAME_STARTED':
          setGameStarted(true);
          break;
        case 'PLAYER_LEFT':
          setOpponentConnected(false);
          alert(`${event.data.color} player left the game`);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const startGame = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ 
        type: 'START_GAME',
        isLeader,
        roomId
      }, '*');
    }
  };

  const iframeSrc = roomId ? `/chess.html?room=${roomId}` : '/chess.html';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="Chess Game"
        width="100%"
        height="600px"
        style={{ border: '1px solid #ccc', borderRadius: '4px' }}
      />
      
      {!gameStarted && (
        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {playerColor && (
            <p>You are playing as: <strong>{playerColor}</strong></p>
          )}
          {isLeader && !opponentConnected && (
            <p>Waiting for opponent to join...</p>
          )}
          {opponentConnected && isLeader && (
            <button 
              onClick={startGame}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Start Game
            </button>
          )}
          {!isLeader && opponentConnected && (
            <p>Waiting for leader to start the game...</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Chess;