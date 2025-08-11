import React from 'react';

function SimonGame() {
  return (
    <div style={{ height: '600px', border: 'none' }}>
      <iframe
        src="/simon.html"
        title="Simon Game"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
}

export default SimonGame;
