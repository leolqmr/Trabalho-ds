import { useMemo, useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ChamadaRapida from './components/ChamadaRapida';
import RelatorioFaltas from './components/RelatorioFaltas';
import { turmas } from './data/mockData';

const pageMeta = {
  dashboard: { title: 'Dashboard', subtitle: 'Resumo acadêmico e acompanhamento das suas turmas.' },
  chamada: { title: 'Chamada rápida', subtitle: 'Inicie e acompanhe o registro de presença em tempo real.' },
  relatorios: { title: 'Relatório de faltas', subtitle: 'Analise frequência e identifique alunos em risco por disciplina.' },
};

export default function App() {
  const [pagina, setPagina] = useState('dashboard');
  const [turmaId, setTurmaId] = useState(turmas[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = useMemo(() => pageMeta[pagina], [pagina]);

  return (
    <div className="app-shell">
      <Sidebar pagina={pagina} onNavigate={setPagina} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="main-area">
        <Header title={meta.title} subtitle={meta.subtitle} onMenu={() => setMobileOpen(true)} />
        <div className="page-content">
          {pagina === 'dashboard' && <Dashboard turmas={turmas} onNavigate={setPagina} onSelectTurma={setTurmaId} />}
          {pagina === 'chamada' && <ChamadaRapida turmas={turmas} turmaId={turmaId} setTurmaId={setTurmaId} />}
          {pagina === 'relatorios' && <RelatorioFaltas turmas={turmas} turmaId={turmaId} setTurmaId={setTurmaId} />}
        </div>
      </main>
    </div>
  );
}
