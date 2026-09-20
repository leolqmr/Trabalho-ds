import { useMemo, useState } from 'react';
import { Icon } from './Icons';
import { relatorios } from '../data/mockData';

export default function RelatorioFaltas({ turmas, turmaId, setTurmaId }) {
  const [busca, setBusca] = useState('');
  const [somenteRisco, setSomenteRisco] = useState(false);
  const [ordem, setOrdem] = useState('faltas');
  const turma = turmas.find((t) => t.id === turmaId) || turmas[0];
  const dados = relatorios[turma.id] || [];

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return dados
      .filter((aluno) => !termo || aluno.nome.toLowerCase().includes(termo) || aluno.matricula.includes(termo))
      .filter((aluno) => !somenteRisco || aluno.frequencia < turma.limiteFrequencia)
      .sort((a, b) => {
        if (ordem === 'nome') return a.nome.localeCompare(b.nome);
        if (ordem === 'frequencia') return a.frequencia - b.frequencia;
        return b.faltas - a.faltas;
      });
  }, [dados, busca, somenteRisco, ordem, turma.limiteFrequencia]);

  const media = dados.length ? dados.reduce((acc, a) => acc + a.frequencia, 0) / dados.length : 0;
  const risco = dados.filter((a) => a.frequencia < turma.limiteFrequencia).length;
  const faltas = dados.reduce((acc, a) => acc + a.faltas, 0);

  function exportarCsv() {
    const linhas = [
      ['Aluno', 'Matrícula', 'Presenças', 'Faltas', 'Frequência', 'Situação'],
      ...filtrados.map((a) => [a.nome, a.matricula, a.presencas, a.faltas, `${a.frequencia}%`, a.frequencia < turma.limiteFrequencia ? 'Em risco' : 'Regular']),
    ];
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-faltas-${turma.codigo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <section className="content-card filters-card">
        <div className="section-header compact">
          <div><span className="eyebrow">FILTROS DO RELATÓRIO</span><h3>Faltas por disciplina</h3></div>
          <button className="secondary-button compact-button" onClick={exportarCsv}><Icon name="download" size={17}/> Exportar CSV</button>
        </div>
        <div className="filters-grid">
          <label>Disciplina
            <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>{turmas.map((t) => <option key={t.id} value={t.id}>{t.disciplina}</option>)}</select>
          </label>
          <label>Período
            <select defaultValue="2026.2"><option>2026.2</option><option>2026.1</option></select>
          </label>
          <label>Ordenar por
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="faltas">Mais faltas</option><option value="frequencia">Menor frequência</option><option value="nome">Nome</option></select>
          </label>
        </div>
      </section>

      <section className="metrics-grid metrics-grid--report">
        <Metric label="Alunos analisados" value={dados.length} note={turma.codigo} />
        <Metric label="Frequência média" value={`${media.toFixed(1)}%`} note={`Limite: ${turma.limiteFrequencia}%`} />
        <Metric label="Total de faltas" value={faltas} note={`${turma.aulas} aulas registradas`} />
        <Metric label="Alunos em risco" value={risco} note="Abaixo do limite" warning />
      </section>

      <section className="content-card table-card">
        <div className="table-toolbar">
          <div className="search-box"><Icon name="search" size={18}/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou matrícula" /></div>
          <label className="toggle"><input type="checkbox" checked={somenteRisco} onChange={(e) => setSomenteRisco(e.target.checked)} /><span/>Somente alunos em risco</label>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Matrícula</th><th>Presenças</th><th>Faltas</th><th>Frequência</th><th>Situação</th></tr></thead>
            <tbody>
              {filtrados.map((aluno) => {
                const emRisco = aluno.frequencia < turma.limiteFrequencia;
                return <tr key={aluno.id}>
                  <td><div className="student-cell"><span>{aluno.nome.split(' ').map((p) => p[0]).slice(0,2).join('')}</span><strong>{aluno.nome}</strong></div></td>
                  <td className="muted-cell">{aluno.matricula}</td>
                  <td>{aluno.presencas}</td><td><strong>{aluno.faltas}</strong></td>
                  <td><div className="frequency-cell"><div className="progress-track"><span className={emRisco ? 'danger-progress' : ''} style={{ width: `${aluno.frequencia}%` }}/></div><strong>{aluno.frequencia}%</strong></div></td>
                  <td><span className={`situation ${emRisco ? 'situation--risk' : 'situation--ok'}`}>{emRisco ? 'Em risco' : 'Regular'}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
          {!filtrados.length && <div className="no-results">Nenhum aluno encontrado para os filtros selecionados.</div>}
        </div>
        <div className="table-footer">Exibindo {filtrados.length} de {dados.length} alunos</div>
      </section>
    </div>
  );
}

function Metric({ label, value, note, warning }) {
  return <article className={`report-metric ${warning ? 'report-metric--warning' : ''}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}
