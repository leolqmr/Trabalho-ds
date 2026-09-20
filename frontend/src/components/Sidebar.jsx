import { Icon } from './Icons';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'chamada', label: 'Chamada rápida', icon: 'scan' },
  { id: 'relatorios', label: 'Relatório de faltas', icon: 'report' },
];

export default function Sidebar({ pagina, onNavigate, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">F+</div>
          <div>
            <strong>Frequência+</strong>
            <span>Portal do professor</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          <span className="nav-kicker">GESTÃO ACADÊMICA</span>
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${pagina === item.id ? 'nav-item--active' : ''}`}
              onClick={() => { onNavigate(item.id); onClose?.(); }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">SF</div>
          <div className="profile-copy">
            <strong>Professor</strong>
            <span>professor@instituicao.edu</span>
          </div>
          <button className="icon-button" title="Sair"><Icon name="logout" size={18}/></button>
        </div>
      </aside>
    </>
  );
}
