import type { Metadata } from "next";
import { RegisterSW } from "@/components/offline/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adda Cafe",
  description: "Digital menu and Google review assistant for Adda Cafe.",
};

function supabaseOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const storageOrigin = supabaseOrigin();
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        {storageOrigin ? (
          <>
            <link rel="preconnect" href={storageOrigin} />
            <link rel="dns-prefetch" href={storageOrigin} />
          </>
        ) : null}
      </head>
      <body className="antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
