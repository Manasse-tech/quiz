/* Script de test : soumet la tentative donnée avec toutes les bonnes réponses.
 * Usage: bun scripts/submit-perfect.ts <attemptId>
 */
const attemptId = process.argv[2];
if (!attemptId) {
  console.error("Usage: bun scripts/submit-perfect.ts <attemptId>");
  process.exit(1);
}

const { QUESTIONS } = await import("../src/lib/questions");

for (const q of QUESTIONS) {
  const res = await fetch("http://localhost:3000/api/attempt/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId,
      questionId: q.id,
      selectedOptionId: q.correctOptionId,
    }),
  });
  if (!res.ok) {
    console.error(`Réponse ${q.id} échouée: ${res.status}`);
    process.exit(1);
  }
}

const submit = await fetch("http://localhost:3000/api/attempt/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ attemptId }),
});
const result = await submit.json();
console.log("Soumission:", JSON.stringify(result));
