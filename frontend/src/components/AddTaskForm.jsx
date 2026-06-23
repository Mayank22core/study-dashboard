import { useState } from "react";

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd(title.trim(), subject.trim(), deadline || null);
    setTitle("");
    setSubject("");
    setDeadline("");
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What do you want to study?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div className="add-task-row">
        <input
          type="text"
          placeholder="Subject (e.g. Math)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>
      <button className="btn" type="submit">+ Add Task</button>
    </form>
  );
}
