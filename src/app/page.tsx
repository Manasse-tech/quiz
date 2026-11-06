"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/eval/button";
import { Input } from "@/components/eval/input";
import { Badge } from "@/components/eval/badge";
import { ProgressBar } from "@/components/eval/progress";
import { ShieldLogo } from "@/components/eval/shield";
import {
  SITE_NAME,
  FORMATION_TITLE,
  DUREE_MINUTES,
  QUESTIONS_COUNT,
  SEUIL_REQUIS,
  WHATSAPP_LINK,
} from "@/lib/config";

type Screen = "boot" | "register" | "consignes" | "test" | "results";

type ClientQuestion = {
  id: string;
  domaine: string;
  enonce: string;
  options: { id: string; texte: string }[];
};

type ResultData = {
  candidat: { nom: string; prenom: string };
  attempt: {
    id: string;
    pourcentage: number;
    bonnesReponses: number;
    totalQuestions: number;
    appreciation: string;
    admis: boolean;
    domaines: {
      nom: string;
      bonnesReponses: number;
      totalQuestions: number;
      pourcentage: number;
      recommandations: string[];
    }[];
    pointsForts: string[];
    pointsFaibles: string[];
    dureeSecondes: number;
  };
};

const ATTEMPT_KEY = "harkstudent_attempt_id";
const CANDIDATE_KEY = "harkstudent_candidate_id";

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min} min ${sec} s`;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("boot");

  // ── Register ──────────────────────────────────────────────────
  const [form, setForm] = useState({ nom: "", prenom: "", email: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [registering, setRegistering] = useState(false);

  // ── Consignes ─────────────────────────────────────────────────
  const [checked, setChecked] = useState(false);
  const [attemptReady, setAttemptReady] = useState(false);

  // ── Test ──────────────────────────────────────────────────────
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState<ClientQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingTest, setLoadingTest] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const tabSwitchCount = useRef(0);
  const submittedRef = useRef(false);
  const pendingAnswerSaves = useRef(new Set<Promise<void>>());
  const answerQueue = useRef(Promise.resolve());

  // ── Résultats ─────────────────────────────────────────────────
  const [result, setResult] = useState<ResultData | null>(null);
  const [resultError, setResultError] = useState("");

  // Boot : reprise de session
  useEffect(() => {
    const stored = sessionStorage.getItem(ATTEMPT_KEY);
    if (!stored) {
      setScreen("register");
      return;
    }
    setAttemptId(stored);
    fetch(`/api/attempt/start?attemptId=${stored}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          sessionStorage.removeItem(ATTEMPT_KEY);
          sessionStorage.removeItem(CANDIDATE_KEY);
          setScreen("register");
          return;
        }
        if (data.submitted) {
          setScreen("results");
          return;
        }
        setQuestions(data.questions);
        setExpiresAt(data.expiresAt);
        const saved: Record<string, string> = {};
        for (const a of data.savedAnswers ?? []) saved[a.questionId] = a.selectedOptionId;
        setAnswers(saved);
        setLoadingTest(false);
        setAttemptReady(true);
        setScreen("test");
      })
      .catch(() => setScreen("register"));
  }, []);

  // Inscription
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setGlobalError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const errs: Record<string, string> = {};
          for (const err of data.errors) if (err.path?.[0]) errs[err.path[0]] = err.message;
          setFieldErrors(errs);
        } else {
          setGlobalError(data.message ?? "Une erreur est survenue.");
        }
        return;
      }
      sessionStorage.setItem(CANDIDATE_KEY, data.candidateId);
      sessionStorage.setItem(ATTEMPT_KEY, data.attemptId);
      setAttemptId(data.attemptId);
      setAttemptReady(true);
      setScreen("consignes");
    } catch {
      setGlobalError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setRegistering(false);
    }
  };

  // Chargement des questions au démarrage du test
  const startTest = useCallback(async () => {
    if (!attemptId) return;
    setLoadingTest(true);
    try {
      const res = await fetch(`/api/attempt/start?attemptId=${attemptId}`);
      const data = await res.json();
      if (data.error) {
        setScreen("register");
        return;
      }
      setQuestions(data.questions);
      setExpiresAt(data.expiresAt);
      const saved: Record<string, string> = {};
      for (const a of data.savedAnswers ?? []) saved[a.questionId] = a.selectedOptionId;
      setAnswers(saved);
      setScreen("test");
    } catch {
      setScreen("register");
    } finally {
      setLoadingTest(false);
    }
  }, [attemptId]);

  // Surveillance (proctoring)
  useEffect(() => {
    if (screen !== "test" || !attemptId) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        tabSwitchCount.current++;
        setShowTabWarning(true);
        fetch("/api/attempt/proctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, eventType: "visibilitychange" }),
        }).catch(() => {});
        setTimeout(() => setShowTabWarning(false), 4000);
      }
    };
    const onBlur = () => {
      fetch("/api/attempt/proctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, eventType: "blur" }),
      }).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [screen, attemptId]);

  // Réponse à une question
  const saveAnswer = useCallback(
    async (questionId: string, selectedOptionId: string) => {
      if (!attemptId) return;
      const save = answerQueue.current
        .then(() => fetch("/api/attempt/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, questionId, selectedOptionId }),
        }))
        .then(() => undefined)
        .catch(() => undefined);
      answerQueue.current = save;
      pendingAnswerSaves.current.add(save);
      void save.finally(() => pendingAnswerSaves.current.delete(save));
    },
    [attemptId]
  );

  // Soumission
  const submitAttempt = useCallback(async () => {
    if (submittedRef.current || !attemptId) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await Promise.race([
        Promise.all([...pendingAnswerSaves.current]),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      const res = await fetch("/api/attempt/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      const data = await res.json();
      if (data.attemptId) {
        setScreen("results");
      } else {
        submittedRef.current = false;
        setSubmitting(false);
      }
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attemptId]);

  // Chargement des résultats
  useEffect(() => {
    if (screen !== "results" || !attemptId || result) return;
    fetch(`/api/attempt/result?attemptId=${attemptId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Accès non autorisé");
        return r.json();
      })
      .then(setResult)
      .catch(() => setResultError("Impossible de charger les résultats."));
  }, [screen, attemptId, result]);

  // ── Écran d'amorçage ─────────────────────────────────────────
  if (screen === "boot") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-text-muted text-sm">Chargement…</p>
      </div>
    );
  }

  // ── Écran 1 : Inscription ─────────────────────────────────────
  if (screen === "register") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border-default) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <main className="relative w-full max-w-md space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-electric/15 flex items-center justify-center">
                <ShieldLogo />
              </div>
              <span className="text-sm font-medium text-text-secondary tracking-wide">
                {SITE_NAME}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight text-text-primary">
              Évaluation pré-formation
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-sm">
              Teste tes connaissances avant la formation « {FORMATION_TITLE} ».
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <div className="text-lg font-bold font-mono text-electric">{QUESTIONS_COUNT}</div>
              <div className="text-xs text-text-muted mt-0.5">questions</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold font-mono text-iris">{DUREE_MINUTES}</div>
              <div className="text-xs text-text-muted mt-0.5">minutes</div>
            </div>
            <div className="card p-3 text-center">
              <div className="text-lg font-bold font-mono text-phosphor">{SEUIL_REQUIS}%</div>
              <div className="text-xs text-text-muted mt-0.5">seuil requis</div>
            </div>
          </div>

          <form onSubmit={handleRegister} className="card p-6 space-y-4">
            <p className="text-sm font-medium text-text-primary mb-1">Identification</p>
            <Input
              label="Nom"
              name="nom"
              placeholder="Ex : Koné"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              error={fieldErrors.nom}
              required
              autoComplete="family-name"
            />
            <Input
              label="Prénom"
              name="prenom"
              placeholder="Ex : Aminata"
              value={form.prenom}
              onChange={(e) => setForm({ ...form, prenom: e.target.value })}
              error={fieldErrors.prenom}
              required
              autoComplete="given-name"
            />
            <Input
              label="Adresse e-mail"
              name="email"
              type="email"
              placeholder="aminata@exemple.ci"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />
            {globalError && (
              <p
                className="text-sm text-signal bg-signal/10 border border-signal/20 rounded-[var(--radius-md)] px-3 py-2"
                role="alert"
              >
                {globalError}
              </p>
            )}
            <Button type="submit" loading={registering} className="w-full">
              Commencer l&apos;évaluation
            </Button>
          </form>

          <p className="text-xs text-text-muted text-center">
            Les données collectées sont utilisées uniquement pour l&apos;évaluation.
          </p>
        </main>
      </div>
    );
  }

  // ── Écran 2 : Consignes ───────────────────────────────────────
  if (screen === "consignes") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-12">
        <main className="w-full max-w-lg space-y-6">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-text-primary">Consignes avant le test</h1>
            <p className="text-sm text-text-secondary">Lis attentivement avant de commencer.</p>
          </div>
          <div className="card p-6 space-y-4 text-sm text-text-secondary leading-relaxed">
            <p>
              Avant de commencer, assure-toi d&apos;être dans un environnement calme et de
              ranger les documents ou appareils non autorisés.
            </p>
            <p>
              Cette évaluation comporte{" "}
              <strong className="text-text-primary">{QUESTIONS_COUNT} questions</strong> et
              dure <strong className="text-text-primary">{DUREE_MINUTES} minutes</strong>. Les changements
              d&apos;onglet ou la perte de visibilité de la page peuvent être détectés et
              enregistrés comme événements de surveillance.
            </p>
            <p>Aucune caméra ni aucun enregistrement vidéo ne seront utilisés.</p>
            <p>
              Une fois le temps écoulé, le test sera soumis automatiquement. Réponds honnêtement
              afin que tes résultats reflètent ton niveau réel et permettent d&apos;identifier
              les compétences à renforcer.
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border-default bg-bg-raised
                text-electric focus:ring-electric/40 focus:ring-2 focus:ring-offset-0
                cursor-pointer"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              J&apos;ai lu et compris les consignes. Je suis prêt à commencer l&apos;évaluation.
            </span>
          </label>
          <Button
            onClick={() => checked && attemptReady && startTest()}
            disabled={!checked}
            className="w-full"
          >
            Démarrer le test
          </Button>
        </main>
      </div>
    );
  }

  // ── Écran 3 : Test ────────────────────────────────────────────
  if (screen === "test") {
    return (
      <TestScreen
        questions={questions}
        current={current}
        setCurrent={setCurrent}
        answers={answers}
        setAnswers={setAnswers}
        saveAnswer={saveAnswer}
        expiresAt={expiresAt}
        loading={loadingTest}
        submitting={submitting}
        showTabWarning={showTabWarning}
        tabCount={tabSwitchCount.current}
        onSubmit={submitAttempt}
      />
    );
  }

  // ── Écran 4 : Résultats ───────────────────────────────────────
  if (resultError || !result) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-signal text-sm">{resultError || "Résultats introuvables."}</p>
      </div>
    );
  }

  const { candidat, attempt } = result;

  return (
    <div className="min-h-dvh px-4 py-8">
      <main className="max-w-xl mx-auto space-y-6">
        <div
          className={`card p-6 text-center space-y-2 border ${
            attempt.admis ? "border-phosphor/30" : "border-signal/30"
          }`}
        >
          <Badge variant={attempt.admis ? "phosphor" : "signal"}>
            {attempt.admis ? "Admis au seuil" : "Seuil non atteint"}
          </Badge>
          <h1 className="text-xl font-bold text-text-primary">
            {candidat.prenom} {candidat.nom}
          </h1>
          <div className="text-4xl font-bold font-mono text-text-primary">
            {attempt.pourcentage}%
          </div>
          <p className="text-sm text-text-secondary">
            {attempt.bonnesReponses}/{attempt.totalQuestions} bonnes réponses —{" "}
            {formatDuration(attempt.dureeSecondes)}
          </p>
          <p className="text-sm text-text-secondary">{attempt.appreciation}</p>
        </div>

        <div className="card p-5 text-sm text-text-secondary leading-relaxed space-y-3">
          {attempt.admis ? (
            <>
              <p>
                Félicitations ! Tu as atteint le seuil requis pour accéder à la prochaine
                étape de la formation.
              </p>
              <p>
                Prends le temps d&apos;étudier les compétences pour lesquelles ton score est
                le plus faible.
              </p>
              <p className="text-xs text-text-muted">
                Ton résultat ne signifie pas que tu maîtrises déjà le pentest web en
                pratique : il constitue une évaluation de tes connaissances théoriques.
              </p>
            </>
          ) : (
            <>
              <p>Merci d&apos;avoir participé à cette évaluation.</p>
              <p>
                Ton résultat indique que certaines bases doivent encore être consolidées
                avant la prochaine formation. Rejoins le groupe WhatsApp pour suivre les
                prochaines étapes et réviser les domaines où ton score est le plus faible.
              </p>
            </>
          )}
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Résultats par domaine</h2>
          {attempt.domaines.map((d) => {
            const variant =
              d.pourcentage >= 70 ? "phosphor" : d.pourcentage >= 50 ? "amber" : "signal";
            return (
              <div key={d.nom} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">{d.nom}</span>
                  <span className="text-xs font-mono text-text-secondary">
                    {d.bonnesReponses}/{d.totalQuestions}
                  </span>
                </div>
                <ProgressBar value={d.pourcentage} variant={variant} height="sm" />
                {d.recommandations.length > 0 && (
                  <ul className="text-xs text-text-muted space-y-0.5 pl-3">
                    {d.recommandations.map((r, i) => (
                      <li key={i}>— {r}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-semibold text-phosphor">Points forts</h3>
            {attempt.pointsForts.length > 0 ? (
              <ul className="text-xs text-text-secondary space-y-1">
                {attempt.pointsForts.map((p) => (
                  <li key={p}>— {p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">Aucun domaine au-dessus de 70%</p>
            )}
          </div>
          <div className="card p-4 space-y-2">
            <h3 className="text-xs font-semibold text-signal">À renforcer</h3>
            {attempt.pointsFaibles.length > 0 ? (
              <ul className="text-xs text-text-secondary space-y-1">
                {attempt.pointsFaibles.map((p) => (
                  <li key={p}>— {p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-text-muted">Tous les domaines au-dessus de 50%</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" className="w-full mt-3">
              Rejoindre le groupe WhatsApp
            </Button>
          </a>
        </div>

        <p className="text-[10px] text-text-muted text-center leading-relaxed">
          Cette évaluation est théorique et de niveau débutant. Elle ne constitue pas une
          certification professionnelle.
        </p>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Écran de test (quiz)
// ═══════════════════════════════════════════════════════════════
function TestScreen({
  questions,
  current,
  setCurrent,
  answers,
  setAnswers,
  saveAnswer,
  expiresAt,
  loading,
  submitting,
  showTabWarning,
  tabCount,
  onSubmit,
}: {
  questions: ClientQuestion[];
  current: number;
  setCurrent: (fn: (c: number) => number) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveAnswer: (questionId: string, selectedOptionId: string) => Promise<void>;
  expiresAt: string;
  loading: boolean;
  submitting: boolean;
  showTabWarning: boolean;
  tabCount: number;
  onSubmit: () => Promise<void>;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));

  useEffect(() => {
    if (remaining === 0 && !loading && questions.length > 0) {
      onSubmit();
    }
  }, [remaining, loading, questions.length, onSubmit]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-text-muted text-sm">Chargement du test…</div>
      </div>
    );
  }

  const question = questions[current];
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  let timerColor = "text-text-primary";
  let timerAnim = "";
  if (remaining <= 60) {
    timerColor = "text-signal";
    timerAnim = "animate-pulse";
  } else if (remaining <= 300 && remaining > 60) {
    timerColor = "text-amber";
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {showTabWarning && (
        <div className="fixed inset-0 z-50 bg-bg-deep/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card border-signal/30 p-6 max-w-sm text-center space-y-2">
            <p className="text-signal font-semibold">Changement d&apos;onglet détecté</p>
            <p className="text-sm text-text-secondary">
              Cet événement a été enregistré ({tabCount} fois). Reste sur cette page.
            </p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-bg-deep/95 backdrop-blur border-b border-border-muted">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted">
              Question {current + 1}/{questions.length}
            </span>
            <div className="w-24 h-1.5 bg-bg-overlay rounded-full overflow-hidden">
              <div
                className="h-full bg-electric rounded-full transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted font-mono">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div
            className={`font-mono font-semibold tabular-nums ${timerColor} ${timerAnim}`}
            role="timer"
            aria-live="polite"
            aria-label={`Temps restant : ${minutes} minutes et ${seconds} secondes`}
          >
            <span className="text-3xl tracking-tight">
              {pad(minutes)}:{pad(seconds)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl space-y-6">
          <div className="space-y-3">
            <p className="text-base font-medium text-text-primary leading-relaxed">
              {question.enonce}
            </p>
          </div>
          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = answers[question.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setAnswers((prev) => ({ ...prev, [question.id]: option.id }));
                    saveAnswer(question.id, option.id);
                  }}
                  className={`
                    w-full text-left px-4 py-3 rounded-[var(--radius-lg)] border
                    transition-all duration-150 text-sm leading-relaxed
                    ${
                      selected
                        ? "bg-electric/10 border-electric/40 text-text-primary"
                        : "bg-bg-surface border-border-default text-text-secondary hover:border-border-default hover:bg-bg-raised"
                    }
                  `}
                  aria-pressed={selected}
                >
                  {option.texte}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              Précédente
            </Button>
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-center">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrent(() => idx)}
                  className={`
                    w-6 h-6 rounded-[var(--radius-sm)] text-[10px] font-medium
                    transition-colors duration-100
                    ${
                      idx === current
                        ? "bg-electric text-white"
                        : answers[q.id]
                          ? "bg-electric/20 text-electric"
                          : "bg-bg-overlay text-text-muted hover:bg-bg-raised"
                    }
                  `}
                  aria-label={`Question ${idx + 1}${answers[q.id] ? " (répondue)" : ""}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            {current < questions.length - 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              >
                Suivante
              </Button>
            ) : (
              <Button size="sm" onClick={onSubmit} loading={submitting} disabled={submitting}>
                Soumettre
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
