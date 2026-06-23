const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yest";
  return DAYS[d.getDay()];
}

export default function DashboardStats({ stats }) {
  if (!stats) {
    return <div className="empty-state">Loading stats\u2026</div>;
  }

  const weekly = stats.weekly || [];

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{stats.tasksDone}/{stats.tasksTotal}</div>
          <div className="label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="value">{formatDuration(stats.todaySeconds)}</div>
          <div className="label">Studied Today</div>
        </div>
      </div>

      {weekly.length > 0 && (
        <div className="weekly-chart">
          <h3>This Week</h3>
          <div className="chart-bars">
            {weekly.map((day) => {
              const maxSec = Math.max(...weekly.map((d) => d.seconds), 1);
              const height = Math.max(4, (day.seconds / maxSec) * 50);
              return (
                <div key={day.date} className="chart-bar-wrap">
                  <div
                    className="chart-bar"
                    style={{ height: `${height}px` }}
                    title={formatDuration(day.seconds)}
                  />
                  <span className="chart-label">{getDayLabel(day.date)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
