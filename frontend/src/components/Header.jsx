export default function Header({ title, subtitle, onMenu }) {
  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Abrir menu">☰</button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-status"><span className="status-dot"/>Sistema online</div>
    </header>
  );
}
