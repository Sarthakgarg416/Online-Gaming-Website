import React, { useState, useRef, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './ChessGame.css';

function ChessGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [boardAnimated, setBoardAnimated] = useState(false);
  const [turn, setTurn] = useState('white');
  const [board, setBoard] = useState(createInitialBoard());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [whiteCaptured, setWhiteCaptured] = useState([]);
  const [blackCaptured, setBlackCaptured] = useState([]);
  const [check, setCheck] = useState({ white: false, black: false });
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameId, setGameId] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const boardRef = useRef(null);

  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8080');

  useEffect(() => {
    if (lastMessage !== null) {
      console.log('Received message:', lastMessage.data);
      const data = JSON.parse(lastMessage.data);
      if (data.type === 'GAME_CREATED' || data.type === 'GAME_JOINED') {
        setGameId(data.gameId);
        setPlayerColor(data.color);
        setGameStarted(true);
        console.log(`Joined game with ID: ${data.gameId} as ${data.color}`);
      } else if (data.type === 'OPPONENT_DISCONNECTED') {
        alert('Your opponent has disconnected.');
        setGameEnded(true);
      } else if (data.type === 'MOVE_MADE') {
        setBoard(data.board);
        setTurn(data.turn);
        setMoveHistory([...moveHistory, data.move]);
        console.log('Move made by opponent');
      }
    }
  }, [lastMessage]);

  function createInitialBoard() {
    const emptyRow = () => Array(8).fill(null);
    const board = Array(8).fill().map(() => emptyRow());

    const placePieces = (color, row1, row2) => {
      const backRow = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
      board[row1] = backRow.map(type => ({ type, color, hasMoved: false }));
      board[row2] = Array(8).fill().map(() => ({ type: 'pawn', color, hasMoved: false }));
    };

    placePieces('black', 0, 1);
    placePieces('white', 7, 6);
    return board;
  }

  const isInsideBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  const findKingPosition = (color) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  const isSquareUnderAttack = (row, col, attackingColor, testBoard = board) => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = testBoard[r][c];
        if (piece && piece.color === attackingColor) {
          const moves = getValidMovesForPiece(piece, { row: r, col: c }, false, testBoard);
          if (moves.some(m => m.row === row && m.col === col)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const isKingInCheck = (color, testBoard = board) => {
    const kingPos = findKingPosition(color);
    if (!kingPos) return false;

    const oppositeColor = color === 'white' ? 'black' : 'white';
    return isSquareUnderAttack(kingPos.row, kingPos.col, oppositeColor, testBoard);
  };

  const wouldMoveResultInCheck = (fromRow, fromCol, toRow, toCol, color) => {
    const testBoard = board.map(row => [...row]);
    testBoard[toRow][toCol] = testBoard[fromRow][fromCol];
    testBoard[fromRow][fromCol] = null;
    return isKingInCheck(color, testBoard);
  };

  const getValidMovesForPiece = (piece, position, checkForCheck = true, testBoard = board) => {
    const moves = [];
    const { row, col } = position;
    const { type, color } = piece;

    const addMove = (r, c) => {
      if (isInsideBoard(r, c)) {
        const target = testBoard[r][c];
        if (!target || target.color !== color) {
          if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
            moves.push({ row: r, col: c });
          }
        }
      }
    };

    const directions = {
      rook: [ [1,0], [-1,0], [0,1], [0,-1] ],
      bishop: [ [1,1], [1,-1], [-1,1], [-1,-1] ],
      queen: [ [1,0], [-1,0], [0,1], [0,-1], [1,1], [1,-1], [-1,1], [-1,-1] ]
    };

    switch (type) {
      case 'pawn': {
        const dir = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;

        if (isInsideBoard(row + dir, col) && !testBoard[row + dir][col]) {
          if (!checkForCheck || !wouldMoveResultInCheck(row, col, row + dir, col, color)) {
            moves.push({ row: row + dir, col: col });
          }

          if (row === startRow && !testBoard[row + dir][col] && !testBoard[row + 2 * dir][col]) {
            if (!checkForCheck || !wouldMoveResultInCheck(row, col, row + 2 * dir, col, color)) {
              moves.push({ row: row + 2 * dir, col: col });
            }
          }
        }

        [-1, 1].forEach(dc => {
          const [r, c] = [row + dir, col + dc];
          if (isInsideBoard(r, c) && testBoard[r][c] && testBoard[r][c].color !== color) {
            if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
              moves.push({ row: r, col: c });
            }
          }

          if (moveHistory.length > 0) {
            const lastMove = moveHistory[moveHistory.length - 1];
            if (lastMove.piece.type === 'pawn' &&
                lastMove.from.row === (color === 'white' ? 1 : 6) &&
                lastMove.to.row === (color === 'white' ? 3 : 4) &&
                lastMove.to.col === col + dc &&
                row === (color === 'white' ? 3 : 4)) {
              if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
                moves.push({ row: r, col: c, enPassant: true });
              }
            }
          }
        });
        break;
      }

      case 'rook':
      case 'bishop':
      case 'queen': {
        directions[type].forEach(([dr, dc]) => {
          for (let i = 1; i < 8; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (!isInsideBoard(r, c)) break;
            const target = testBoard[r][c];
            if (!target) {
              if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
                moves.push({ row: r, col: c });
              }
            } else {
              if (target.color !== color) {
                if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
                  moves.push({ row: r, col: c });
                }
              }
              break;
            }
          }
        });
        break;
      }

      case 'knight': {
        const steps = [ [2,1], [1,2], [-1,2], [-2,1], [-2,-1], [-1,-2], [1,-2], [2,-1] ];
        steps.forEach(([dr, dc]) => {
          const r = row + dr;
          const c = col + dc;
          if (isInsideBoard(r, c)) {
            const target = testBoard[r][c];
            if (!target || target.color !== color) {
              if (!checkForCheck || !wouldMoveResultInCheck(row, col, r, c, color)) {
                moves.push({ row: r, col: c });
              }
            }
          }
        });
        break;
      }

      case 'king': {
        directions.queen.forEach(([dr, dc]) => {
          const r = row + dr;
          const c = col + dc;
          if (isInsideBoard(r, c)) {
            const target = testBoard[r][c];
            if (!target || target.color !== color) {
              if (!checkForCheck || !isSquareUnderAttack(r, c, color === 'white' ? 'black' : 'white', testBoard)) {
                moves.push({ row: r, col: c });
              }
            }
          }
        });

        if (!piece.hasMoved && !check[color]) {
          // Kingside castling
          if (testBoard[row][7] &&
              testBoard[row][7].type === 'rook' &&
              !testBoard[row][7].hasMoved &&
              !testBoard[row][6] &&
              !testBoard[row][5]) {
            if (!isSquareUnderAttack(row, 5, color === 'white' ? 'black' : 'white', testBoard) &&
                !isSquareUnderAttack(row, 6, color === 'white' ? 'black' : 'white', testBoard)) {
              moves.push({ row: row, col: 6, castling: 'kingside' });
            }
          }
          // Queenside castling
          if (testBoard[row][0] &&
              testBoard[row][0].type === 'rook' &&
              !testBoard[row][0].hasMoved &&
              !testBoard[row][1] &&
              !testBoard[row][2] &&
              !testBoard[row][3]) {
            if (!isSquareUnderAttack(row, 3, color === 'white' ? 'black' : 'white', testBoard) &&
                !isSquareUnderAttack(row, 2, color === 'white' ? 'black' : 'white', testBoard)) {
              moves.push({ row: row, col: 2, castling: 'queenside' });
            }
          }
        }
        break;
      }

      default:
        break;
    }
    return moves;
  };

  const getValidMoves = (piece, position) => {
    return getValidMovesForPiece(piece, position, true);
  };

  const checkForGameEnd = () => {
    const currentColor = turn;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === currentColor) {
          const moves = getValidMoves(piece, { row: r, col: c });
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }

    if (check[currentColor]) {
      setWinner(currentColor === 'white' ? 'black' : 'white');
    } else {
      setWinner('draw');
    }
    setGameEnded(true);
    return true;
  };

  const handlePawnPromotion = (row, col) => {
    const piece = board[row][col];
    if (piece && piece.type === 'pawn') {
      if ((piece.color === 'white' && row === 0) || (piece.color === 'black' && row === 7)) {
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = { ...piece, type: 'queen' };
        setBoard(newBoard);
      }
    }
  };

  const handleSquareClick = (row, col) => {
    if (gameEnded || turn !== playerColor) return;

    const piece = board[row][col];

    if (selectedPiece) {
      if (validMoves.some(m => m.row === row && m.col === col)) {
        const move = validMoves.find(m => m.row === row && m.col === col);
        const newBoard = board.map(r => [...r]);
        const movingPiece = { ...newBoard[selectedPiece.row][selectedPiece.col], hasMoved: true };
        const targetPiece = newBoard[row][col];

        if (targetPiece) {
          if (targetPiece.color === 'white') {
            setWhiteCaptured([...whiteCaptured, targetPiece.type]);
          } else {
            setBlackCaptured([...blackCaptured, targetPiece.type]);
          }
        }

        if (move.castling) {
          if (move.castling === 'kingside') {
            newBoard[row][6] = movingPiece;
            newBoard[row][5] = { ...newBoard[row][7], hasMoved: true };
            newBoard[row][7] = null;
          } else if (move.castling === 'queenside') {
            newBoard[row][2] = movingPiece;
            newBoard[row][3] = { ...newBoard[row][0], hasMoved: true };
            newBoard[row][0] = null;
          }
          newBoard[selectedPiece.row][selectedPiece.col] = null;
        } else if (move.enPassant) {
          newBoard[row][col] = movingPiece;
          newBoard[selectedPiece.row][selectedPiece.col] = null;
          const capturedPawnRow = selectedPiece.row;
          const capturedPawnCol = col;
          if (newBoard[capturedPawnRow][capturedPawnCol] && newBoard[capturedPawnRow][capturedPawnCol].color === 'white') {
            setWhiteCaptured([...whiteCaptured, 'pawn']);
          } else if (newBoard[capturedPawnRow][capturedPawnCol]) {
            setBlackCaptured([...blackCaptured, 'pawn']);
          }
          newBoard[capturedPawnRow][capturedPawnCol] = null;
        } else {
          newBoard[row][col] = movingPiece;
          newBoard[selectedPiece.row][selectedPiece.col] = null;
        }

        setMoveHistory([
          ...moveHistory,
          {
            piece: movingPiece,
            from: { row: selectedPiece.row, col: selectedPiece.col },
            to: { row, col }
          }
        ]);

        setBoard(newBoard);

        // Handle pawn promotion
        handlePawnPromotion(row, col);

        const nextTurn = turn === 'white' ? 'black' : 'white';
        const isInCheck = isKingInCheck(nextTurn, newBoard);
        setCheck({ ...check, [nextTurn]: isInCheck });

        setTurn(nextTurn);

        setSelectedPiece(null);
        setValidMoves([]);

        sendMessage(JSON.stringify({
          type: 'MAKE_MOVE',
          gameId,
          board: newBoard,
          move: {
            piece: movingPiece,
            from: { row: selectedPiece.row, col: selectedPiece.col },
            to: { row, col }
          }
        }));

        setTimeout(() => {
          checkForGameEnd();
        }, 100);
      } else {
        if (piece && piece.color === turn) {
          setSelectedPiece({ row, col });
          setValidMoves(getValidMoves(piece, { row, col }));
        } else {
          setSelectedPiece(null);
          setValidMoves([]);
        }
      }
    } else if (piece && piece.color === turn) {
      setSelectedPiece({ row, col });
      setValidMoves(getValidMoves(piece, { row, col }));
    }
  };

  const boardAnimate = () => {
    setBoardAnimated(!boardAnimated);
    const boardEl = boardRef.current;
    if (boardEl) {
      boardEl.classList.toggle('animate');
      boardEl.querySelectorAll('.piece').forEach(piece => piece.classList.toggle('forward'));
    }
  };

  useEffect(() => {
    if (gameStarted && !gameEnded) {
      checkForGameEnd();
    }
  }, [turn]);

  const getPieceImage = (piece) => {
    if (!piece) return null;
    return `img/${piece.color}-${piece.type}.webp`;
  };

  return (
    <div className="chess-game">
      {!gameStarted && (
        <div id="startscene" className="scene show">
          <div className="scene-content" style={{ marginTop: '15vh' }}>
            <div className="start-game-container">
              <p>Waiting for an opponent...</p>
            </div>
          </div>
          <div className="overlay"></div>
        </div>
      )}

      {gameEnded && (
        <div id="endscene" className="scene show">
          <p className="scene-content winning-sign">
            {winner === 'draw' ? 'Stalemate! Game ends in a draw' :
             winner ? `${winner} wins!` : ''}
          </p>
          <div className="overlay"></div>
        </div>
      )}

      <div className="board-container">
        <div id="board" ref={boardRef} className={boardAnimated ? 'animate' : ''}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className={rowIndex % 2 === 0 ? 'even' : 'odd'}>
              {row.map((piece, colIndex) => {
                const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
                const isValidMove = validMoves.some(m => m.row === rowIndex && m.col === colIndex);
                const isKingSquare = piece && piece.type === 'king';
                const isCheckSquare = isKingSquare && check[piece.color];

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`square ${isSelected ? 'clicked-square' : ''}
                               ${isValidMove ? 'allowed' : ''}
                               ${isCheckSquare ? 'check' : ''}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <div className={`piece ${piece.type} ${piece.color}`}>
                        <img
                          src={getPieceImage(piece)}
                          alt={`${piece.color} ${piece.type}`}
                          className="piece-image"
                        />
                        <div className="piece-fallback">
                          {piece.type.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p id="turn">
          {check[turn] ? `${turn.charAt(0).toUpperCase() + turn.slice(1)} is in check!` :
           `${turn.charAt(0).toUpperCase() + turn.slice(1)}'s Turn`}
        </p>

        <div className="semataries">
          <div id="whiteSematary" className="sematary">
            {whiteCaptured.map((type, i) => (
              <div key={i} className="captured-container">
                <img
                  src={`img/white-${type}.webp`}
                  alt={`white ${type}`}
                  className="captured-piece"
                />
              </div>
            ))}
          </div>

          <div id="blackSematary" className="sematary">
            {blackCaptured.map((type, i) => (
              <div key={i} className="captured-container">
                <img
                  src={`img/black-${type}.webp`}
                  alt={`black ${type}`}
                  className="captured-piece"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: '15px', bottom: '15px' }}>
        <button className="flip-board" onClick={boardAnimate}>Flip Board</button>
        <button className="button" onClick={() => window.location.reload()} style={{ marginLeft: '10px' }}>New Game</button>
      </div>
    </div>
  );
}

export default ChessGame;
