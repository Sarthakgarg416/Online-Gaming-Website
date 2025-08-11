import React, { useState } from 'react';
import MultiTicTacToe from './MultiTicTacToe';

function TicTacToe() {
  const [view, setView] = useState(null); // 'html' or 'react'

  if (view === 'html') {
    return (
      <div style={{ height: '600px', border: 'none' }}>
        <iframe
          src="/tic-tac.html"
          title="Tic Tac Toe HTML"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  if (view === 'react') {
    return <MultiTicTacToe />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h1 style={{ color: '#FFD700', fontFamily: 'monospace', fontSize: '2rem' }}>
        4x4 Tic-Tac-Toe
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

export default TicTacToe;
