export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="absolute -top-1/4 right-[-10%] h-[600px] w-[600px] rounded-full bg-primary/25 blur-[140px]" />
      <div className="absolute top-1/3 left-[-15%] h-[500px] w-[500px] rounded-full bg-primary-2/20 blur-[140px]" />
      <div className="absolute bottom-[-10%] right-[10%] h-[450px] w-[450px] rounded-full bg-accent/20 blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--color-background)_75%)]" />
    </div>
  );
}
