const barVariants = {
  electric: "bg-electric",
  iris: "bg-iris",
  signal: "bg-signal",
  phosphor: "bg-phosphor",
  amber: "bg-amber",
} as const;

export function ProgressBar({
  value,
  variant = "electric",
  height = "md",
  label,
  className = "",
}: {
  value: number;
  variant?: keyof typeof barVariants;
  height?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const o = Math.max(0, Math.min(100, value));
  const h = height === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1.5 text-xs">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary font-medium font-mono">{o}%</span>
        </div>
      )}
      <div
        className={`w-full ${h} bg-bg-overlay rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={o}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${o}%`}
      >
        <div
          className={`${h} ${barVariants[variant]} rounded-full transition-[width] duration-500 ease-out`}
          style={{ width: `${o}%` }}
        />
      </div>
    </div>
  );
}
