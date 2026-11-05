import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DOMAINES, QUESTIONS } from "@/lib/questions";
import { SEUIL_REQUIS, appreciation } from "@/lib/config";

export async function GET(req: NextRequest) {
  const attemptId = req.nextUrl.searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "Résultats introuvables." }, { status: 400 });
  }

  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { candidate: true, answers: true },
  });
  if (!attempt || !attempt.submittedAt || attempt.pourcentage === null) {
    return NextResponse.json({ error: "Résultats introuvables." }, { status: 404 });
  }

  const domaines = DOMAINES.map((meta) => {
    const questions = QUESTIONS.filter((q) => q.domaine === meta.nom);
    const bonnes = questions.filter((q) => {
      const answer = attempt.answers.find((a) => a.questionId === q.id);
      return answer && answer.selectedOptionId === q.correctOptionId;
    }).length;
    return {
      nom: meta.nom,
      bonnesReponses: bonnes,
      totalQuestions: questions.length,
      pourcentage: Math.round((bonnes / questions.length) * 100),
      recommandations: meta.recommandations,
      competencesAmeliorer: meta.competencesAmeliorer,
    };
  });

  const pointsForts = domaines
    .filter((d) => d.pourcentage >= 70)
    .map((d) => d.nom);
  const pointsFaibles = domaines
    .filter((d) => d.pourcentage < 50)
    .map((d) => d.nom);

  return NextResponse.json({
    candidat: {
      nom: attempt.candidate.nom,
      prenom: attempt.candidate.prenom,
    },
    attempt: {
      id: attempt.id,
      pourcentage: attempt.pourcentage,
      bonnesReponses: attempt.bonnesReponses ?? 0,
      totalQuestions: QUESTIONS.length,
      appreciation: appreciation(attempt.pourcentage),
      admis: attempt.admis ?? false,
      seuilRequis: SEUIL_REQUIS,
      domaines,
      pointsForts,
      pointsFaibles,
      dureeSecondes: attempt.dureeSecondes ?? 0,
    },
  });
}
