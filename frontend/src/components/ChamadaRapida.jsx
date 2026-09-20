import { useMemo, useState } from 'react';
import { Icon } from './Icons';
import FakeQr from './FakeQr';
import { presencasIniciais } from '../data/mockData';

export default function ChamadaRapida({ turmas, turmaId, setTurmaId }) {
  const [status, setStatus] = useState('nao_iniciada');
  const [presencas, setPresencas] = useState(presencasIniciais);
  const [codigo, setCodigo] = useState('DS-A7K92');
  const [mensagem, setMensagem] = useState('');
  const turma = turmas.find((item) => item.id === turmaId) || turmas[0];

  const taxa = useMemo(() => Math.round((presencas.length / turma.alunos) * 100), [presencas, turma]);

  function iniciar() {
    const prefixo = turma.codigo.slice(0, 2).toUpperCase();
    const aleatorio = Math.random().toString(36).slice(2, 7).toUpperCase();
    setCodigo(`${prefixo}-${aleatorio}`);
    setPresencas(presencasIniciais.slice(0, 3));
    setStatus('ativa');
    setMensagem('Chamada iniciada. O QR Code já pode ser exibido aos alunos.');
  }

  function simularPresenca() {
    const extras = [
      { nome: 'Carla Souza', matricula: '20261003' },
      { nome: 'Daniel Lima', matricula: '20261004' },
      { nome: 'Felipe Santos', matricula: '20261006' },
    ];
    const proximo = extras.find((aluno) => !presencas.some((p) => p.matricula === aluno.matricula));
    if (!proximo) return;
    const horario = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setPresencas((atual) => [...atual, { ...proximo, id: Date.now(), horario }]);
  }

  function encerrar() {
    setStatus('encerrada');
    setMensagem(`Chamada encerrada com ${presencas.length} presenças registradas.`);
  }

  return (
    <div className="page-stack">
      {mensagem && <div className={`toast ${status === 'encerrada' ? 'toast--neutral' : ''}`}><Icon name="check" size={18}/>{mensagem}</div>}

      <section className="content-card attendance-setup">
        <div className="section-header compact">
          <div><span className="eyebrow">CONFIGURAÇÃO</span><h3>Nova chamada</h3><p>Selecione a disciplina e inicie a sessão de presença.</p></div>
          <span className={`status-badge status-badge--${status}`}>{status === 'ativa' ? 'Em andamento' : status === 'encerrada' ? 'Encerrada' : 'Aguardando início'}</span>
        </div>
        <div className="form-grid">
          <label>Disciplina / turma
            <select value={turmaId} disabled={status === 'ativa'} onChange={(e) => { setTurmaId(e.target.value); setStatus('nao_iniciada'); }}>
              {turmas.map((item) => <option key={item.id} value={item.id}>{item.disciplina} — {item.codigo}</option>)}
            </select>
          </label>
          <label>Data da aula
            <input type="date" defaultValue={new Date().toISOString().slice(0, 10)} disabled={status === 'ativa'} />
          </label>
          <label>Duração do código
            <select disabled={status === 'ativa'} defaultValue="10"><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option></select>
          </label>
        </div>
        {status !== 'ativa' && <button className="primary-button primary-button--wide" onClick={iniciar}><Icon name="scan"/> {status === 'encerrada' ? 'Iniciar nova chamada' : 'Iniciar chamada'}</button>}
      </section>

      {status === 'ativa' && (
        <section className="attendance-layout">
          <article className="content-card qr-panel">
            <span className="live-pill"><i/> CHAMADA AO VIVO</span>
            <h3>{turma.disciplina}</h3>
            <p>{turma.codigo} • Aula #{turma.aulas + 1}</p>
            <FakeQr />
            <span className="qr-caption">Escaneie para registrar presença</span>
            <div className="access-code"><span>Código alternativo</span><strong>{codigo}</strong></div>
            <div className="timer"><Icon name="clock" size={18}/> Expira em <strong>09:42</strong></div>
          </article>

          <article className="content-card presence-panel">
            <div className="section-header compact">
              <div><span className="eyebrow">PRESENÇAS</span><h3>{presencas.length} de {turma.alunos} alunos</h3></div>
              <strong className="presence-percent">{taxa}%</strong>
            </div>
            <div className="progress-track progress-track--large"><span style={{ width: `${taxa}%` }}/></div>
            <div className="presence-list">
              {presencas.map((aluno) => (
                <div className="presence-item" key={aluno.id}>
                  <span className="presence-check"><Icon name="check" size={15}/></span>
                  <div><strong>{aluno.nome}</strong><span>{aluno.matricula}</span></div>
                  <time>{aluno.horario}</time>
                </div>
              ))}
            </div>
            <button className="secondary-button" onClick={simularPresenca}>+ Simular nova presença</button>
            <button className="danger-button" onClick={encerrar}>Encerrar chamada</button>
          </article>
        </section>
      )}

      {status === 'encerrada' && (
        <section className="content-card empty-state">
          <div className="success-circle"><Icon name="check" size={32}/></div>
          <h3>Chamada finalizada</h3>
          <p>{presencas.length} presenças foram registradas em {turma.disciplina}.</p>
          <button className="secondary-button" onClick={() => setStatus('nao_iniciada')}>Preparar outra chamada</button>
        </section>
      )}
    </div>
  );
}
