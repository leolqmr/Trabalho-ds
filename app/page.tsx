"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("tipo")
        .eq("id", data.user.id)
        .single();

      if (profile?.tipo === "professor") router.replace("/professor");
      else router.replace("/aluno");
    }

    redirect();
  }, [router]);

  return <Loading texto="Abrindo o sistema..." />;
}
