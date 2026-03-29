import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiMessageSquare,
  FiHeart,
  FiShare2,
  FiClock,
} from "react-icons/fi";
import "./Community.css";

function Community({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/community/posts`);
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error("Failed to fetch community posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      showToast("Post content cannot be empty", "error");
      return;
    }
    if (!userId) {
      showToast("Please log in to post", "error");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          content: newPostContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Post created successfully!");
        setNewPostContent("");

        // Refetch posts
        const updatedRes = await fetch(`http://127.0.0.1:8000/community/posts`);
        const updatedData = await updatedRes.json();
        if (updatedData.success) {
          setPosts(updatedData.posts);
        }
      } else {
        showToast("Failed to create post", "error");
      }
    } catch (err) {
      console.error("Error creating post", err);
      showToast("An error occurred", "error");
    }
  };

  const handleLike = async (postId) => {
    if (!userId) {
      showToast("Please log in to like posts", "error");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/community/posts/${postId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        // Update local state for immediate feedback
        setPosts(
          posts.map((post) => {
            if (post._id === postId) {
              const isLiked = post.likes.includes(userId);
              const newLikes = isLiked
                ? post.likes.filter((id) => id !== userId)
                : [...post.likes, userId];
              return { ...post, likes: newLikes };
            }
            return post;
          }),
        );
      }
    } catch (err) {
      console.error("Error liking post", err);
    }
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="community-container">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="community-header">
        <h1>
          <FiUsers /> Community Support
        </h1>
        <p>
          Share your thoughts, read others' experiences, and support each other.
        </p>
      </div>

      <div className="community-content">
        <div className="create-post-card">
          <textarea
            placeholder="Share what's on your mind..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={4}
          />
          <div className="create-post-actions">
            <button className="post-btn" onClick={handleCreatePost}>
              <FiMessageSquare /> Post
            </button>
          </div>
        </div>

        <div className="posts-feed">
          {loading ? (
            <div className="loading-state">Loading community posts...</div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <div className="post-author">
                    <div className="author-avatar">
                      {post.user_id.charAt(0).toUpperCase()}
                    </div>
                    <span className="author-name">
                      User {post.user_id.substring(0, 4)}...
                    </span>
                  </div>
                  <div className="post-time">
                    <FiClock /> {timeAgo(post.created_at)}
                  </div>
                </div>

                <div className="post-body">{post.content}</div>

                <div className="post-footer">
                  <button
                    className={`action-btn ${post.likes.includes(userId) ? "liked" : ""}`}
                    onClick={() => handleLike(post._id)}
                  >
                    <FiHeart
                      className={post.likes.includes(userId) ? "filled" : ""}
                    />
                    {post.likes.length}
                  </button>
                  <button className="action-btn">
                    <FiShare2 /> Share
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Community;
