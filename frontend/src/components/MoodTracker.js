"use client";

import { useState, useEffect } from "react";
import {
  FiTrendingUp,
  FiCalendar,
  FiEdit3,
  FiStar,
  FiSmile,
} from "react-icons/fi";
import "./MoodTracker.css";

const MOODS = [
  { id: "happy", label: "Happy", emoji: "😄", score: 5 },
  { id: "calm", label: "Calm", emoji: "😌", score: 4 },
  { id: "neutral", label: "Neutral", emoji: "😐", score: 3 },
  { id: "sad", label: "Sad", emoji: "😞", score: 2 },
  { id: "anxious", label: "Anxious", emoji: "😟", score: 1 },
];

const TAGS = [
  "Work",
  "Family",
  "Health",
  "Friends",
  "Sleep",
  "Stress",
  "Self-care",
  "Social",
];

export default function MoodTracker({ userId }) {
  const today = new Date().toDateString();

  const [mood, setMood] = useState(null);
  const [intensity, setIntensity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* LOAD */
  useEffect(() => {
    const fetchMoods = async () => {
      if (!userId) return;
      setFetching(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/moods/${userId}`);
        const data = await res.json();
        if (data.success) {
          setHistory(data.moods);

          // Check if today's mood is already logged
          const todayEntry = data.moods.find((e) => {
            const entryDate = new Date(e.created_at).toDateString();
            return entryDate === today;
          });

          if (todayEntry) {
            const moodObj = MOODS.find((m) => m.id === todayEntry.mood);
            if (moodObj) setMood(moodObj);
            setIntensity(todayEntry.intensity);
            setEnergy(todayEntry.energy);
            setTags(todayEntry.tags);
            // Note is not saved in backend currently, but we can keep the state
          }
        }
      } catch (err) {
        console.error("Failed to fetch moods", err);
        setToast({ type: "error", message: "Failed to load mood history" });
      } finally {
        setFetching(false);
      }
    };
    fetchMoods();
  }, [userId, today]);

  /* SAVE */
  const saveMood = async () => {
    if (!mood) return;
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          mood: mood.id,
          intensity: parseInt(intensity),
          energy: parseInt(energy),
          tags: tags,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setToast({ type: "success", message: "Mood saved successfully!" });
        // Refresh history
        const refreshRes = await fetch(`http://127.0.0.1:8000/moods/${userId}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setHistory(refreshData.moods);
        }
      } else {
        setToast({
          type: "error",
          message: data.message || "Failed to save mood",
        });
      }
    } catch (err) {
      console.error("Failed to save mood", err);
      setToast({ type: "error", message: "Server error while saving" });
    } finally {
      setLoading(false);
    }
  };

  /* ANALYTICS */
  const avgMood =
    history.length === 0
      ? 0
      : (
          history.reduce((a, b) => {
            const m = MOODS.find((x) => x.id === b.mood);
            return a + (m ? m.score : 0);
          }, 0) / history.length
        ).toFixed(1);

  const streak = (() => {
    let s = 0;
    let d = new Date();
    for (let i = 0; i < history.length; i++) {
      if (
        history.find(
          (e) => new Date(e.created_at).toDateString() === d.toDateString(),
        )
      ) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  })();

  return (
    <div className="mood-root">
      {/* HEADER */}
      <div className="mood-header">
        <div>
          <h1>
            <FiSmile /> Mood Tracker
          </h1>
          <p>Understand your emotions deeply 🌱</p>
        </div>
      </div>

      {/* MOOD PICK */}
      <div className="glass mood-section">
        <h2>How do you feel today?</h2>
        <div className="mood-grid">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={`mood-card ${mood?.id === m.id ? "active" : ""}`}
              onClick={() => setMood(m)}
            >
              <span className="emoji">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SLIDERS */}
      {mood && (
        <div className="glass mood-section">
          <div className="slider-block">
            <label>Intensity: {intensity}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
            />
          </div>

          <div className="slider-block">
            <label>Energy Level: {energy}/10</label>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* TAGS */}
      {mood && (
        <div className="glass mood-section">
          <h2>What influenced your mood?</h2>
          <div className="tag-grid">
            {TAGS.map((t) => (
              <button
                key={t}
                className={`tag ${tags.includes(t) ? "active" : ""}`}
                onClick={() =>
                  setTags((prev) =>
                    prev.includes(t)
                      ? prev.filter((x) => x !== t)
                      : [...prev, t],
                  )
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* JOURNAL */}
      {mood && (
        <div className="glass mood-section">
          <h2>Reflection</h2>
          <textarea
            placeholder="Write what’s on your mind…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {/* SAVE */}
      {mood && (
        <div className="save-area">
          <button className="save-btn" onClick={saveMood} disabled={loading}>
            {loading ? "Saving..." : "Save Today’s Mood"}
          </button>
        </div>
      )}

      {/* ANALYTICS */}
      {history.length > 0 && (
        <div className="glass mood-section analytics">
          <h2>
            <FiTrendingUp /> Insights
          </h2>

          <div className="stats">
            <div className="stat">
              <strong>{avgMood}</strong>
              <span>Avg Mood</span>
            </div>
            <div className="stat">
              <strong>{streak}</strong>
              <span>Day Streak</span>
            </div>
            <div className="stat">
              <strong>{history.length}</strong>
              <span>Total Logs</span>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="glass mood-section">
          <h2>
            <FiCalendar /> Mood History
          </h2>

          <div className="history">
            {history.map((h, i) => {
              const moodObj = MOODS.find((m) => m.id === h.mood);
              const dateStr = new Date(h.created_at).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short", year: "numeric" },
              );
              return (
                <div key={i} className="history-item">
                  <span>{moodObj?.emoji || "😐"}</span>
                  <div>
                    <strong>{moodObj?.label || "Neutral"}</strong>
                    <p>{dateStr}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`toast-notification ${toast.type}`}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 24px",
            borderRadius: "8px",
            color: "#fff",
            zIndex: 1000,
            backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
