import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "study.db");

let db = null;

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    subject TEXT DEFAULT '',
    deadline TEXT,
    completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    date TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  const existing = db.exec("SELECT id FROM users WHERE email = 'student@study.app'");
  if (existing.length === 0) {
    const hash = await bcrypt.hash("study123", 10);
    db.run("INSERT INTO users (email, password) VALUES (?, ?)", ["student@study.app", hash]);
  }

  const existing2 = db.exec("SELECT id FROM users WHERE email = 'alex@study.app'");
  if (existing2.length === 0) {
    const hash = await bcrypt.hash("alex456", 10);
    db.run("INSERT INTO users (email, password) VALUES (?, ?)", ["alex@study.app", hash]);
    const userId = Number(db.exec("SELECT id FROM users WHERE email = 'alex@study.app'")[0].values[0][0]);
    db.run("INSERT INTO tasks (user_id, title, subject, deadline, completed) VALUES (?, ?, ?, ?, ?)", [userId, "Math homework", "Math", "2026-07-01", 0]);
    db.run("INSERT INTO tasks (user_id, title, subject, deadline, completed) VALUES (?, ?, ?, ?, ?)", [userId, "Physics lab report", "Physics", "2026-06-28", 0]);
    db.run("INSERT INTO tasks (user_id, title, subject, deadline, completed) VALUES (?, ?, ?, ?, ?)", [userId, "History essay", "History", "2026-06-25", 1]);
    for (let i = 0; i < 8; i++) {
      const d = 1800 + Math.floor(Math.random() * 2700);
      const day = 20 + Math.floor(Math.random() * 4);
      db.run(`INSERT INTO sessions (user_id, duration, date) VALUES (?, ?, ?)`, [userId, d, `2026-06-${String(day).padStart(2, "0")}`]);
    }
  }

  saveDb();
  return db;
}

export function getDb() {
  return db;
}

export function saveDb() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
