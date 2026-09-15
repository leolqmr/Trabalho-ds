"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect?.startsWith("/")) setRedirectTo(redirect);
  }, []);

  async function entrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error || !data.user) {
      setErro("E-mail ou senha inválidos.");
      setEnviando(false);
      return;
    }

    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tipo")
      .eq("id", data.user.id)
      .single();

    router.replace(profile?.tipo === "professor" ? "/professor" : "/aluno");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-intro">
        <div className="auth-brand"><span className="brand-mark">F+</span> Frequência+</div>
        <div>
          <p className="eyebrow">Controle de frequência</p>
          <h1>Presença simples para professor e aluno.</h1>
          <p className="auth-copy">
            O professor inicia a aula, o sistema gera um QR temporário e o aluno autenticado
            registra sua presença em segundos.
          </p>
        </div>
        <div className="feature-list">
          <span>✓ QR Code temporário</span>
          <span>✓ Frequência calculada automaticamente</span>
          <span>✓ Alertas de risco por falta</span>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <form className="auth-card" onSubmit={entrar}>
          <div>
            <p className="eyebrow">Acesso</p>
            <h2>Entrar no sistema</h2>
            <p className="muted">Use a conta cadastrada no projeto.</p>
          </div>

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@faculdade.edu.br"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>

          {erro && <div className="alert alert-danger">{erro}</div>}

          <button className="button button-primary button-block" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>

          <p className="auth-footer">
            Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
