const variants = {
  electric: "bg-electric/15 text-electric border-electric/25",
  iris: "bg-iris/15 text-iris border-iris/25",
  signal: "bg-signal/15 text-signal border-signal/25",
  phosphor: "bg-phosphor/15 text-phosphor border-phosphor/25",
  amber: "bg-amber/15 text-amber border-amber/25",
  muted: "bg-bg-overlay text-text-secondary border-border-default",
} as const;

export function Badge({
  variant = "muted",
  children,
  className = "",
}: {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 text-xs font-medium
        rounded-[var(--radius-sm)] border
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
