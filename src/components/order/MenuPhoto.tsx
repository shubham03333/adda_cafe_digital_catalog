import { cn } from "@/lib/utils";

type MenuPhotoProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** First-screen photos should load immediately. */
  priority?: boolean;
};

export function MenuPhoto({ src, alt = "", className, priority = false }: MenuPhotoProps) {
  const url = src?.trim() || "/adda.png";
  return (
    <img
      src={url}
      alt={alt}
      className={cn("bg-gray-100 object-cover", className)}
      decoding={priority ? "sync" : "async"}
      loading={priority ? "eager" : "lazy"}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
