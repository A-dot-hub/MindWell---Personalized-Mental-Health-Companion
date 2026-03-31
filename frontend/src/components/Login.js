import React, { useState } from "react";
import { FiMail, FiLock, FiAlertCircle, FiCheck } from "react-icons/fi";
import "./Auth.css";

function Login({ onLoginSuccess, onSwitch }) {
  const [step, setStep] = useState(1); // 1: Login, 2: Forgot Password Email, 3: Reset Password OTP
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateLogin = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotEmail = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = () => {
    const newErrors = {};
    if (!otp) {
      newErrors.otp = "OTP is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.user_id, data.session_id);
      } else {
        setErrors({ form: data.message || "Invalid credentials" });
      }
    } catch (err) {
      setErrors({ form: "Server error, please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!validateForgotEmail()) return;

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setStep(3);
        setErrors({});
      } else {
        setErrors({ form: data.message || "Error sending OTP" });
      }
    } catch (err) {
      setErrors({ form: "Server error, please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateReset()) return;

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await response.json();

      if (data.success) {
        setStep(1);
        setPassword("");
        setOtp("");
        setNewPassword("");
        setErrors({ form: "Password reset successfully. Please log in." }); // Using form error as success message temporarily
      } else {
        setErrors({ form: data.message || "Invalid OTP" });
      }
    } catch (err) {
      setErrors({ form: "Server error, please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h2 className="auth-title">
          {step === 1 && "Welcome Back"}
          {step === 2 && "Reset Password"}
          {step === 3 && "Verify OTP"}
        </h2>
        <p className="auth-subtitle">
          {step === 1 && "Sign in to continue your journey"}
          {step === 2 && "Enter your email to receive an OTP"}
          {step === 3 && `Enter the OTP sent to ${email}`}
        </p>
      </div>

      {errors.form && (
        <div
          className="error-text"
          style={{
            justifyContent: "center",
            marginBottom: "10px",
            color: errors.form.includes("successfully") ? "green" : "",
          }}
        >
          {!errors.form.includes("successfully") && <FiAlertCircle />}{" "}
          {errors.form}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`form-input ${errors.email ? "error" : ""}`}
              required
            />
            <FiMail className="input-icon" />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              className={`form-input ${errors.password ? "error" : ""}`}
              required
            />
            <FiLock className="input-icon" />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing in..." : "Log In"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSendResetOtp} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={`form-input ${errors.email ? "error" : ""}`}
              required
            />
            <FiMail className="input-icon" />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setErrors({});
            }}
            className="auth-link"
            style={{ marginTop: "10px", fontSize: "0.9rem" }}
          >
            Back to Login
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                if (errors.otp) setErrors({ ...errors, otp: "" });
              }}
              className={`form-input ${errors.otp ? "error" : ""}`}
              required
            />
            <FiCheck className="input-icon" />
            {errors.otp && <span className="error-text">{errors.otp}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword)
                  setErrors({ ...errors, newPassword: "" });
              }}
              className={`form-input ${errors.newPassword ? "error" : ""}`}
              required
            />
            <FiLock className="input-icon" />
            {errors.newPassword && (
              <span className="error-text">{errors.newPassword}</span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setErrors({});
            }}
            className="auth-link"
            style={{ marginTop: "10px", fontSize: "0.9rem" }}
          >
            Back to Login
          </button>
        </form>
      )}

      {step === 1 && (
        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <button onClick={onSwitch} className="auth-link">
              Sign Up
            </button>
          </p>

          <button
            type="button"
            onClick={() => {
              setStep(2);
              setErrors({});
            }}
            className="auth-link"
            style={{ fontSize: "0.85rem", marginTop: "5px" }}
          >
            Forgot Password?
          </button>
        </div>
      )}
    </div>
  );
}

export default Login;
