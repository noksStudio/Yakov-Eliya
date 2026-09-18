export function SectionEyebrow({
  label,
  tag,
  className,
}: {
  label: string;
  tag?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-center sm:justify-between ${className ?? ""}`} dir="ltr">
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted">
        {label}
      </span>
      {tag && (
        <span className="hidden text-end text-xs font-medium uppercase leading-relaxed tracking-[0.2em] text-muted/70 sm:block">
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
