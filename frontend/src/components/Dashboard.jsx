import MetricCard from './MetricCard';
import { Icon } from './Icons';
import { relatorios } from '../data/mockData';

export default function Dashboard({ turmas, onNavigate, onSelectTurma }) {
  const totalAlunos = turmas.reduce((acc, turma) => acc + turma.alunos, 0);
  const emRisco = Object.values(relatorios).flat().filter((a) => a.frequencia < 75).length;
  const media = turmas.reduce((acc, turma) => acc + turma.frequenciaMedia, 0) / turmas.length;

  return (
    <div className="page-stack">
      <section className="hero-banner">
        <div>
          <span className="eyebrow">VISÃO GERAL</span>
          <h2>Bom dia, professor 👋</h2>
          <p>Acompanhe as turmas, inicie uma chamada e identifique alunos que precisam de atenção.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate('chamada')}>
          <Icon name="scan" /> Iniciar chamada rápida
        </button>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Turmas ativas" value={turmas.length} detail="Neste semestre" icon="book" tone="blue" />
        <MetricCard label="Alunos matriculados" value={totalAlunos} detail="Em todas as turmas" icon="users" tone="purple" />
        <MetricCard label="Frequência média" value={`${media.toFixed(1)}%`} detail="Média das disciplinas" icon="dashboard" tone="green" />
        <MetricCard label="Alunos em risco" value={emRisco} detail="Abaixo de 75%" icon="alert" tone="red" />
      </section>

      <section className="content-card">
        <div className="section-header">
          <div><span className="eyebrow">SUAS DISCIPLINAS</span><h3>Turmas do semestre</h3></div>
          <button className="text-button" onClick={() => onNavigate('relatorios')}>Ver relatórios <Icon name="chevron" size={16}/></button>
        </div>
        <div className="class-grid">
          {turmas.map((turma) => {
            const risco = (relatorios[turma.id] || []).filter((a) => a.frequencia < turma.limiteFrequencia).length;
            return (
              <article key={turma.id} className="class-card">
                <div className="class-card-top">
                  <span className="class-code">{turma.codigo}</span>
                  <span className={`risk-pill ${risco ? 'risk-pill--warning' : ''}`}>{risco ? `${risco} em risco` : 'Tudo certo'}</span>
                </div>
                <h4>{turma.disciplina}</h4>
                <div className="class-stats">
                  <span><Icon name="users" size={16}/>{turma.alunos} alunos</span>
                  <span><Icon name="book" size={16}/>{turma.aulas} aulas</span>
                </div>
                <div className="progress-row">
                  <div><span>Frequência média</span><strong>{turma.frequenciaMedia}%</strong></div>
                  <div className="progress-track"><span style={{ width: `${turma.frequenciaMedia}%` }}/></div>
                </div>
                <div className="class-actions">
                  <button onClick={() => { onSelectTurma(turma.id); onNavigate('chamada'); }}>Fazer chamada</button>
                  <button onClick={() => { onSelectTurma(turma.id); onNavigate('relatorios'); }}>Ver faltas</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
