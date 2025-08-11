import React from 'react';

function SimonGame() {
  return (
    <div style={{ height: '600px', border: 'none' }}>
      <iframe
        src="/2048.html"
        title="2048"
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </div>
  );
}

export default SimonGame;
