"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import Loading from "@/components/Loading";
import StatusBadge from "@/components/StatusBadge";
import { useProfile } from "@/hooks/useProfile";
import { calcularFrequencia, statusFrequencia } from "@/lib/frequencia";
import { supabase } from "@/lib/supabase";
import type { Aula, Matricula, Presenca, Turma } from "@/lib/types";

type Resumo = Turma & { totalAulas: number; presencas: number; frequencia: number };

export default function AlunoPage() {
  const { profile, loading, error } = useProfile("aluno");
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!profile) return;
    setCarregando(true);

    const { data: matriculasData } = await supabase
      .from("matriculas")
      .select("id,turma_id,aluno_id")
      .eq("aluno_id", profile.id);

    const matriculas = (matriculasData ?? []) as Matricula[];
    const turmaIds = matriculas.map((item) => item.turma_id);

    if (turmaIds.length === 0) {
      setResumos([]);
      setCarregando(false);
      return;
    }

    const [{ data: turmasData }, { data: aulasData }, { data: presencasData }] = await Promise.all([
      supabase
        .from("turmas")
        .select("id,nome,disciplina,professor_id,limite_frequencia,created_at")
        .in("id", turmaIds),
      supabase.from("aulas").select("id,turma_id,data_hora,token,expira_em,ativa").in("turma_id", turmaIds),
      supabase.from("presencas").select("id,aula_id,aluno_id,registrado_em").eq("aluno_id", profile.id),
    ]);

    const turmas = (turmasData ?? []) as Turma[];
    const aulas = (aulasData ?? []) as Aula[];
    const presencas = (presencasData ?? []) as Presenca[];
    const presencaIds = new Set(presencas.map((item) => item.aula_id));

    const data = turmas.map((turma) => {
      const aulasTurma = aulas.filter((aula) => aula.turma_id === turma.id);
      const presentes = aulasTurma.filter((aula) => presencaIds.has(aula.id)).length;
      return {
        ...turma,
        totalAulas: aulasTurma.length,
        presencas: presentes,
        frequencia: calcularFrequencia(presentes, aulasTurma.length),
      };
    });

    setResumos(data);
    setCarregando(false);
  }, [profile]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const media = useMemo(() => {
    if (!resumos.length) return 100;
    return Math.round((resumos.reduce((soma, item) => soma + item.frequencia, 0) / resumos.length) * 10) / 10;
  }, [resumos]);

  if (loading) return <Loading texto="Carregando área do aluno..." />;
  if (error || !profile) return <div className="center-message">{error ?? "Perfil não encontrado."}</div>;

  return (
    <AppShell profile={profile}>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Painel do aluno</p>
          <h1>Minha frequência</h1>
          <p className="muted">Acompanhe sua presença e identifique disciplinas que precisam de atenção.</p>
        </div>
      </section>

      <section className="stats-row">
        <div className="card stat-card">
          <span className="stat-label">Disciplinas</span>
          <strong>{resumos.length}</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Frequência média</span>
          <strong>{media}%</strong>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Em risco</span>
          <strong>{resumos.filter((item) => item.frequencia < item.limite_frequencia).length}</strong>
        </div>
      </section>

      {carregando ? (
        <Loading texto="Calculando frequência..." />
      ) : resumos.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🎓</div>
          <h2>Você ainda não está matriculado em nenhuma turma</h2>
          <p className="muted">Peça ao professor para adicionar o e-mail {profile.email} à turma.</p>
        </div>
      ) : (
        <section className="class-grid student-grid">
          {resumos.map((item) => {
            const status = statusFrequencia(item.frequencia, item.limite_frequencia);
            const faltas = Math.max(item.totalAulas - item.presencas, 0);

            return (
              <article className="card class-card" key={item.id}>
                <div className="class-card-top">
                  <span className="class-icon">📗</span>
                  <StatusBadge texto={status.texto} classe={status.classe} />
                </div>
                <div>
                  <p className="eyebrow">{item.nome}</p>
                  <h2>{item.disciplina}</h2>
                </div>
                <div className="frequency-number">{item.frequencia}%</div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${Math.min(item.frequencia, 100)}%` }} />
                </div>
                <div className="mini-stats">
                  <span><strong>{item.presencas}</strong> presenças</span>
                  <span><strong>{faltas}</strong> faltas</span>
                  <span><strong>{item.totalAulas}</strong> aulas</span>
                </div>
                <p className="small muted">Limite da disciplina: {item.limite_frequencia}%</p>
              </article>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}
