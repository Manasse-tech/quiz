"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldLogo } from "@/components/eval/shield";

const LETTERS = "HARKSTUDENT".split("");

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    setTimeout(onDone, 520);
  };

  useEffect(() => {
    const t = setTimeout(finish, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-bg-deep overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none ${
        leaving ? "splash-leave" : ""
      }`}
      onClick={finish}
      role="button"
      aria-label="HARKSTUDENT — Cliquez pour entrer"
    >
      {/* Grille de fond */}
      <div
        className="splash-grid fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border-default) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Ligne de balayage */}
      <div className="splash-scanline pointer-events-none" />

      {/* Bouclier */}
      <div className="splash-shield mb-6">
        <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-electric/15 flex items-center justify-center border border-electric/30">
          <ShieldLogo size={32} />
        </div>
      </div>

      {/* Lettres du nom */}
      <div
        className="flex flex-wrap justify-center font-mono font-bold text-3xl sm:text-4xl md:text-5xl text-white tracking-widest px-4"
        aria-label="HARKSTUDENT"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="splash-letter"
            style={{ animationDelay: `${0.5 + i * 0.075}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Sous-titre */}
      <p
        className="splash-subtitle mt-5 text-[11px] sm:text-xs uppercase text-text-secondary text-center px-6"
        style={{ letterSpacing: "0.28em" }}
      >
        Évaluation pré-formation
      </p>

      {/* Barre de chargement */}
      <div className="mt-8 w-52 max-w-[70vw] bg-bg-overlay rounded-full overflow-hidden">
        <div className="splash-loader rounded-full" />
      </div>

      {/* Indication */}
      <p className="mt-4 text-[10px] text-text-muted">
        Cliquez pour entrer
      </p>
    </div>
  );
}
