// Nettoie les anciennes tentatives liées aux questions précédentes
import { db } from "@/lib/db";

async function main() {
  await db.proctorEvent.deleteMany();
  await db.answer.deleteMany();
  await db.attempt.deleteMany();
  await db.candidate.deleteMany();
  console.log("Base de données réinitialisée.");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
