import React, { useState, useRef, useEffect, useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import {
  FiSettings,
  FiMoon,
  FiSun,
  FiLogOut,
  FiMessageCircle,
} from "react-icons/fi";
import "./UserMenu.css";

function UserMenu({ userEmail, onLogout, onEnableChat }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract initial from email
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-avatar-btn" onClick={toggleMenu}>
        <div className="avatar-circle">{initial}</div>
        <span className="user-email-text">{userEmail}</span>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div className="avatar-large">{initial}</div>
            <div className="user-info">
              <p className="name">User Account</p>
              <p className="email">{userEmail}</p>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <button
            className="dropdown-item"
            onClick={() => {
              onEnableChat();
              setIsOpen(false);
            }}
          >
            <FiMessageCircle className="icon" />
            <span>Enable MindWell Chat</span>
          </button>

          <button className="dropdown-item" onClick={toggleDarkMode}>
            {darkMode ? (
              <FiSun className="icon" />
            ) : (
              <FiMoon className="icon" />
            )}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>

          <button className="dropdown-item">
            <FiSettings className="icon" />
            <span>Settings</span>
          </button>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item logout" onClick={onLogout}>
            <FiLogOut className="icon" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
