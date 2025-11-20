import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './NavBar.css'

function NavBar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">QSMART</span>
        </Link>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <ul className="nav-list">
            <li><a href="#about" className="nav-link">About</a></li>
            <li><a href="#docs" className="nav-link">Docs</a></li>
            <li><a href="#webapp" className="nav-link">WebApp</a></li>
          </ul>
        </div>

        <div className="navbar-buttons">
          <Link to="/signin" className="nav-link login-link">Login</Link>
          <Link to="/signup" className="btn btn-white">Register</Link>
        </div>

        <div className={`hamburger ${isOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
