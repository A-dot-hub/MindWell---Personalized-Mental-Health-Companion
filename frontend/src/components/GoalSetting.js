import React, { useState, useEffect } from "react";
import {
  FiTarget,
  FiCheckCircle,
  FiCircle,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import "./GoalSetting.css";

function GoalSetting({ userId }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState("Personal");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`http://127.0.0.1:8000/goals/${userId}`);
        const data = await res.json();
        if (data.success) {
          setGoals(data.goals);
        }
      } catch (err) {
        console.error("Failed to fetch goals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [userId]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      showToast("Goal title cannot be empty", "error");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: newGoalTitle,
          category: newGoalCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Goal added successfully!");
        setNewGoalTitle("");

        // Refetch goals
        const updatedRes = await fetch(`http://127.0.0.1:8000/goals/${userId}`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setGoals(updatedData.goals);
        }
      } else {
        showToast("Failed to add goal", "error");
      }
    } catch (err) {
      console.error("Error adding goal", err);
      showToast("An error occurred", "error");
    }
  };

  const handleToggleGoal = async (goalId, currentStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setGoals(
          goals.map((goal) =>
            goal._id === goalId ? { ...goal, completed: !currentStatus } : goal,
          ),
        );
      }
    } catch (err) {
      console.error("Error toggling goal", err);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/goals/${goalId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setGoals(goals.filter((goal) => goal._id !== goalId));
        showToast("Goal deleted");
      }
    } catch (err) {
      console.error("Error deleting goal", err);
    }
  };

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const progress =
    totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  return (
    <div className="goals-container">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="goals-header">
        <h1>
          <FiTarget /> Goal Setting
        </h1>
        <p>Set, track, and achieve your personal milestones.</p>
      </div>

      <div className="goals-content">
        <div className="add-goal-card">
          <h2>Create New Goal</h2>
          <div className="add-goal-form">
            <input
              type="text"
              placeholder="What do you want to achieve?"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value)}
            >
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Career">Career</option>
              <option value="Financial">Financial</option>
            </select>
            <button className="add-btn" onClick={handleAddGoal}>
              <FiPlus /> Add Goal
            </button>
          </div>
        </div>

        <div className="goals-progress-card">
          <h2>Your Progress</h2>
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-value">{completedGoals}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalGoals}</span>
              <span className="stat-label">Total Goals</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{progress}% Completed</p>
        </div>

        <div className="goals-list-card">
          <h2>Your Goals</h2>
          {loading ? (
            <div className="loading-state">Loading goals...</div>
          ) : goals.length > 0 ? (
            <div className="goals-list">
              {goals.map((goal) => (
                <div
                  key={goal._id}
                  className={`goal-item ${goal.completed ? "completed" : ""}`}
                >
                  <button
                    className="toggle-btn"
                    onClick={() => handleToggleGoal(goal._id, goal.completed)}
                  >
                    {goal.completed ? (
                      <FiCheckCircle className="checked" />
                    ) : (
                      <FiCircle />
                    )}
                  </button>
                  <div className="goal-details">
                    <span className="goal-title">{goal.title}</span>
                    <span
                      className={`goal-category cat-${goal.category.toLowerCase()}`}
                    >
                      {goal.category}
                    </span>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteGoal(goal._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No goals set yet. Start by adding one above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GoalSetting;
