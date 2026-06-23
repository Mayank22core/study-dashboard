export default function TaskList({ tasks, onToggle, onDelete }) {
  if (!tasks || tasks.length === 0) {
    return <div className="empty-state">No tasks yet. Add one above!</div>;
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id, task.completed)}
          />
          <div className="task-info">
            <div className="task-title">{task.title}</div>
            <div className="task-meta">
              {task.subject && <span className="subject">{task.subject}</span>}
              {task.deadline && <span>Due {task.deadline}</span>}
            </div>
          </div>
          <button className="btn-danger-ghost" onClick={() => onDelete(task.id)}>
            {"\u2715"}
          </button>
        </div>
      ))}
    </div>
  );
}
