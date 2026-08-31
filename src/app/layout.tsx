import type { Metadata } from "next";
import { RegisterSW } from "@/components/offline/RegisterSW";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adda Cafe",
  description: "Digital menu and Google review assistant for Adda Cafe.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
