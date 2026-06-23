import { useState, useEffect, useRef, useCallback } from "react";
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
  const modeRef = useRef(mode);
  const onSavedRef = useRef(onSessionSaved);

  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { onSavedRef.current = onSessionSaved; }, [onSessionSaved]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function start() {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleComplete = useCallback(async () => {
    const p = presetRef.current;
    const m = modeRef.current;
    if (m === "work") {
      try {
        await saveSession(PRESETS[p].work);
        if (onSavedRef.current) onSavedRef.current();
      } catch {}
      setMode("break");
      setSeconds(PRESETS[p].break);
    } else {
      setMode("work");
      setSeconds(PRESETS[p].work);
    }
  }, []);

  useEffect(() => {
    if (running && seconds === 0 && !intervalRef.current) {
      setRunning(false);
      handleComplete();
    }
  }, [running, seconds, handleComplete]);

  function pause() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }

  function toggleMode() {
    if (running) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    if (modeRef.current === "work") {
      setMode("break");
      setSeconds(PRESETS[preset].break);
    } else {
      setMode("work");
      setSeconds(PRESETS[preset].work);
    }
  }

  function reset() {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setSeconds(modeRef.current === "work" ? PRESETS[preset].work : PRESETS[preset].break);
  }

  function switchPreset(p) {
    if (running) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setPreset(p);
    setMode("work");
    setSeconds(PRESETS[p].work);
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
