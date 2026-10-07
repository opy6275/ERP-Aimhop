import { AppShell } from "@/components/layout/app-shell";
import { requirePageSession } from "@/lib/require-page-session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, roleLabel } = await requirePageSession({ adminOnly: true });

  return (
    <AppShell email={session.email} roleLabel={roleLabel} variant="admin">
      {children}
    </AppShell>
  );
}
