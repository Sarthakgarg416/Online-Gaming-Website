import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import GameContent from './GameContent';
import Simon from './Simon';
import TicTacToe from './TicTacToe';
import Game2048 from './Game2048';
import Chess from './Chess';
import Rock from './rock';
import ChatRoom from './chatroom';
import MultiTicTacToe from './MultiTicTacToe';
import MultiChess from './MultiChess'; // Import MultiChess
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<GameContent />} />
          <Route path="/simon" element={<Simon />} />
          <Route path="/2048" element={<Game2048 />} />
          <Route path="/tic-tac-toe" element={<TicTacToe />} />
          <Route path="/multi-tictactoe" element={<MultiTicTacToe />} />
          <Route path="/chess" element={<Chess />} />
          <Route path="/rock" element={<Rock />} />
          <Route path="/game1" element={<div>Game 1</div>} />
          <Route path="/game2" element={<div>Game 2</div>} />
          <Route path="/game3" element={<div>Game 3</div>} />
        </Routes>
        <ChatRoom />
      </div>
    </Router>
  );
}

export default App;
