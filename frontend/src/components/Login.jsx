import { useState } from "react";
import { login as apiLogin } from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">{"\u{1F4DA}"}</div>
        <h1>Study Dashboard</h1>
        <p className="subtitle">Sign in to track your progress</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@study.app"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in\u2026" : "Sign In"}
          </button>
        </form>
        <div className="hint">
          Demo: student@study.app / study123
        </div>
      </div>
    </div>
  );
}
