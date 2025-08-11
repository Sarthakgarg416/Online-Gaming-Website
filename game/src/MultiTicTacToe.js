import React, { useEffect, useState, useRef } from 'react';
import './Multit.css';

function MultiTicTacToe() {
  const [board, setBoard] = useState(Array(4).fill().map(() => Array(4).fill('')));
  const [symbol, setSymbol] = useState('');
  const [myTurn, setMyTurn] = useState(false);
  const [status, setStatus] = useState('Waiting for another player...');
  const [winner, setWinner] = useState(null);
  const [timer, setTimer] = useState(10);
  const [winningCells, setWinningCells] = useState([]);
  const timerRef = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:5000');

    ws.current.onopen = () => {
      console.log('Connected to the server');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SYMBOL') {
        setSymbol(data.symbol);
        const isMyTurn = data.symbol === 'X';
        setMyTurn(isMyTurn);
        setStatus(`You are Player ${data.symbol}`);
        if (isMyTurn) resetTimer();
      } else if (data.type === 'MOVE') {
        setBoard(prev => {
          const newBoard = prev.map(r => [...r]);
          newBoard[data.row][data.col] = data.symbol;
          const win = checkWinner(newBoard, data.symbol);
          if (win) {
            setWinner(data.symbol);
            setWinningCells(win.cells);
            setStatus(`🎉 Player ${data.symbol} wins!`);
            clearInterval(timerRef.current);
          } else if (checkDraw(newBoard)) {
            setWinner('Draw');
            setStatus("🤝 It's a draw!");
            clearInterval(timerRef.current);
          } else {
            const turn = data.symbol !== symbol;
            setMyTurn(turn);
            setStatus(`You are Player ${symbol}. It's ${turn ? 'your' : "opponent's"} turn.`);
            if (turn) resetTimer();
          }
          return newBoard;
        });
      } else if (data.type === 'RESET') {
        setBoard(Array(4).fill().map(() => Array(4).fill('')));
        setWinner(null);
        setWinningCells([]);
        setMyTurn(symbol === 'X');
        setStatus(`You are Player ${symbol}`);
        clearInterval(timerRef.current);
        setTimer(10);
        if (symbol === 'X') resetTimer();
      } else if (data.type === 'TURN_SWITCHED') {
        const isMyTurn = symbol === data.newTurn;
        setMyTurn(isMyTurn);
        setStatus(`You are Player ${symbol}. It's ${isMyTurn ? 'your' : "opponent's"} turn.`);
        if (isMyTurn && !winner) resetTimer();
      } else if (data.type === 'ERROR') {
        alert(data.message);
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from the server');
    };

    return () => {
      ws.current.close();
      clearInterval(timerRef.current);
    };
  }, [symbol]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimer(10);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setMyTurn(false);
          setStatus("⏱ Time's up! Opponent's turn.");
          ws.current.send(JSON.stringify({ type: 'TIMEUP' }));
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClick = (row, col) => {
    if (!myTurn || board[row][col] || winner) return;
    ws.current.send(JSON.stringify({ type: 'MOVE', row, col, symbol }));
    setMyTurn(false);
    clearInterval(timerRef.current);
    setTimer(10);
  };

  const handleRestart = () => {
    ws.current.send(JSON.stringify({ type: 'RESTART' }));
    setBoard(Array(4).fill().map(() => Array(4).fill('')));
    setWinner(null);
    setWinningCells([]);
    setTimer(10);
    setStatus(`You are Player ${symbol}`);
    setMyTurn(symbol === 'X');
    if (symbol === 'X') resetTimer();
  };

  return (
    <div className="multi-tic-tac-toe">
      <h1>4x4 Tic-Tac-Toe</h1>
      {winner === null && myTurn && <h2>⏳ Time Left: {timer}s</h2>}
      <h2>{status}</h2>
      <h3>{!winner && `You are ${symbol}. Turn: ${myTurn ? 'You' : 'Opponent'}`}</h3>

      <div className="board-container">
        <div className="board">
          {board.map((r, rowIdx) => (
            <div key={rowIdx} className="row">
              {r.map((cell, colIdx) => {
                const isWinningCell = winningCells.some(([r, c]) => r === rowIdx && c === colIdx);
                return (
                  <button
                    key={colIdx}
                    className={`cell ${cell} ${isWinningCell ? 'win' : ''}`}
                    onClick={() => handleClick(rowIdx, colIdx)}
                    disabled={!myTurn || cell || winner}
                  >
                    {cell}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <button className="restart" onClick={handleRestart}>🔁 Restart Game</button>
    </div>
  );
}

function checkWinner(board, symbol) {
  const size = 4;

  for (let i = 0; i < size; i++) {
    if (board[i].every(cell => cell === symbol)) return { cells: board[i].map((_, c) => [i, c]) };
    if (board.map(row => row[i]).every(cell => cell === symbol)) return { cells: board.map((_, r) => [r, i]) };
  }

  if (board.every((row, idx) => row[idx] === symbol)) return { cells: board.map((_, i) => [i, i]) };
  if (board.every((row, idx) => row[size - 1 - idx] === symbol)) return { cells: board.map((_, i) => [i, size - 1 - i]) };

  return false;
}

function checkDraw(board) {
  return board.flat().every(cell => cell !== '');
}

export default MultiTicTacToe;
