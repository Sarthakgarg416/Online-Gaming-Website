import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './navbar.css';

function Navbar() {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="navbar">
      <h1>Welcome to Game Zone</h1>
      <ul className="menu">
        {/* Direct NavLinks for IQ Report, Tournament, Chess */}
        
        <li>
          <NavLink to="/chess" activeclassname="active">Chess</NavLink>
        </li>

        {/* Dropdown for ABC */}
        

        {/* Other Games */}
        <li>
          <NavLink to="/simon" activeclassname="active">Simon</NavLink>
        </li>
        <li>
          <NavLink to="/2048" activeclassname="active">2048</NavLink>
        </li>
        <li>
          <NavLink to="/tic-tac-toe" activeclassname="active">Tic Tac Toe</NavLink>
        </li>
        <li>
          <NavLink to="/rock" activeclassname="active">Rock</NavLink>
        </li>
        {/* <li>
          <NavLink to="/iq-report" activeclassname="active">IQ Report</NavLink>
        </li> */}
        
        <li className="dropdown">
          <button className="dropbtn" onClick={toggleDropdown}>More Games</button>
          {isDropdownOpen && (
            <div className="dropdown-content">
              <NavLink to="/game1" activeclassname="active">Game 1</NavLink>
              <NavLink to="/game2" activeclassname="active">Game 2</NavLink>
              <NavLink to="/game3" activeclassname="active">Game 3</NavLink>
            </div>
          )}
        </li>
      </ul>
    </div>
  );
}

export default Navbar;
