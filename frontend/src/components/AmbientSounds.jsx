import { useState, useRef } from "react";

const SOUNDS = [
  { id: "rain", label: "Rain", icon: "\u{1F327}" },
  { id: "ocean", label: "Ocean", icon: "\u{1F30A}" },
  { id: "forest", label: "Forest", icon: "\u{1F333}" },
  { id: "noise", label: "White Noise", icon: "\u{1F50A}" },
  { id: "lofi", label: "Lo-fi Beat", icon: "\u{1F3B5}" },
];

export default function AmbientSounds() {
  const [active, setActive] = useState(null);
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem("ambientVolume") || "0.5");
  });
  const audioRef = useRef(null);

  function toggleSound(id) {
    if (active === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setActive(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(`/sounds/${id}.mp3`);
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setActive(id);
  }

  function handleVolume(e) {
    const val = parseFloat(e.target.value);
    setVolume(val);
    localStorage.setItem("ambientVolume", String(val));
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }

  return (
    <div className="ambient-sounds">
      <div className="sounds-grid">
        {SOUNDS.map((s) => (
          <button
            key={s.id}
            className={`sound-btn ${active === s.id ? "active" : ""}`}
            onClick={() => toggleSound(s.id)}
          >
            <span className="sound-icon">{s.icon}</span>
            <span className="sound-label">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="volume-row">
        <span className="volume-label">Volume</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolume}
          className="volume-slider"
        />
      </div>
    </div>
  );
}
