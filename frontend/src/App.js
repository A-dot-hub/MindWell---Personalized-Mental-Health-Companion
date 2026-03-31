import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import UserMenu from "./components/UserMenu";
import DailyRoutine from "./components/DailyRoutine";
import MoodTracker from "./components/MoodTracker";
import Journaling from "./components/Journaling";
import CalmSounds from "./components/CalmSounds";
import Resources from "./components/Resources/Resources";
import Meditation from "./components/Meditation"; // Imported Meditation
import SleepHealth from "./components/SleepHealth";
import Community from "./components/Community";
import GoalSetting from "./components/GoalSetting";
import Insights from "./components/Insights";
import React, { useState, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import {
  FiHome,
  FiMessageSquare,
  FiCalendar,
  FiSmile,
  FiActivity,
  FiBookOpen,
  FiLogOut,
  FiMenu,
  FiX,
  FiMoon, // Imported for Meditation icon
  FiUsers,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

import "./App.css";

// Placeholder images
import mediverseLogo from "./mediverseLogo.png";
import doctorImage from "./doctor.png";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("user_id"),
  );
  const [showSignup, setShowSignup] = useState(false);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userId, setUserId] = useState(localStorage.getItem("user_id") || "");
  const [sessionId, setSessionId] = useState(
    localStorage.getItem("session_id") || "",
  );

  const { darkMode } = useContext(ThemeContext);

  const handleLoginSuccess = (user_id, session_id) => {
    setUserId(user_id);
    setSessionId(session_id);
    localStorage.setItem("user_id", user_id);
    localStorage.setItem("session_id", session_id);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveModule("dashboard");
    setUserId("");
    setSessionId("");
    localStorage.removeItem("user_id");
    localStorage.removeItem("session_id");
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const navigateTo = (module) => {
    setActiveModule(module);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="auth-layout">
        <div className="auth-wrapper">
          <div className="auth-left">
            <div className="auth-welcome">
              <h1>Welcome to MindWell</h1>
              <p>Your personalized mental health companion</p>
            </div>
            <img
              src={doctorImage}
              alt="MindWell Doctor"
              className="doctor-img"
            />
          </div>
          <div className="auth-right">
            {showSignup ? (
              <Signup
                onSignupSuccess={() => setShowSignup(false)}
                onSwitch={() => setShowSignup(false)}
              />
            ) : (
              <Login
                onLoginSuccess={handleLoginSuccess}
                onSwitch={() => setShowSignup(true)}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app-container ${
        isSidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"
      } ${darkMode ? "dark" : ""}`}
    >
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={mediverseLogo} alt="MindWell" className="app-logo" />
          {isSidebarOpen && <span className="app-name">MindWell</span>}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeModule === "dashboard" ? "active" : ""}`}
            onClick={() => navigateTo("dashboard")}
          >
            <FiHome size={20} />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "chat" ? "active" : ""}`}
            onClick={() => navigateTo("chat")}
          >
            <FiMessageSquare size={20} />
            {isSidebarOpen && <span>Therapist AI</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "dailyRoutine" ? "active" : ""}`}
            onClick={() => navigateTo("dailyRoutine")}
          >
            <FiCalendar size={20} />
            {isSidebarOpen && <span>Daily Routine</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "meditation" ? "active" : ""}`}
            onClick={() => navigateTo("meditation")}
          >
            <FiMoon size={20} />
            {isSidebarOpen && <span>Meditation</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "mood" ? "active" : ""}`}
            onClick={() => navigateTo("mood")}
          >
            <FiSmile size={20} />
            {isSidebarOpen && <span>Mood Tracker</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "journaling" ? "active" : ""}`}
            onClick={() => navigateTo("journaling")}
          >
            <FiBookOpen size={20} />
            {isSidebarOpen && <span>Journaling</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "calmSounds" ? "active" : ""}`}
            onClick={() => navigateTo("calmSounds")}
          >
            <FiActivity size={20} />
            {isSidebarOpen && <span>Calm Sounds</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "resources" ? "active" : ""}`}
            onClick={() => navigateTo("resources")}
          >
            <FiBookOpen size={20} />
            {isSidebarOpen && <span>Resources</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "sleep" ? "active" : ""}`}
            onClick={() => navigateTo("sleep")}
          >
            <FiActivity size={20} />
            {isSidebarOpen && <span>Sleep Health</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "community" ? "active" : ""}`}
            onClick={() => navigateTo("community")}
          >
            <FiUsers size={20} />
            {isSidebarOpen && <span>Community</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "goals" ? "active" : ""}`}
            onClick={() => navigateTo("goals")}
          >
            <FiTarget size={20} />
            {isSidebarOpen && <span>Goal Setting</span>}
          </button>

          <button
            className={`nav-item ${activeModule === "analytics" ? "active" : ""}`}
            onClick={() => navigateTo("analytics")}
          >
            <FiTrendingUp size={20} />
            {isSidebarOpen && <span>Insights</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="navbar">
          <div className="navbar-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            <h2 className="page-title">
              {activeModule === "dashboard" && "Dashboard"}
              {activeModule === "chat" && "MindWell Therapist"}
              {activeModule === "dailyRoutine" && "Daily Routine"}
              {activeModule === "meditation" && "Meditation & Focus"}
              {activeModule === "mood" && "Mood Tracker"}
              {activeModule === "journaling" && "Journaling"}
              {activeModule === "calmSounds" && "Calm Sounds"}
              {activeModule === "resources" && "Resources"}
              {activeModule === "sleep" && "Sleep Health"}
              {/* {activeModule === "community" && "Community"} */}
              {/* {activeModule === "goals" && "Goal Setting"} */}
              {activeModule === "analytics" && "Wellness Analytics"}
            </h2>
          </div>

          <div className="navbar-right">
            <UserMenu
              userEmail={userId}
              onLogout={handleLogout}
              onEnableChat={() => navigateTo("chat")}
            />
          </div>
        </header>

        {/* content-scrollable with chat-mode conditional class for better scrolling */}
        <div
          className={`content-scrollable ${activeModule === "chat" ? "chat-mode" : ""}`}
        >
          {activeModule === "dashboard" && (
            <Dashboard
              onNavigate={navigateTo}
              userId={userId}
              sessionId={sessionId}
            />
          )}
          {activeModule === "chat" && (
            <Chat userId={userId} sessionId={sessionId} />
          )}
          {activeModule === "dailyRoutine" && <DailyRoutine userId={userId} />}
          {activeModule === "meditation" && <Meditation userId={userId} />}
          {activeModule === "mood" && <MoodTracker userId={userId} />}
          {activeModule === "journaling" && <Journaling userId={userId} />}
          {activeModule === "calmSounds" && <CalmSounds />}
          {activeModule === "resources" && <Resources />}
          {activeModule === "sleep" && <SleepHealth userId={userId} />}
          {activeModule === "community" && <Community userId={userId} />}
          {activeModule === "goals" && <GoalSetting userId={userId} />}
          {activeModule === "analytics" && (
            <Insights userId={userId} sessionId={sessionId} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
