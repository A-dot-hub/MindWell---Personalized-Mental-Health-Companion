import React, { useState, useEffect } from "react";
import {
  FiSave,
  FiClock,
  FiCalendar,
  FiEdit3,
  FiSmile,
  FiTrendingUp,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import "./Journaling.css";

const MOODS = [
  { id: "happy", label: "Happy", emoji: "🙂", color: "#22c55e" },
  { id: "neutral", label: "Neutral", emoji: "😐", color: "#64748b" },
  { id: "sad", label: "Sad", emoji: "😔", color: "#3b82f6" },
  { id: "angry", label: "Angry", emoji: "😡", color: "#ef4444" },
  { id: "tired", label: "Tired", emoji: "😴", color: "#a855f7" },
  { id: "grateful", label: "Grateful", emoji: "😍", color: "#f59e0b" },
];

const PROMPTS = [
  "What made me feel grateful today?",
  "What stressed me today?",
  "What is worrying me right now?",
  "One thing I learned today",
];

const MOCK_HISTORY = [
  {
    id: 1,
    date: "28 Feb 2026",
    mood: "happy",
    text: "Had a great productive day!",
    wordCount: 120,
  },
  {
    id: 2,
    date: "27 Feb 2026",
    mood: "sad",
    text: "Felt a bit down due to weather.",
    wordCount: 95,
  },
  {
    id: 3,
    date: "26 Feb 2026",
    mood: "neutral",
    text: "Just a regular day at work.",
    wordCount: 140,
  },
];

function Journaling({ userId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mood, setMood] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const [history, setHistory] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch journals
  useEffect(() => {
    const fetchJournals = async () => {
      if (!userId) return;
      setFetching(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/journals/${userId}`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.journals);
        }
      } catch (err) {
        console.error("Failed to fetch journals", err);
        setToast({ type: "error", message: "Failed to load journals" });
      } finally {
        setFetching(false);
      }
    };
    fetchJournals();
  }, [userId]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePromptClick = (prompt) => {
    setContent((prev) => (prev ? `${prev}\n\n${prompt} ` : `${prompt} `));
  };

  const saveJournal = async () => {
    if (!mood) {
      setToast({ type: "error", message: "Please select a mood first!" });
      return;
    }
    if (!content.trim()) {
      setToast({ type: "error", message: "Journal content cannot be empty!" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          mood: mood.id,
          content: content,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setToast({ type: "success", message: "Journal saved successfully!" });
        setMood(null);
        setContent("");
        // Refresh history
        const refreshRes = await fetch(
          `http://127.0.0.1:8000/journals/${userId}`,
        );
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setHistory(refreshData.journals);
        }
      } else {
        setToast({
          type: "error",
          message: data.message || "Failed to save journal",
        });
      }
    } catch (err) {
      console.error("Failed to save journal", err);
      setToast({ type: "error", message: "Server error while saving" });
    } finally {
      setLoading(false);
    }
  };

  const getMoodObj = (id) => MOODS.find((m) => m.id === id);

  return (
    <div className="journaling-container">
      {/* HEADER */}
      <div className="journal-header">
        <div>
          <h1>
            <FiEdit3 /> Journaling
          </h1>
          <p className="date-display">
            <FiCalendar />{" "}
            {currentDate.toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            <span className="time-separator">•</span>
            <FiClock />{" "}
            {currentDate.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      {/* MOOD SELECTOR */}
      <div className="section-block">
        <h3>How are you feeling?</h3>
        <div className="mood-selector">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood-btn ${mood?.id === m.id ? "selected" : ""}`}
              onClick={() => setMood(m)}
              style={{
                "--mood-color": m.color,
                borderColor: mood?.id === m.id ? m.color : "transparent",
                backgroundColor:
                  mood?.id === m.id ? `${m.color}20` : "var(--bg-secondary)",
              }}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* PROMPTS */}
      <div className="section-block">
        <div className="prompts-list">
          {PROMPTS.map((prompt, index) => (
            <button
              key={index}
              className="prompt-chip"
              onClick={() => handlePromptClick(prompt)}
            >
              ✨ {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* TEXTAREA */}
      <div className="editor-container">
        <textarea
          className="journal-textarea"
          placeholder="Write your thoughts here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="char-counter">{content.length} chars</div>
      </div>

      {/* SAVE BUTTON */}
      <button
        className={`save-journal-btn ${loading ? "loading" : ""}`}
        onClick={saveJournal}
        disabled={loading}
      >
        {loading ? (
          <span className="loader"></span>
        ) : (
          <>
            <FiSave /> Save Entry
          </>
        )}
      </button>

      {/* HISTORY SECTION */}
      <div className="journal-list">
        <h2>
          <FiTrendingUp /> My Previous Journals
        </h2>
        {fetching ? (
          <p>Loading journals...</p>
        ) : history.length === 0 ? (
          <p>No journals yet. Start writing today!</p>
        ) : (
          history.map((entry) => {
            const moodObj = getMoodObj(entry.mood);
            const dateObj = new Date(entry.created_at);
            const formattedDate = dateObj.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const wordCount = entry.content
              .split(/\s+/)
              .filter((w) => w.length > 0).length;
            return (
              <div key={entry._id} className="journal-item">
                <p>{entry.content}</p>
                <small>
                  {formattedDate} •{" "}
                  <span style={{ color: moodObj?.color }}>
                    {moodObj?.emoji} {moodObj?.label}
                  </span>{" "}
                  • {wordCount} words
                </small>
              </div>
            );
          })
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default Journaling;
