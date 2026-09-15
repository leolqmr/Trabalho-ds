"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Perfil } from "@/lib/types";

export default function AppHeader({ profile }: { profile: Perfil }) {
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const inicio = profile.tipo === "professor" ? "/professor" : "/aluno";

  return (
    <header className="app-header">
      <Link href={inicio} className="brand">
        <span className="brand-mark">F+</span>
        <span>Frequência+</span>
      </Link>

      <div className="header-user">
        <div className="header-user-text">
          <strong>{profile.nome}</strong>
          <span>{profile.tipo === "professor" ? "Professor" : "Aluno"}</span>
        </div>
        <button className="button button-ghost" onClick={sair}>
          Sair
        </button>
      </div>
    </header>
  );
}
