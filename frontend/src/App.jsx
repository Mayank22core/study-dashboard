import { useState, useEffect } from "react";
import Login from "./components/Login";
import DashboardStats from "./components/DashboardStats";
import AddTaskForm from "./components/AddTaskForm";
import TaskList from "./components/TaskList";
import FocusTimer from "./components/FocusTimer";
import { getTasks, getStats, deleteTask, updateTask, createTask, logout } from "./api";
import "./App.css";

const THEMES = [
  { id: "light", label: "Light" },
  { id: "neon", label: "Neon Nights" },
  { id: "sunset", label: "Sunset Glow" },
  { id: "forest", label: "Forest Deep" },
  { id: "cyber", label: "Cyberpunk" },
];

function getInitialTheme() {
  return localStorage.getItem("theme") || "light";
}

const initialTheme = getInitialTheme();
document.documentElement.setAttribute("data-theme", initialTheme);

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(initialTheme);

  const isLoggedIn = !!token;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleLogin(t) {
    setToken(t);
  }

  function handleLogout() {
    logout();
  }

  async function loadData() {
    try {
      const [t, s] = await Promise.all([getTasks(), getStats()]);
      setTasks(t);
      setStats(s);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn]);

  async function handleAddTask(title, subject, deadline) {
    await createTask(title, subject, deadline);
    await loadData();
  }

  async function handleToggleTask(id, completed) {
    await updateTask(id, { completed: !completed });
    await loadData();
  }

  async function handleDeleteTask(id) {
    await deleteTask(id);
    await loadData();
  }

  async function handleSessionSaved() {
    await loadData();
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="header-icon">{"\u{1F4DA}"}</div>
          <h1>Study Dashboard</h1>
        </div>
        <div className="header-right">
          <select
            className="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button className="btn btn-sm btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        <div className="col">
          <section className="card">
            <div className="card-header">
              <span className="icon">{"\u{1F4CA}"}</span>
              <h2>Today's Progress</h2>
            </div>
            <DashboardStats stats={stats} />
          </section>

          <section className="card">
            <div className="card-header">
              <span className="icon">{"\u23F2"}</span>
              <h2>Focus Timer</h2>
            </div>
            <FocusTimer onSessionSaved={handleSessionSaved} />
          </section>
        </div>

        <div className="col">
          <section className="card">
            <div className="card-header">
              <span className="icon">{"\u{1F4DD}"}</span>
              <h2>Add Task</h2>
            </div>
            <AddTaskForm onAdd={handleAddTask} />
          </section>

          <section className="card">
            <div className="card-header">
              <span className="icon">{"\u{1F4CB}"}</span>
              <h2>Tasks</h2>
            </div>
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
