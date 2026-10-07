import { AppShell } from "@/components/layout/app-shell";
import { requirePageSession } from "@/lib/require-page-session";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, roleLabel } = await requirePageSession({ staffOnly: true });

  return (
    <AppShell email={session.email} roleLabel={roleLabel} variant="staff">
      {children}
    </AppShell>
  );
}
