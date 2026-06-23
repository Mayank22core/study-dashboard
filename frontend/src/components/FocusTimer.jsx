import { useState, useEffect, useRef } from "react";
import { saveSession } from "../api";

const CIRCUMFERENCE = 2 * Math.PI * 78;

const PRESETS = {
  short: { work: 25 * 60, break: 5 * 60, label: "25/5" },
  long: { work: 50 * 60, break: 10 * 60, label: "50/10" },
};

export default function FocusTimer({ onSessionSaved }) {
  const [preset, setPreset] = useState("short");
  const [mode, setMode] = useState("work");
  const [seconds, setSeconds] = useState(PRESETS.short.work);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const presetRef = useRef(preset);

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function start() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          handleComplete();
          const p = presetRef.current;
          return mode === "work" ? PRESETS[p].break : PRESETS[p].work;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pause() {
    clearInterval(intervalRef.current);
    setRunning(false);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(mode === "work" ? PRESETS[preset].work : PRESETS[preset].break);
  }

  function switchPreset(p) {
    if (running) return;
    clearInterval(intervalRef.current);
    setRunning(false);
    setPreset(p);
    setMode("work");
    setSeconds(PRESETS[p].work);
  }

  async function handleComplete() {
    if (mode === "work") {
      try {
        await saveSession(PRESETS[presetRef.current].work);
        if (onSessionSaved) onSessionSaved();
      } catch {}
      setMode("break");
      setSeconds(PRESETS[presetRef.current].break);
    } else {
      setMode("work");
      setSeconds(PRESETS[presetRef.current].work);
    }
  }

  function toggleMode() {
    reset();
    if (mode === "work") {
      setMode("break");
      setSeconds(PRESETS[preset].break);
    } else {
      setMode("work");
      setSeconds(PRESETS[preset].work);
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const total = mode === "work" ? PRESETS[preset].work : PRESETS[preset].break;
  const progress = 1 - seconds / total;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="timer-display">
      <div className="timer-circle">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle className="bg" cx="90" cy="90" r="78" />
          <circle
            className={`progress ${mode === "break" ? "break-progress" : ""}`}
            cx="90" cy="90" r="78"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="timer-center">
          <div className="time">{formatTime(seconds)}</div>
          <div className={`timer-label ${mode}`}>
            {mode === "work" ? "Focus" : "Break"}
          </div>
        </div>
      </div>

      <div className="timer-controls">
        {!running ? (
          <button className="btn btn-success" onClick={start}>
            {"\u25B6"} Start
          </button>
        ) : (
          <button className="btn btn-warning" onClick={pause}>
            {"\u275A\u275A"} Pause
          </button>
        )}
        <button className="btn btn-ghost" onClick={reset}>
          {"\u21BB"} Reset
        </button>
        <button className="btn btn-ghost" onClick={toggleMode}>
          {mode === "work" ? "Break" : "Focus"}
        </button>
      </div>

      <div className="timer-mode-switch">
        <span>Mode:</span>
        {Object.entries(PRESETS).map(([key, val]) => (
          <button
            key={key}
            className={`toggle-btn ${preset === key ? "active" : ""}`}
            onClick={() => switchPreset(key)}
          >
            {val.label}
          </button>
        ))}
      </div>
    </div>
  );
}
