import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { questionsForClient } from "@/lib/questions";

export async function GET(req: NextRequest) {
  const attemptId = req.nextUrl.searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "Tentative introuvable" }, { status: 400 });
  }

  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: { answers: true },
  });
  if (!attempt) {
    return NextResponse.json({ error: "Tentative introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    expiresAt: attempt.expiresAt.toISOString(),
    submitted: !!attempt.submittedAt,
    questions: questionsForClient(),
    savedAnswers: attempt.answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
    })),
  });
}
