import './Sidebar.css';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">✓</div>
        <div>
          <div className="brand-name">Class Saathi</div>
          <div className="brand-sub">ADMIN CONSOLE</div>
        </div>
      </div>
      
      <div className="inst-card">
        <div className="inst-label">INSTITUTION</div>
        <div className="inst-name">Delhi Public School, Dwarka</div>
        <div className="inst-meta">847 students · 30 teachers · Grades 1–10</div>
      </div>
      
      <div className="nav-group">
        <div className="nav-title">OVERVIEW</div>
        <a className="nav-item" href="#school-overview">
          <span className="nav-ico">🏫</span> School Overview
        </a>
      </div>
      
      <div className="nav-group">
        <div className="nav-title">ANALYTICS</div>
        <a className="nav-item" href="#learning">
          <span className="nav-ico">📖</span> Learning
        </a>
        <a className="nav-item" href="#home-learning">
          <span className="nav-ico">🏠</span> Home Learning
        </a>
        <a className="nav-item" href="#engagement">
          <span className="nav-ico">⚡</span> Engagement
        </a>
        <a className="nav-item" href="#teachers">
          <span className="nav-ico">👩‍🏫</span> Teachers
        </a>
        <a className="nav-item" href="#students">
          <span className="nav-ico">🎓</span> Students
        </a>
      </div>
      
      <div className="nav-group">
        <div className="nav-title">REPORTS</div>
        <a className="nav-item" href="#weekly-report">
          <span className="nav-ico">📄</span> Weekly Report
        </a>
      </div>
      
      <div className="nav-group">
        <div className="nav-title">TOOLS</div>
        <a className="nav-item" href="#calendar">
          <span className="nav-ico">📅</span> Session Calendar
        </a>
        <a className="nav-item" href="#leaderboard">
          <span className="nav-ico">🏆</span> Leaderboard
        </a>
        <a className="nav-item active" href="#generator">
          <span className="nav-ico">📝</span> Exam Paper Generator{" "}
          <span className="nav-badge">NEW</span>
        </a>
      </div>
      
      <div className="user-row">
        <div className="user-avatar">PK</div>
        <div>
          <div className="user-name">Priya Kapoor</div>
          <div className="user-role">Academic Coordinator</div>
        </div>
      </div>
    </aside>
  );
}
