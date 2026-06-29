import './MainLayout.css';

export default function MainLayout({ sidebar, children }) {
  return (
    <div className="main-layout-container">
      {sidebar}
      <main className="main">
        {children}
      </main>
    </div>
  );
}
