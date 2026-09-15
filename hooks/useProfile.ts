"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Perfil, TipoPerfil } from "@/lib/types";

export function useProfile(tipoEsperado?: TipoPerfil) {
  const router = useRouter();
  const [profile, setProfile] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        const redirect = encodeURIComponent(window.location.pathname);
        router.replace(`/login?redirect=${redirect}`);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id,nome,email,tipo")
        .eq("id", authData.user.id)
        .single();

      if (!alive) return;

      if (profileError || !data) {
        setError("Não foi possível carregar seu perfil.");
        setLoading(false);
        return;
      }

      const current = data as Perfil;

      if (tipoEsperado && current.tipo !== tipoEsperado) {
        router.replace(current.tipo === "professor" ? "/professor" : "/aluno");
        return;
      }

      setProfile(current);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [router, tipoEsperado]);

  return { profile, loading, error };
}
