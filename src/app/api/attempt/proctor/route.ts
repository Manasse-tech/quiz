import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { attemptId, eventType } = body;

    if (!attemptId || !eventType) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const attempt = await db.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) {
      return NextResponse.json({ error: "Tentative introuvable" }, { status: 404 });
    }

    await db.proctorEvent.create({
      data: { attemptId, eventType },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
