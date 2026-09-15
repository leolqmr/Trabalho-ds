"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { useProfile } from "@/hooks/useProfile";
import { calcularFrequencia, statusFrequencia } from "@/lib/frequencia";
import { formatarDataHora } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Aula, LinhaRelatorio, Matricula, Perfil, Presenca, Turma } from "@/lib/types";

export default function TurmaPage() {
  const params = useParams<{ id: string }>();
  const turmaId = params.id;
  const { profile, loading, error } = useProfile("professor");
  const [turma, setTurma] = useState<Turma | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [emailAluno, setEmailAluno] = useState("");
  const [mensagemAluno, setMensagemAluno] = useState<string | null>(null);
  const [erroAluno, setErroAluno] = useState<string | null>(null);
  const [criandoAula, setCriandoAula] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const aulaAtiva = useMemo(
    () => aulas.find((aula) => aula.ativa && new Date(aula.expira_em).getTime() > Date.now()) ?? null,
    [aulas]
  );

  const carregarTudo = useCallback(async () => {
    if (!profile || !turmaId) return;
    setCarregando(true);

    const { data: turmaData, error: turmaError } = await supabase
      .from("turmas")
      .select("id,nome,disciplina,professor_id,limite_frequencia,created_at")
      .eq("id", turmaId)
      .eq("professor_id", profile.id)
      .single();

    if (turmaError || !turmaData) {
      setTurma(null);
      setCarregando(false);
      return;
    }

    const turmaAtual = turmaData as Turma;
    setTurma(turmaAtual);

    const [{ data: matriculasData }, { data: aulasData }] = await Promise.all([
      supabase.from("matriculas").select("id,turma_id,aluno_id,created_at").eq("turma_id", turmaId),
      supabase
        .from("aulas")
        .select("id,turma_id,data_hora,token,expira_em,ativa,created_at")
        .eq("turma_id", turmaId)
        .order("data_hora", { ascending: false }),
    ]);

    const matriculas = (matriculasData ?? []) as Matricula[];
    const listaAulas = (aulasData ?? []) as Aula[];
    setAulas(listaAulas);

    const alunoIds = matriculas.map((item) => item.aluno_id);
    const aulaIds = listaAulas.map((item) => item.id);

    const [{ data: alunosData }, { data: presencasData }] = await Promise.all([
      alunoIds.length
        ? supabase.from("profiles").select("id,nome,email,tipo").in("id", alunoIds)
        : Promise.resolve({ data: [] as Perfil[] }),
      aulaIds.length
        ? supabase.from("presencas").select("id,aula_id,aluno_id,registrado_em").in("aula_id", aulaIds)
        : Promise.resolve({ data: [] as Presenca[] }),
    ]);

    const alunos = (alunosData ?? []) as Perfil[];
    const listaPresencas = (presencasData ?? []) as Presenca[];
    setPresencas(listaPresencas);

    const relatorio: LinhaRelatorio[] = alunos
      .map((aluno) => {
        const totalPresencas = listaPresencas.filter((item) => item.aluno_id === aluno.id).length;
        const totalAulas = listaAulas.length;
        return {
          aluno,
          presencas: totalPresencas,
          faltas: Math.max(totalAulas - totalPresencas, 0),
          totalAulas,
          frequencia: calcularFrequencia(totalPresencas, totalAulas),
        };
      })
      .sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome));

    setLinhas(relatorio);
    setCarregando(false);
  }, [profile, turmaId]);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  useEffect(() => {
    async function gerarQr() {
      if (!aulaAtiva) {
        setQrDataUrl(null);
        return;
      }

      const url = `${window.location.origin}/presenca/${aulaAtiva.token}`;
      const image = await QRCode.toDataURL(url, { width: 340, margin: 2 });
      setQrDataUrl(image);
    }

    gerarQr();
  }, [aulaAtiva]);

  async function adicionarAluno(event: FormEvent) {
    event.preventDefault();
    setMensagemAluno(null);
    setErroAluno(null);

    const { data: aluno, error: buscaError } = await supabase
      .from("profiles")
      .select("id,nome,email,tipo")
      .ilike("email", emailAluno.trim())
      .eq("tipo", "aluno")
      .maybeSingle();

    if (buscaError || !aluno) {
      setErroAluno("Aluno não encontrado. Ele precisa criar a conta antes de ser matriculado.");
      return;
    }

    const { error: insertError } = await supabase.from("matriculas").insert({
      turma_id: turmaId,
      aluno_id: aluno.id,
    });

    if (insertError) {
      if (insertError.code === "23505") setErroAluno("Este aluno já está matriculado na turma.");
      else setErroAluno(insertError.message);
      return;
    }

    setMensagemAluno(`${aluno.nome} foi adicionado à turma.`);
    setEmailAluno("");
    carregarTudo();
  }

  async function iniciarAula() {
    if (!profile) return;
    setCriandoAula(true);

    await supabase.from("aulas").update({ ativa: false }).eq("turma_id", turmaId).eq("ativa", true);

    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from("aulas").insert({
      turma_id: turmaId,
      expira_em: expira,
      ativa: true,
    });

    setCriandoAula(false);
    if (!insertError) carregarTudo();
  }

  async function encerrarAula() {
    if (!aulaAtiva) return;
    await supabase.from("aulas").update({ ativa: false }).eq("id", aulaAtiva.id);
    carregarTudo();
  }

  function exportarCsv() {
    if (!turma) return;
    const cabecalho = ["Aluno", "Email", "Presenças", "Faltas", "Total de aulas", "Frequência (%)"];
    const linhasCsv = linhas.map((linha) => [
      linha.aluno.nome,
      linha.aluno.email,
      linha.presencas,
      linha.faltas,
      linha.totalAulas,
      linha.frequencia,
    ]);

    const csv = [cabecalho, ...linhasCsv]
      .map((linha) => linha.map((campo) => `"${String(campo).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `frequencia-${turma.disciplina.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Loading texto="Abrindo turma..." />;
  if (error || !profile) return <div className="center-message">{error ?? "Perfil não encontrado."}</div>;
  if (carregando) return <Loading texto="Carregando dados da turma..." />;

  if (!turma) {
    return (
      <AppShell profile={profile}>
        <div className="card empty-state">
          <h1>Turma não encontrada</h1>
          <Link className="button button-primary" href="/professor">Voltar</Link>
        </div>
      </AppShell>
    );
  }

  const presentesNaAulaAtiva = aulaAtiva
    ? presencas.filter((item) => item.aula_id === aulaAtiva.id).length
    : 0;

  return (
    <AppShell profile={profile}>
      <div className="breadcrumb"><Link href="/professor">Minhas turmas</Link><span>/</span><span>{turma.nome}</span></div>

      <section className="page-heading split-heading">
        <div>
          <p className="eyebrow">{turma.nome}</p>
          <h1>{turma.disciplina}</h1>
          <p className="muted">{linhas.length} alunos · {aulas.length} aulas · frequência mínima {turma.limite_frequencia}%</p>
        </div>
        <div className="button-row">
          <button className="button button-secondary" onClick={exportarCsv}>Exportar CSV</button>
          <button className="button button-primary" onClick={iniciarAula} disabled={criandoAula}>
            {criandoAula ? "Iniciando..." : aulaAtiva ? "Gerar novo QR" : "Iniciar aula"}
          </button>
        </div>
      </section>

      {aulaAtiva && (
        <section className="card live-class">
          <div className="live-info">
            <div className="live-pill"><span className="live-dot" /> Aula em andamento</div>
            <h2>QR Code de presença</h2>
            <p className="muted">
              O aluno deve estar logado. O código expira automaticamente em <strong>{formatarDataHora(aulaAtiva.expira_em)}</strong>.
            </p>
            <div className="live-stats">
              <div><strong>{presentesNaAulaAtiva}</strong><span>presentes</span></div>
              <div><strong>{linhas.length}</strong><span>matriculados</span></div>
            </div>
            <button className="button button-danger" onClick={encerrarAula}>Encerrar aula</button>
          </div>
          <div className="qr-box">
            {qrDataUrl ? <img src={qrDataUrl} alt="QR Code para registro de presença" /> : <Loading texto="Gerando QR..." />}
            <span>Escaneie com a câmera do celular</span>
          </div>
        </section>
      )}

      <div className="two-column-grid">
        <section className="card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Matrícula</p>
              <h2>Adicionar aluno</h2>
            </div>
          </div>
          <form className="stack" onSubmit={adicionarAluno}>
            <label className="field">
              <span>E-mail do aluno</span>
              <input
                type="email"
                value={emailAluno}
                onChange={(e) => setEmailAluno(e.target.value)}
                placeholder="aluno@faculdade.edu.br"
                required
              />
            </label>
            <p className="small muted">O aluno precisa criar uma conta antes de ser adicionado.</p>
            {erroAluno && <div className="alert alert-danger">{erroAluno}</div>}
            {mensagemAluno && <div className="alert alert-success">{mensagemAluno}</div>}
            <button className="button button-secondary">Adicionar à turma</button>
          </form>
        </section>

        <section className="card history-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Histórico</p>
              <h2>Últimas aulas</h2>
            </div>
          </div>
          {aulas.length === 0 ? (
            <p className="muted">Nenhuma aula realizada ainda.</p>
          ) : (
            <div className="history-list">
              {aulas.slice(0, 5).map((aula) => {
                const total = presencas.filter((item) => item.aula_id === aula.id).length;
                return (
                  <div className="history-item" key={aula.id}>
                    <div>
                      <strong>{formatarDataHora(aula.data_hora)}</strong>
                      <span>{total} presença(s)</span>
                    </div>
                    <StatusBadge
                      texto={aula.ativa && new Date(aula.expira_em).getTime() > Date.now() ? "Ativa" : "Encerrada"}
                      classe={aula.ativa && new Date(aula.expira_em).getTime() > Date.now() ? "success" : "neutral"}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="card report-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Relatório</p>
            <h2>Frequência por aluno</h2>
          </div>
        </div>

        {linhas.length === 0 ? (
          <div className="empty-state compact-empty">
            <p className="muted">Adicione alunos para visualizar o relatório.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Presenças</th>
                  <th>Faltas</th>
                  <th>Frequência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => {
                  const status = statusFrequencia(linha.frequencia, turma.limite_frequencia);
                  return (
                    <tr key={linha.aluno.id}>
                      <td>
                        <div className="student-cell">
                          <strong>{linha.aluno.nome}</strong>
                          <span>{linha.aluno.email}</span>
                        </div>
                      </td>
                      <td>{linha.presencas}</td>
                      <td>{linha.faltas}</td>
                      <td><strong>{linha.frequencia}%</strong></td>
                      <td><StatusBadge texto={status.texto} classe={status.classe} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
