import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb, getDb, saveDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "study-dashboard-secret-key-change-in-production";

app.use(cors());
app.use(express.json());

function query(sql, params) {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const rows = query("SELECT id, password FROM users WHERE email = ?", [email]);
  if (rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, rows[0].password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: rows[0].id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/api/tasks", authMiddleware, (req, res) => {
  const tasks = query(
    "SELECT id, title, subject, deadline, completed, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
    [req.userId]
  );
  res.json(tasks.map(t => ({ ...t, deadline: t.deadline || null, completed: t.completed === 1 })));
});

app.post("/api/tasks", authMiddleware, (req, res) => {
  const { title, subject, deadline } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const db = getDb();
  db.run(
    "INSERT INTO tasks (user_id, title, subject, deadline) VALUES (?, ?, ?, ?)",
    [req.userId, title.trim(), subject || "", deadline || null]
  );
  const id = Number(query("SELECT last_insert_rowid() as id")[0].id);
  saveDb();
  const task = query("SELECT id, title, subject, deadline, completed, created_at FROM tasks WHERE id = ?", [id])[0];
  if (!task) {
    return res.status(500).json({ error: "Failed to retrieve created task" });
  }
  res.status(201).json({ ...task, deadline: task.deadline || null, completed: task.completed === 1 });
});

app.put("/api/tasks/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, subject, deadline, completed } = req.body;
  const existing = query("SELECT id FROM tasks WHERE id = ? AND user_id = ?", [id, req.userId]);
  if (existing.length === 0) {
    return res.status(404).json({ error: "Task not found" });
  }
  const sets = [];
  const params = [];
  if (title !== undefined) { sets.push("title = ?"); params.push(title.trim()); }
  if (subject !== undefined) { sets.push("subject = ?"); params.push(subject); }
  if (deadline !== undefined) { sets.push("deadline = ?"); params.push(deadline || null); }
  if (completed !== undefined) { sets.push("completed = ?"); params.push(completed ? 1 : 0); }
  if (sets.length > 0) {
    const db = getDb();
    db.run(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ?`, [...params, id, req.userId]);
    saveDb();
  }
  const task = query("SELECT id, title, subject, deadline, completed, created_at FROM tasks WHERE id = ?", [id])[0];
  res.json({ ...task, deadline: task.deadline || null, completed: task.completed === 1 });
});

app.delete("/api/tasks/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  db.run("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, req.userId]);
  saveDb();
  res.json({ ok: true });
});

app.post("/api/sessions", authMiddleware, (req, res) => {
  const { duration } = req.body;
  if (!duration || duration < 60) {
    return res.status(400).json({ error: "Duration must be at least 60 seconds" });
  }
  const db = getDb();
  db.run("INSERT INTO sessions (user_id, duration) VALUES (?, ?)", [req.userId, duration]);
  const id = query("SELECT last_insert_rowid() as id")[0].id;
  saveDb();
  res.status(201).json({ id, duration });
});

app.get("/api/sessions", authMiddleware, (req, res) => {
  const sessions = query(
    "SELECT id, duration, date, created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [req.userId]
  );
  res.json(sessions);
});

app.get("/api/stats", authMiddleware, (req, res) => {
  const todayRow = query(
    "SELECT COALESCE(SUM(duration), 0) as seconds FROM sessions WHERE user_id = ? AND date = date('now')",
    [req.userId]
  );
  const todaySeconds = todayRow[0].seconds;
  const weekly = query(
    "SELECT date, SUM(duration) as seconds FROM sessions WHERE user_id = ? AND date >= date('now', '-6 days') GROUP BY date ORDER BY date",
    [req.userId]
  );
  const counts = query(
    "SELECT COUNT(*) as total, SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as done FROM tasks WHERE user_id = ?",
    [req.userId]
  );
  res.json({ todaySeconds, weekly, tasksTotal: counts[0].total, tasksDone: counts[0].done || 0 });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log("Serving frontend from dist/");
}

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();
