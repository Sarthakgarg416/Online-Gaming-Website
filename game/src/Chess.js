import React, { useState } from 'react';
import MultiChess from './MultiChess';

function Chess() {
  const [view, setView] = useState(null); // 'html' or 'react'

  if (view === 'html') {
    return (
      <div style={{ height: '600px', border: 'none' }}>
        <iframe
          src="/chess.html"
          title="Chess Game"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  if (view === 'react') {
    return <MultiChess />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1 style={{ color: '#FFD700', fontFamily: 'monospace', fontSize: '2rem' }}>
        Chess Game
      </h1>
      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => setView('react')}
          style={buttonStyle}
        >
          online
        </button>
        <button
          onClick={() => setView('html')}
          style={buttonStyle}
        >
          offline
        </button>
      </div>
    </div>
  );
}

const buttonStyle = {
  margin: '0 10px',
  padding: '10px 20px',
  fontSize: '1rem',
  backgroundColor: '#444',
  color: '#FFD700',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

export default Chess;
