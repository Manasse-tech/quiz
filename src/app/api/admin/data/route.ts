import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminCode } from "@/lib/admin";
import { QUESTIONS_COUNT } from "@/lib/config";

/* ── Anti-forçage brut (en mémoire) ──────────────────────────── */
const MAX_ESSAIS = 10;
const BLOCAGE_MS = 5 * 60 * 1000; // 5 minutes

const echecs = new Map<string, { count: number; bloqueJusqua: number }>();

function rateLimitOk(ip: string): boolean {
  const entry = echecs.get(ip);
  if (!entry) return true;
  if (entry.bloqueJusqua > 0) {
    if (Date.now() < entry.bloqueJusqua) return false;
    // Blocage expiré → remise à zéro
    echecs.delete(ip);
  }
  return true;
}

function enregistrerEchec(ip: string) {
  const entry = echecs.get(ip) ?? { count: 0, bloqueJusqua: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ESSAIS) {
    entry.bloqueJusqua = Date.now() + BLOCAGE_MS;
    entry.count = 0;
  }
  echecs.set(ip, entry);
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  if (!rateLimitOk(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 }
    );
  }

  const code = req.headers.get("x-admin-code");
  if (!verifyAdminCode(code)) {
    enregistrerEchec(ip);
    return NextResponse.json(
      { error: "Code administrateur invalide." },
      { status: 401 }
    );
  }

  /* ── Données : toutes les tentatives, candidat inclus ────────── */
  const attempts = await db.attempt.findMany({
    include: { candidate: true },
    orderBy: { startedAt: "desc" },
  });

  const candidats = new Set(attempts.map((a) => a.candidateId));
  const termines = attempts.filter((a) => a.submittedAt !== null);
  const admis = termines.filter((a) => a.admis === true);

  return NextResponse.json({
    stats: {
      candidats: candidats.size,
      tentatives: attempts.length,
      termines: termines.length,
      admis: admis.length,
      tauxReussite: termines.length
        ? Math.round((admis.length / termines.length) * 100)
        : 0,
    },
    tentatives: attempts.map((a) => ({
      id: a.id,
      nom: a.candidate.nom,
      prenom: a.candidate.prenom,
      email: a.candidate.email,
      startedAt: a.startedAt.toISOString(),
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      termine: a.submittedAt !== null,
      pourcentage: a.pourcentage,
      bonnesReponses: a.bonnesReponses,
      admis: a.admis,
      dureeSecondes: a.dureeSecondes,
      totalQuestions: QUESTIONS_COUNT,
    })),
  });
}
