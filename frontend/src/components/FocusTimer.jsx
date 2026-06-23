import { useState, useEffect, useRef } from "react";
import { saveSession } from "../api";

const WORK = 25 * 60;
const BREAK = 5 * 60;
const CIRCUMFERENCE = 2 * Math.PI * 78;

export default function FocusTimer({ onSessionSaved }) {
  const [mode, setMode] = useState("work");
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

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
          return mode === "work" ? BREAK : WORK;
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
    setSeconds(mode === "work" ? WORK : BREAK);
  }

  async function handleComplete() {
    if (mode === "work") {
      try {
        await saveSession(WORK);
        if (onSessionSaved) onSessionSaved();
      } catch {}
      setMode("break");
      setSeconds(BREAK);
    } else {
      setMode("work");
      setSeconds(WORK);
    }
  }

  function toggleMode() {
    reset();
    if (mode === "work") {
      setMode("break");
      setSeconds(BREAK);
    } else {
      setMode("work");
      setSeconds(WORK);
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const total = mode === "work" ? WORK : BREAK;
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
    </div>
  );
}
