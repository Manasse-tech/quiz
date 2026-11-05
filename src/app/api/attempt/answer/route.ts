import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { QUESTIONS } from "@/lib/questions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, questionId, selectedOptionId } = body;

    if (!attemptId || !questionId || !selectedOptionId) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.submittedAt) {
      return NextResponse.json({ error: "Tentative introuvable" }, { status: 404 });
    }

    const question = QUESTIONS.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.id === selectedOptionId);
    if (!question || !option) {
      return NextResponse.json({ error: "Question inconnue" }, { status: 400 });
    }

    await db.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, selectedOptionId },
      update: { selectedOptionId },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
