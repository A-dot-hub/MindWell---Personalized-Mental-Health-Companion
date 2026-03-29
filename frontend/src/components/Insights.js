import React, { useState, useEffect } from "react";
import {
  FiTrendingUp,
  FiSmile,
  FiActivity,
  FiCheckSquare,
  FiMessageSquare,
  FiMoon,
  FiTarget,
  FiZap,
  FiCheckCircle,
  FiStar,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "./Insights.css";

const COLORS = ["#10b981", "#ef4444", "#9ca3af"]; // Positive, Negative, Neutral

function Insights({ userId }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/insights/${userId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [userId]);

  const renderSkeleton = () => (
    <div className="insights-container">
      <div className="insights-header">
        <h1>
          <Skeleton width={300} />
        </h1>
        <p>
          <Skeleton width={400} />
        </p>
      </div>

      <div className="top-cards-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card skeleton-card">
            <Skeleton circle width={56} height={56} />
            <div className="stat-content" style={{ flex: 1 }}>
              <Skeleton width="60%" />
              <Skeleton width="40%" height={32} />
            </div>
          </div>
        ))}
      </div>

      <div className="insight-card ai-summary-card skeleton-card">
        <h2>
          <Skeleton width={250} />
        </h2>
        <div className="ai-content-grid">
          <div className="ai-section">
            <h3>
              <Skeleton width={150} />
            </h3>
            <Skeleton count={3} />
          </div>
          <div className="ai-section">
            <h3>
              <Skeleton width={150} />
            </h3>
            <Skeleton count={3} />
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="insight-card chart-card skeleton-card">
            <h2>
              <Skeleton width={200} />
            </h2>
            <Skeleton height={200} />
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return renderSkeleton();

  if (!data) {
    return (
      <div className="insights-container">
        <div className="loading-state">Failed to load insights.</div>
      </div>
    );
  }

  const totalItems =
    (data?.productivity?.total_tasks || 0) +
    (data?.productivity?.total_goals || 0);

  const completedItems =
    (data?.productivity?.completed_tasks || 0) +
    (data?.productivity?.completed_goals || 0);

  const taskRate =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const taskPieData = [
    { name: "Completed", value: completedItems },
    { name: "Pending", value: totalItems - completedItems },
  ];

  const sentimentData = [
    { name: "Positive", value: data.sentiment.positive },
    { name: "Negative", value: data.sentiment.negative },
    { name: "Neutral", value: data.sentiment.neutral },
  ];

  return (
    <div className="insights-container">
      <div className="insights-header">
        <h1>
          <FiTrendingUp /> Wellness Analytics
        </h1>
        <p>Your personalized mental health and productivity dashboard.</p>
      </div>

      {/* Top Cards */}
      <div className="top-cards-grid">
        <div className="stat-card">
          <div className="stat-icon mood">
            <FiSmile />
          </div>
          <div className="stat-content">
            <h3>Mood Score</h3>
            <div className="stat-value">
              {data.mood_score}
              <span className="stat-unit">/100</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stress">
            <FiZap />
          </div>
          <div className="stat-content">
            <h3>Stress Streak</h3>
            <div className="stat-value">
              {data.stress_streak}
              <span className="stat-unit"> days</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sleep">
            <FiMoon />
          </div>
          <div className="stat-content">
            <h3>Sleep Avg</h3>
            <div className="stat-value">
              {data.sleep.average}
              <span className="stat-unit"> hrs</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon productivity">
            <FiTarget />
          </div>
          <div className="stat-content">
            <h3>Productivity</h3>
            <div className="stat-value">
              {data.productivity.overall_productivity}
              <span className="stat-unit">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Box */}
      <div className="insight-card ai-summary-card">
        <div className="ai-header">
          <div className="ai-icon-wrapper">
            <FiMessageSquare />
          </div>
          <h2>AI Wellness Insights</h2>
        </div>

        {data.insights.length > 0 && (
          <div className="ai-highlight-box">
            <strong>Key Insight:</strong> {data.insights[0]}
          </div>
        )}

        <div className="ai-content-grid">
          <div className="ai-section">
            <h3>
              <FiActivity className="section-icon" /> Key Observations
            </h3>
            <ul>
              {data.insights.slice(1).map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </div>
          <div className="ai-section">
            <h3>
              <FiStar className="section-icon" /> Suggestions for You
            </h3>
            <ul className="suggestions-list">
              {data.suggestions.map((suggestion, idx) => (
                <li key={idx}>
                  <FiCheckCircle className="suggestion-icon" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Mood Trend */}
        <div className="insight-card chart-card">
          <h2>
            <FiTrendingUp /> Mood Trend (Last 7 Days)
          </h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.mood_trend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-color)"
                />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => val.substring(5)}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                  formatter={(value) => [`${value}/100`, `Mood Score`]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#8b5cf6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="insight-card chart-card">
          <h2>
            <FiSmile /> Sentiment Distribution
          </h2>
          <div className="chart-wrapper pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  }}
                  formatter={(value) => [`${value}%`, `Sentiment`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              <div className="legend-item">
                <span className="dot" style={{ background: COLORS[0] }}></span>
                Positive ({data.sentiment.positive}%)
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: COLORS[1] }}></span>
                Negative ({data.sentiment.negative}%)
              </div>
              <div className="legend-item">
                <span className="dot" style={{ background: COLORS[2] }}></span>
                Neutral ({data.sentiment.neutral}%)
              </div>
            </div>
          </div>
        </div>

        {/* Task Completion */}
        <div className="insight-card chart-card">
          <h2>
            <FiCheckSquare /> Task Completion
          </h2>

          {totalItems > 0 ? (
            <div
              className="chart-wrapper pie-wrapper"
              style={{ position: "relative" }}
            >
              {/* ✅ CENTER TEXT */}
              <div
                className="chart-center-text"
                style={{
                  color: taskRate > 50 ? "#10b981" : "#ef4444",
                }}
              >
                {taskRate}%
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={taskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={800}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#e5e7eb" />
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                    formatter={(value, name) => [`${value} items`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* ✅ LEGEND */}
              <div className="pie-legend">
                <div className="legend-item">
                  <span
                    className="dot"
                    style={{ background: "#3b82f6" }}
                  ></span>
                  Completed ({completedItems})
                </div>
                <div className="legend-item">
                  <span
                    className="dot"
                    style={{ background: "#e5e7eb" }}
                  ></span>
                  Pending task (
                  {data.productivity.total_tasks -
                    data.productivity.completed_tasks}
                  )
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-chart">
              <p>No tasks yet</p>
              <span>Add tasks to track productivity 🚀</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Insights;
