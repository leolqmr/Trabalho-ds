"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import type { Turma } from "@/lib/types";

type TurmaResumo = Turma & { alunos: number; aulas: number };

export default function ProfessorPage() {
  const { profile, loading, error } = useProfile("professor");
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [nome, setNome] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [limite, setLimite] = useState(75);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const carregarTurmas = useCallback(async () => {
    if (!profile) return;
    setCarregandoTurmas(true);

    const { data, error: queryError } = await supabase
      .from("turmas")
      .select("id,nome,disciplina,professor_id,limite_frequencia,created_at")
      .eq("professor_id", profile.id)
      .order("created_at", { ascending: false });

    if (queryError || !data) {
      setCarregandoTurmas(false);
      return;
    }

    const resumos = await Promise.all(
      data.map(async (turma) => {
        const [{ count: alunos }, { count: aulas }] = await Promise.all([
          supabase.from("matriculas").select("id", { count: "exact", head: true }).eq("turma_id", turma.id),
          supabase.from("aulas").select("id", { count: "exact", head: true }).eq("turma_id", turma.id),
        ]);

        return { ...(turma as Turma), alunos: alunos ?? 0, aulas: aulas ?? 0 };
      })
    );

    setTurmas(resumos);
    setCarregandoTurmas(false);
  }, [profile]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  async function criarTurma(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setErroForm(null);
    setCriando(true);

    const { error: insertError } = await supabase.from("turmas").insert({
      nome: nome.trim(),
      disciplina: disciplina.trim(),
      professor_id: profile.id,
      limite_frequencia: limite,
    });

    if (insertError) {
      setErroForm(insertError.message);
      setCriando(false);
      return;
    }

    setNome("");
    setDisciplina("");
    setLimite(75);
    setCriando(false);
    carregarTurmas();
  }

  if (loading) return <Loading texto="Carregando área do professor..." />;
  if (error || !profile) return <div className="center-message">{error ?? "Perfil não encontrado."}</div>;

  return (
    <AppShell profile={profile}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Painel do professor</p>
          <h1>Minhas turmas</h1>
          <p className="muted">Crie turmas, inicie aulas e acompanhe a frequência dos alunos.</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card create-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Nova turma</p>
              <h2>Cadastrar turma</h2>
            </div>
          </div>

          <form className="stack" onSubmit={criarTurma}>
            <label className="field">
              <span>Nome da turma</span>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Turma 01" required />
            </label>
            <label className="field">
              <span>Disciplina</span>
              <input
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                placeholder="Desenvolvimento de Software"
                required
              />
            </label>
            <label className="field">
              <span>Frequência mínima (%)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                required
              />
            </label>
            {erroForm && <div className="alert alert-danger">{erroForm}</div>}
            <button className="button button-primary" disabled={criando}>
              {criando ? "Criando..." : "Criar turma"}
            </button>
          </form>
        </section>

        <section className="class-list-section">
          {carregandoTurmas ? (
            <Loading texto="Buscando turmas..." />
          ) : turmas.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📚</div>
              <h2>Nenhuma turma cadastrada</h2>
              <p className="muted">Crie a primeira turma usando o formulário ao lado.</p>
            </div>
          ) : (
            <div className="class-grid">
              {turmas.map((turma) => (
                <Link key={turma.id} href={`/professor/turmas/${turma.id}`} className="card class-card">
                  <div className="class-card-top">
                    <span className="class-icon">📘</span>
                    <span className="badge badge-neutral">mín. {turma.limite_frequencia}%</span>
                  </div>
                  <div>
                    <p className="eyebrow">{turma.nome}</p>
                    <h2>{turma.disciplina}</h2>
                  </div>
                  <div className="mini-stats">
                    <span><strong>{turma.alunos}</strong> alunos</span>
                    <span><strong>{turma.aulas}</strong> aulas</span>
                  </div>
                  <span className="link-arrow">Abrir turma →</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
