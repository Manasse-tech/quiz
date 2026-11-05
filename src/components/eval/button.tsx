"use client";

import { forwardRef } from "react";

const variants = {
  primary:
    "bg-electric text-white hover:bg-[#1a6ddb] active:bg-[#1561c2] focus-visible:ring-electric/40",
  secondary:
    "bg-bg-raised text-text-primary border border-border-default hover:bg-bg-overlay active:bg-bg-surface",
  danger: "bg-signal text-white hover:bg-[#c22d2a] active:bg-[#a12522]",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-raised hover:text-text-primary",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, className = "", children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        rounded-[var(--radius-md)] transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-deep
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
