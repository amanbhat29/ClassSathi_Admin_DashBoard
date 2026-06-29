import './PageHeader.css';

export default function PageHeader({ onStartOver }) {
  return (
    <div className="page-head">
      <div>
        <div className="page-title">Exam Paper Generator</div>
        <div className="page-sub">Create a ready-to-print question paper in 3 simple steps</div>
      </div>
      <div className="head-actions">
        <button className="btn btn-ghost" onClick={onStartOver}>
          ↺ Start over
        </button>
      </div>
    </div>
  );
}
