import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DUREE_MINUTES } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nom = typeof body.nom === "string" ? body.nom.trim() : "";
    const prenom = typeof body.prenom === "string" ? body.prenom.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    const errors: { path: string[]; message: string }[] = [];
    if (nom.length < 2) {
      errors.push({ path: ["nom"], message: "Le nom est requis (2 caractères minimum)." });
    }
    if (prenom.length < 2) {
      errors.push({ path: ["prenom"], message: "Le prénom est requis (2 caractères minimum)." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ path: ["email"], message: "Adresse e-mail invalide." });
    }
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const candidate = await db.candidate.create({
      data: { nom, prenom, email },
    });

    const now = new Date();
    const attempt = await db.attempt.create({
      data: {
        candidateId: candidate.id,
        startedAt: now,
        expiresAt: new Date(now.getTime() + DUREE_MINUTES * 60 * 1000),
      },
    });

    return NextResponse.json({
      candidateId: candidate.id,
      attemptId: attempt.id,
    });
  } catch {
    return NextResponse.json(
      { message: "Une erreur est survenue." },
      { status: 500 }
    );
  }
}
