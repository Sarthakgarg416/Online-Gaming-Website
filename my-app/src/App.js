import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Chess from './Chess';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  const joinRoom = () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }
    
    setError('');
    if (socket) {
      socket.emit('joinRoom', roomId);
      setJoined(true);
    }
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomId(randomId);
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ padding: 20, maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>♟️ Multiplayer Chess</h2>

      {!joined ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
            <input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button 
              onClick={generateRoomId} 
              style={{ marginLeft: '10px', padding: '8px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Generate
            </button>
          </div>
          
          {error && <p style={{ color: 'red' }}>{error}</p>}
          
          <button 
            onClick={joinRoom}
            style={{ padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
          >
            Join Room
          </button>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0' }}>
              <strong>Room ID:</strong> {roomId} 
              <button 
                onClick={copyRoomId}
                style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: copied ? '#4CAF50' : '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </p>
            <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>
              Share this ID with your opponent
            </p>
          </div>
          
          <Chess roomId={roomId} />
        </>
      )}
    </div>
  );
}

export default App;