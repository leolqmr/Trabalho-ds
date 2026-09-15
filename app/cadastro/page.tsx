"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { TipoPerfil } from "@/lib/types";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<TipoPerfil>("aluno");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function cadastrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);
    setEnviando(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          nome: nome.trim(),
          tipo,
        },
      },
    });

    if (error) {
      setErro(error.message);
      setEnviando(false);
      return;
    }

    if (data.session) {
      router.replace(tipo === "professor" ? "/professor" : "/aluno");
      return;
    }

    setMensagem(
      "Conta criada. Se a confirmação por e-mail estiver habilitada no Supabase, confirme o e-mail antes de entrar."
    );
    setEnviando(false);
  }

  return (
    <main className="auth-page compact-auth">
      <section className="auth-panel auth-intro">
        <div className="auth-brand"><span className="brand-mark">F+</span> Frequência+</div>
        <div>
          <p className="eyebrow">Primeiro acesso</p>
          <h1>Crie um perfil para testar o sistema.</h1>
          <p className="auth-copy">
            Alunos entram nas turmas pelo e-mail cadastrado. Professores criam turmas e gerenciam aulas.
          </p>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <form className="auth-card" onSubmit={cadastrar}>
          <div>
            <p className="eyebrow">Cadastro</p>
            <h2>Nova conta</h2>
          </div>

          <label className="field">
            <span>Nome completo</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>

          <label className="field">
            <span>E-mail</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label className="field">
            <span>Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required />
          </label>

          <label className="field">
            <span>Perfil</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPerfil)}>
              <option value="aluno">Aluno</option>
              <option value="professor">Professor</option>
            </select>
          </label>

          {erro && <div className="alert alert-danger">{erro}</div>}
          {mensagem && <div className="alert alert-success">{mensagem}</div>}

          <button className="button button-primary button-block" disabled={enviando}>
            {enviando ? "Criando..." : "Criar conta"}
          </button>

          <p className="auth-footer">
            Já possui conta? <Link href="/login">Entrar</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
