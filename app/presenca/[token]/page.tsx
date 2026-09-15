"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { formatarDataHora } from "@/lib/format";
import { supabase } from "@/lib/supabase";

type ResultadoPresenca = {
  status: "registrada" | "ja_registrada" | "token_invalido" | "aula_encerrada" | "token_expirado" | "nao_matriculado" | "perfil_invalido" | "nao_autenticado";
  disciplina?: string;
  turma?: string;
  data_hora?: string;
  registrado_em?: string;
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PresencaPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoPresenca | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function registrar() {
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        const destino = encodeURIComponent(`/presenca/${token}`);
        router.replace(`/login?redirect=${destino}`);
        return;
      }

      if (!uuidRegex.test(token)) {
        setResultado({ status: "token_invalido" });
        return;
      }

      const { data, error } = await supabase.rpc("registrar_presenca", { p_token: token });

      if (error) {
        setErro("Não foi possível validar a presença. Verifique a configuração do Supabase.");
        return;
      }

      setResultado(data as ResultadoPresenca);
    }

    registrar();
  }, [router, token]);

  if (erro) {
    return (
      <main className="attendance-page">
        <div className="attendance-card error-card">
          <div className="attendance-icon">!</div>
          <h1>Não foi possível registrar</h1>
          <p>{erro}</p>
          <Link href="/" className="button button-primary">Voltar ao sistema</Link>
        </div>
      </main>
    );
  }

  if (!resultado) return <Loading texto="Validando QR Code..." />;

  const sucesso = resultado.status === "registrada" || resultado.status === "ja_registrada";

  const mensagens: Record<ResultadoPresenca["status"], { titulo: string; texto: string }> = {
    registrada: { titulo: "Presença registrada!", texto: "Seu registro foi confirmado com sucesso." },
    ja_registrada: { titulo: "Presença já registrada", texto: "Você já confirmou presença nesta aula." },
    token_invalido: { titulo: "QR Code inválido", texto: "Este código não corresponde a uma aula válida." },
    aula_encerrada: { titulo: "Aula encerrada", texto: "O professor já encerrou o registro desta aula." },
    token_expirado: { titulo: "QR Code expirado", texto: "O período de registro desta aula terminou." },
    nao_matriculado: { titulo: "Matrícula não encontrada", texto: "Sua conta não está matriculada nesta turma." },
    perfil_invalido: { titulo: "Perfil inválido", texto: "A presença só pode ser registrada por uma conta de aluno." },
    nao_autenticado: { titulo: "Faça login", texto: "Entre na sua conta antes de registrar presença." },
  };

  const mensagem = mensagens[resultado.status];

  return (
    <main className="attendance-page">
      <div className={`attendance-card ${sucesso ? "success-card" : "error-card"}`}>
        <div className="attendance-icon">{sucesso ? "✓" : "!"}</div>
        <p className="eyebrow">Frequência+</p>
        <h1>{mensagem.titulo}</h1>
        <p>{mensagem.texto}</p>

        {sucesso && (
          <div className="attendance-details">
            <div><span>Disciplina</span><strong>{resultado.disciplina}</strong></div>
            <div><span>Turma</span><strong>{resultado.turma}</strong></div>
            {resultado.data_hora && <div><span>Aula</span><strong>{formatarDataHora(resultado.data_hora)}</strong></div>}
            {resultado.registrado_em && <div><span>Registro</span><strong>{formatarDataHora(resultado.registrado_em)}</strong></div>}
          </div>
        )}

        <Link href="/aluno" className="button button-primary button-block">Ir para minha frequência</Link>
      </div>
    </main>
  );
}
