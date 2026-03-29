"use client";

import { useState } from "react";
import {
  FiBookOpen,
  FiHeadphones,
  FiPlayCircle,
  FiHeart,
  FiBookmark,
  FiSearch,
  FiClock,
  FiStar,
} from "react-icons/fi";
import "./Resources.css";

const categories = [
  "All",
  "Mental Health",
  "Anxiety & Stress",
  "Sleep",
  "Mindfulness",
  "Self Growth",
];

const resourcesData = [
  {
    id: 1,
    title: "Understanding Anxiety",
    description:
      "Learn what anxiety really is, why it happens, and how your mind reacts to stress.",
    category: "Anxiety & Stress",
    type: "Article",
    duration: "6 min read",
    level: "Beginner",
    featured: true,
  },
  {
    id: 2,
    title: "5-Minute Breathing Reset",
    description:
      "A quick breathing technique to calm your nervous system instantly.",
    category: "Mindfulness",
    type: "Audio",
    duration: "5 min",
    level: "Easy",
  },
  {
    id: 3,
    title: "Sleep Better Tonight",
    description:
      "Simple habits backed by psychology to improve your sleep quality.",
    category: "Sleep",
    type: "Guide",
    duration: "8 min read",
    level: "Beginner",
  },
  {
    id: 4,
    title: "Emotional Journaling",
    description:
      "A guided approach to journaling that helps process emotions safely.",
    category: "Mental Health",
    type: "Exercise",
    duration: "10 min",
    level: "Intermediate",
  },
  {
    id: 5,
    title: "Daily Self-Care Rituals",
    description:
      "Tiny daily habits that create long-term emotional resilience.",
    category: "Self Growth",
    type: "Article",
    duration: "7 min read",
    level: "Beginner",
  },
  {
    id: 6,
    title: "Overthinking Detox",
    description:
      "Learn how to gently stop repetitive thoughts and mental loops.",
    category: "Anxiety & Stress",
    type: "Audio",
    duration: "6 min",
    level: "Intermediate",
  },
];

export default function Resources() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");

  const toggleSave = (id) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredResources = resourcesData.filter((res) => {
    const matchesCategory =
      activeCategory === "All" || res.category === activeCategory;
    const matchesSearch = res.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="resources-page">
      {/* HERO */}
      <div className="resources-hero">
        <h1>Resources for Your Mind 🌿</h1>
        <p>Learn, heal, and grow at your own pace. No pressure. No judgment.</p>

        <div className="resources-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="resources-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            className={cat === activeCategory ? "active" : ""}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FEATURED */}
      {resourcesData.some((r) => r.featured) && (
        <div className="featured-section">
          <h2>⭐ Featured</h2>

          {resourcesData
            .filter((r) => r.featured)
            .map((res) => (
              <div key={res.id} className="featured-card">
                <div className="featured-content">
                  <div className="featured-badge">Featured {res.type}</div>
                  <h3>{res.title}</h3>
                  <p>{res.description}</p>

                  <div className="meta">
                    <span>
                      <FiClock /> {res.duration}
                    </span>
                    <span>
                      <FiStar /> {res.level}
                    </span>
                  </div>

                  <button className="primary-btn">
                    <FiPlayCircle /> Explore Now
                  </button>
                </div>
                <div className="featured-image-placeholder">
                  <FiBookOpen className="featured-bg-icon" />
                </div>
              </div>
            ))}
        </div>
      )}

      {/* RESOURCE GRID */}
      <div className="resources-grid">
        {filteredResources.map((res) => (
          <div key={res.id} className="resource-card">
            <div className="resource-top">
              <div className="resource-icon">
                {res.type === "Audio" && <FiHeadphones />}
                {res.type === "Article" && <FiBookOpen />}
                {res.type === "Guide" && <FiPlayCircle />}
                {res.type === "Exercise" && <FiHeart />}
              </div>

              <button
                className={`save-btn ${saved.includes(res.id) ? "saved" : ""}`}
                onClick={() => toggleSave(res.id)}
              >
                <FiBookmark />
              </button>
            </div>

            <div className="resource-category-badge">{res.category}</div>
            <h3>{res.title}</h3>
            <p className="resource-desc">{res.description}</p>

            <div className="resource-meta">
              <span>
                <FiClock /> {res.duration}
              </span>
              <span>
                <FiStar /> {res.level}
              </span>
            </div>

            <button className="secondary-btn">Explore</button>
          </div>
        ))}
      </div>

      {/* EMPTY */}
      {filteredResources.length === 0 && (
        <div className="empty-state">
          <h3>More content coming soon 🌱</h3>
          <p>We’re preparing something meaningful for you.</p>
        </div>
      )}
    </div>
  );
}
