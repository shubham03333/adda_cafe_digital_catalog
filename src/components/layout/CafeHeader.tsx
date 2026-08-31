import { CAFE_TAGLINE } from "@/lib/branding";
import Link from "next/link";

type CafeHeaderProps = {
  href?: string;
  compact?: boolean;
};

export function CafeHeader({ href = "/", compact = false }: CafeHeaderProps) {
  return (
    <header className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b-4 border-red-500 text-center py-3">
      <Link href={href} className="flex items-center justify-center min-h-12">
        <img src="/adda.png" alt="Adda" className="w-11 h-11 rounded-full" />
      </Link>
      {compact ? null : (
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-1">
          {CAFE_TAGLINE}
        </p>
      )}
    </header>
  );
}
