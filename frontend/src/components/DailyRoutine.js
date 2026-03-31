"use client";

import { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiStar, FiSun } from "react-icons/fi";
import "./DailyRoutine.css";

const CATEGORIES = [
  { id: "morning", label: "Morning ☀️" },
  { id: "work", label: "Work 💻" },
  { id: "health", label: "Health 🏃" },
  { id: "self", label: "Self-care 🧘" },
  { id: "night", label: "Night 🌙" },
];

const MOODS = ["😄", "😊", "😐", "😔", "😴"];

export default function DailyRoutine({ userId }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newTask, setNewTask] = useState("");
  const [newTime, setNewTime] = useState("");
  const [category, setCategory] = useState("morning");
  const [priority, setPriority] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState(null);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  /* 🔐 Persist */
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userId) return;
      setFetching(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/tasks/${userId}`);
        const data = await res.json();
        if (data.success) {
          // Map backend tasks to frontend format
          const formattedTasks = data.tasks.map((t) => ({
            id: t._id,
            title: t.title,
            time: "Anytime", // Backend doesn't store time currently
            category: t.category,
            priority: false, // Backend doesn't store priority currently
            mood: "",
            done: t.completed,
            editing: false,
          }));
          setTasks(formattedTasks);
        }
      } catch (err) {
        console.error("Failed to fetch tasks", err);
        setToast({ type: "error", message: "Failed to load tasks" });
      } finally {
        setFetching(false);
      }
    };
    fetchTasks();
  }, [userId]);

  const completedCount = tasks.filter((t) => t.done).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const addTask = async () => {
    if (!newTask.trim()) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: newTask,
          category: category,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTasks((prev) => [
          ...prev,
          {
            id: data.task_id,
            title: newTask,
            time: newTime || "Anytime",
            category,
            priority,
            mood: "",
            done: false,
            editing: false,
          },
        ]);
        setToast({ type: "success", message: "Task added!" });
      } else {
        setToast({
          type: "error",
          message: data.message || "Failed to add task",
        });
      }
    } catch (err) {
      console.error("Failed to add task", err);
      setToast({ type: "error", message: "Server error while adding task" });
    }

    setNewTask("");
    setNewTime("");
    setPriority(false);
    setCategory("morning");
    setShowModal(false);
  };

  const toggleTask = async (id) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );

    try {
      const res = await fetch(`http://127.0.0.1:8000/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.done }),
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: task.done } : t)),
        );
        setToast({ type: "error", message: "Failed to update task" });
      }
    } catch (err) {
      console.error("Failed to update task", err);
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: task.done } : t)),
      );
      setToast({ type: "error", message: "Server error while updating task" });
    }
  };

  const deleteTask = async (id) => {
    // Optimistic UI
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: true } : t)),
    );

    try {
      const res = await fetch(`http://127.0.0.1:8000/tasks/${id}/complete`, {
        method: "PUT",
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error("Failed");
      }

      setToast({ type: "success", message: "Task marked as completed ✅" });
    } catch (err) {
      console.error(err);

      // Revert if failed
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: false } : t)),
      );

      setToast({ type: "error", message: "Failed to update task" });
    }
  };

  const toggleEdit = (id) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, editing: !t.editing } : t)),
    );

  const updateTitle = (id, value) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: value } : t)),
    );

  const setMood = (id, mood) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, mood } : t)));

  return (
    <div className="daily-routine">
      {/* HEADER */}
      <div className="routine-header">
        <div>
          <h1>
            <FiSun /> Daily Routine
          </h1>
          <p>{today}</p>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="routine-progress">
        <div className="progress-ring">
          <svg>
            <circle cx="36" cy="36" r="32" />
            <circle
              cx="36"
              cy="36"
              r="32"
              style={{
                strokeDashoffset: 200 - (200 * progress) / 100,
              }}
            />
          </svg>
          <span>{progress}%</span>
        </div>

        <div className="progress-text">
          <strong>{completedCount}</strong> / {tasks.length} done
          <p className="motivation">
            {progress === 100
              ? "Perfect day 🌟"
              : progress >= 60
                ? "Almost there 💪"
                : "One task at a time 🌱"}
          </p>
        </div>
      </div>

      {/* TASKS BY CATEGORY */}
      {CATEGORIES.map((cat) => (
        <div key={cat.id}>
          <h2 className="category-title">{cat.label}</h2>

          <div className="task-list">
            {tasks
              .filter((t) => t.category === cat.id)
              .map((task) => (
                <div
                  key={task.id}
                  className={`task-card ${task.done ? "done" : ""} ${
                    task.priority ? "priority" : ""
                  }`}
                >
                  <div onClick={() => toggleTask(task.id)}>
                    {task.editing ? (
                      <input
                        value={task.title}
                        onChange={(e) => updateTitle(task.id, e.target.value)}
                        onBlur={() => toggleEdit(task.id)}
                        autoFocus
                      />
                    ) : (
                      <h3>{task.title}</h3>
                    )}
                    <p>{task.time}</p>
                  </div>

                  <div className="task-actions">
                    {task.priority && <FiStar className="star" />}
                    {task.done && (
                      <div className="mood-picker">
                        {MOODS.map((m) => (
                          <span
                            key={m}
                            onClick={() => setMood(task.id, m)}
                            className={task.mood === m ? "active" : ""}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => toggleEdit(task.id)}>
                      <FiEdit2 />
                    </button>
                    <button onClick={() => deleteTask(task.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* ADD */}
      <button className="add-task-btn" onClick={() => setShowModal(true)}>
        <FiPlus /> Add Task
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="task-modal">
            <h2>Add New Task</h2>

            <input
              placeholder="Task name"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />

            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="priority-toggle">
              <input
                type="checkbox"
                checked={priority}
                onChange={() => setPriority(!priority)}
              />
              Priority task
            </label>

            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button className="primary" onClick={addTask}>
                Add
              </button>
            </div>
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
