import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortraitPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,rgba(109,91,255,0.35),rgba(79,139,255,0.15)_60%,rgba(5,6,15,0.9))]",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.12),transparent_60%)]"
      />
      <User className="h-1/4 w-1/4 text-white/25" strokeWidth={1} />
    </div>
  );
}
