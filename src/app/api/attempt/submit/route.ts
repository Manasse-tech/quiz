import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QUESTIONS } from "@/lib/questions";
import { SEUIL_REQUIS, appreciation } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId } = body;
    if (!attemptId) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const attempt = await db.attempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });
    if (!attempt) {
      return NextResponse.json({ error: "Tentative introuvable" }, { status: 404 });
    }

    if (!attempt.submittedAt) {
      let bonnesReponses = 0;
      for (const q of QUESTIONS) {
        const answer = attempt.answers.find((a) => a.questionId === q.id);
        if (answer && answer.selectedOptionId === q.correctOptionId) {
          bonnesReponses++;
        }
      }
      const total = QUESTIONS.length;
      const pourcentage = Math.round((bonnesReponses / total) * 100);
      const dureeSecondes = Math.max(
        0,
        Math.round((Date.now() - attempt.startedAt.getTime()) / 1000)
      );

      await db.attempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: new Date(),
          dureeSecondes,
          bonnesReponses,
          pourcentage,
          admis: pourcentage >= SEUIL_REQUIS,
        },
      });
    }

    return NextResponse.json({ attemptId });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
