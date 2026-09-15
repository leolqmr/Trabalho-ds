import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import type { Perfil } from "@/lib/types";

export default function AppShell({
  profile,
  children,
}: {
  profile: Perfil;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <AppHeader profile={profile} />
      <main className="container page-content">{children}</main>
    </div>
  );
}
