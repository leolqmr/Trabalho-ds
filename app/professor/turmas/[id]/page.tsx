"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { useProfile } from "@/hooks/useProfile";
import { calcularFrequencia, statusFrequencia } from "@/lib/frequencia";
import { supabase } from "@/lib/supabase";
import type { LinhaRelatorio, Matricula, Perfil, Presenca, Turma } from "@/lib/types";

type AlunoMatriculado = Perfil & {
  statusPresenca: "PRESENTE" | "AUSENTE";
};

export default function TurmaPage() {
  const params = useParams<{ id: string }>();
  const turmaId = params.id;
  const { profile, loading, error } = useProfile("professor");

  const [turma, setTurma] = useState<Turma | null>(null);
  const [linhas, setLinhas] = useState<LinhaRelatorio[]>([]);
  const [alunosLista, setAlunosLista] = useState<AlunoMatriculado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [emailAluno, setEmailAluno] = useState("");
  const [mensagemAluno, setMensagemAluno] = useState<string | null>(null);
  const [erroAluno, setErroAluno] = useState<string | null>(null);
  const [salvandoChamada, setSalvandoChamada] = useState(false);
  const [mensagemChamada, setMensagemChamada] = useState<string | null>(null);

  const carregarTudo = useCallback(async () => {
    if (!profile || !turmaId) return;
    setCarregando(true);

    // 1. Busca os dados da turma
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

    // 2. Busca matriculas da turma
    const { data: matriculasData } = await supabase
      .from("matriculas")
      .select("id,turma_id,aluno_id,created_at")
      .eq("turma_id", turmaId);

    const matriculas = (matriculasData ?? []) as Matricula[];
    const alunoIds = matriculas.map((item) => item.aluno_id);

    // 3. Busca alunos e presenças
    const [{ data: alunosData }, { data: presencasData }] = await Promise.all([
      alunoIds.length
        ? supabase.from("profiles").select("id,nome,email,tipo").in("id", alunoIds)
        : Promise.resolve({ data: [] as Perfil[] }),
      supabase.from("presencas").select("id,aula_id,aluno_id,registrado_em").eq("turma_id", turmaId),
    ]);

    const alunos = (alunosData ?? []) as Perfil[];
    const listaPresencas = (presencasData ?? []) as Presenca[];

    // 4. Monta a lista com padrão PRESENTE
    setAlunosLista(
      alunos.map((a) => ({
        ...a,
        statusPresenca: "PRESENTE",
      }))
    );

    // 5. Relatório de frequência
    const relatorio: LinhaRelatorio[] = alunos
      .map((aluno) => {
        const totalPresencas = listaPresencas.filter((item) => item.aluno_id === aluno.id).length;
        const totalAulas = new Set(listaPresencas.map((p) => p.aula_id)).size || 1;
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

  function togglePresenca(alunoId: string) {
    setAlunosLista((prev) =>
      prev.map((a) =>
        a.id === alunoId
          ? { ...a, statusPresenca: a.statusPresenca === "PRESENTE" ? "AUSENTE" : "PRESENTE" }
          : a
      )
    );
  }

  // Função que cria a aula fornecendo 'expira_em' e salva as presenças
  async function salvarChamada() {
    if (!turmaId || alunosLista.length === 0) return;
    setSalvandoChamada(true);
    setMensagemChamada(null);

    // Gera data de expiração fictícia (24 horas à frente) para satisfazer a restrição do banco
    const expiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Passo A: Cria a aula na tabela 'aulas' com o campo expira_em preenchido
    const { data: aulaCriada, error: errAula } = await supabase
      .from("aulas")
      .insert({
        turma_id: turmaId,
        ativa: false,
        expira_em: expiraEm,
      })
      .select("id")
      .single();

    if (errAula || !aulaCriada) {
      setMensagemChamada("❌ Erro ao criar a aula no banco: " + errAula?.message);
      setSalvandoChamada(false);
      return;
    }

    // Passo B: Monta os registros utilizando o aula_id gerado
    const novosRegistros = alunosLista
      .filter((a) => a.statusPresenca === "PRESENTE")
      .map((aluno) => ({
        aula_id: aulaCriada.id,
        aluno_id: aluno.id,
        turma_id: turmaId,
      }));

    if (novosRegistros.length === 0) {
      setMensagemChamada("✅ Chamada registrada (todos constam como ausentes).");
      setSalvandoChamada(false);
      carregarTudo();
      return;
    }

    // Passo C: Salva na tabela 'presencas'
    const { error: insertError } = await supabase.from("presencas").insert(novosRegistros);

    if (insertError) {
      setMensagemChamada("❌ Erro ao salvar chamada: " + insertError.message);
    } else {
      setMensagemChamada("✅ Chamada registrada e salva com sucesso!");
      carregarTudo();
    }
    setSalvandoChamada(false);
  }

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
          <Link className="button button-primary" href="/professor">
            Voltar
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="breadcrumb">
        <Link href="/professor">Minhas turmas</Link>
        <span>/</span>
        <span>{turma.nome}</span>
      </div>

      <section className="page-heading split-heading">
        <div>
          <p className="eyebrow">{turma.nome}</p>
          <h1>{turma.disciplina}</h1>
          <p className="muted">
            {linhas.length} alunos matriculados · frequência mínima {turma.limite_frequencia}%
          </p>
        </div>
        <div className="button-row">
        </div>
      </section>

      {/* Painel de Chamada Manual */}
      <section className="card live-class" style={{ gridTemplateColumns: "1fr" }}>
        <div className="live-info">
          <h2>Chamada Manual da Aula</h2>
          <p className="muted">
            Clique no status ao lado de cada aluno para alternar entre PRESENTE e AUSENTE e depois confirme a chamada.
          </p>

          <div className="stack" style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
            {alunosLista.length === 0 ? (
              <p className="muted">Nenhum aluno matriculado nesta turma ainda.</p>
            ) : (
              alunosLista.map((aluno) => {
                const isPresente = aluno.statusPresenca === "PRESENTE";
                return (
                  <div
                    key={aluno.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "#f8fafc",
                      border: "1px solid #e4e8ef",
                      borderRadius: "12px",
                    }}
                  >
                    <div>
                      <strong style={{ display: "block", color: "#172033" }}>{aluno.nome}</strong>
                      <span className="muted small">{aluno.email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePresenca(aluno.id)}
                      className={`badge ${isPresente ? "badge-success" : "badge-danger"}`}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {aluno.statusPresenca}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {mensagemChamada && (
            <div
              className={`alert ${
                mensagemChamada.startsWith("✅") ? "alert-success" : "alert-danger"
              }`}
              style={{ marginBottom: "1rem" }}
            >
              {mensagemChamada}
            </div>
          )}

          <button
            className="button button-primary button-block"
            onClick={salvarChamada}
            disabled={salvandoChamada || alunosLista.length === 0}
          >
            {salvandoChamada ? "Salvando chamada..." : "Salvar Chamada da Aula"}
          </button>
        </div>
      </section>

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
                        <td>
                          <strong>{linha.frequencia}%</strong>
                        </td>
                        <td>
                          <StatusBadge texto={status.texto} classe={status.classe} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}