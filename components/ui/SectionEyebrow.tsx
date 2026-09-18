export function SectionEyebrow({
  label,
  tag,
  className,
  tone = "dark",
}: {
  label: string;
  tag?: string;
  className?: string;
  tone?: "dark" | "light";
}) {
  const textColor = tone === "dark" ? "text-muted" : "text-paper-muted";
  const tagColor = tone === "dark" ? "text-muted/70" : "text-paper-muted/70";

  return (
    <div className={`flex items-start justify-center sm:justify-between ${className ?? ""}`} dir="ltr">
      <span className={`text-xs font-medium uppercase tracking-[0.25em] ${textColor}`}>
        {label}
      </span>
      {tag && (
        <span
          className={`hidden text-end text-xs font-medium uppercase leading-relaxed tracking-[0.2em] ${tagColor} sm:block`}
        >
          {tag.split(" ").map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
