import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AimHop ERP",
  description: "Enterprise Workforce & Business Operations Management ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className="bg-[var(--color-background)] text-[var(--color-foreground)] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
