"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Search, RefreshCw, Download, LogOut } from "lucide-react";
import { Button } from "@/components/eval/button";
import { Input } from "@/components/eval/input";
import { Badge } from "@/components/eval/badge";
import { ShieldLogo } from "@/components/eval/shield";
import { SITE_NAME, SEUIL_REQUIS } from "@/lib/config";

type Tentative = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  startedAt: string;
  submittedAt: string | null;
  termine: boolean;
  pourcentage: number | null;
  bonnesReponses: number | null;
  admis: boolean | null;
  dureeSecondes: number | null;
  totalQuestions: number;
};

type AdminData = {
  stats: {
    candidats: number;
    tentatives: number;
    termines: number;
    admis: number;
    tauxReussite: number;
  };
  tentatives: Tentative[];
};

const ADMIN_CODE_KEY = "harkstudent_admin_code";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Africa/Abidjan",
});

function formatDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

function formatDuree(seconds: number) {
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, "0");
  return `${min} min ${sec} s`;
}

function champCsv(valeur: string | number) {
  const s = String(valeur);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function StatCard({
  label,
  value,
  accent = "text-text-primary",
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className={`font-mono text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function resultatBadge(t: Tentative) {
  if (t.admis === true) return { variant: "phosphor" as const, label: "Admis" };
  if (t.admis === false) return { variant: "signal" as const, label: "Refusé" };
  return { variant: "amber" as const, label: "En cours" };
}

export default function AdminPage() {
  const [phase, setPhase] = useState<"checking" | "login" | "ready">("checking");
  const [codeSaisi, setCodeSaisi] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [recherche, setRecherche] = useState("");
  const [rafraichit, setRafraichit] = useState(false);

  /* ── Appel API avec le code fourni ──────────────────────────── */
  const chargerDonnees = useCallback(
    async (code: string): Promise<{ ok: boolean; message?: string }> => {
      try {
        const res = await fetch("/api/admin/data", {
          headers: { "x-admin-code": code },
          cache: "no-store",
        });
        if (res.status === 401) return { ok: false, message: "Code administrateur invalide." };
        if (res.status === 429)
          return { ok: false, message: "Trop de tentatives. Réessayez dans quelques minutes." };
        if (!res.ok) return { ok: false, message: "Erreur serveur. Réessayez plus tard." };
        const json: AdminData = await res.json();
        setData(json);
        return { ok: true };
      } catch {
        return { ok: false, message: "Impossible de contacter le serveur." };
      }
    },
    []
  );

  /* ── Reprise de session : code mémorisé dans l'onglet ───────── */
  useEffect(() => {
    let actif = true;
    (async () => {
      const sauvegarde = sessionStorage.getItem(ADMIN_CODE_KEY);
      const r = sauvegarde ? await chargerDonnees(sauvegarde) : null;
      if (!actif) return;
      if (r?.ok) {
        setPhase("ready");
      } else {
        sessionStorage.removeItem(ADMIN_CODE_KEY);
        setPhase("login");
      }
    })();
    return () => {
      actif = false;
    };
  }, [chargerDonnees]);

  /* ── Connexion ──────────────────────────────────────────────── */
  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    if (!codeSaisi.trim()) return;
    setConnexionEnCours(true);
    setErreur(null);
    const r = await chargerDonnees(codeSaisi);
    if (r.ok) {
      sessionStorage.setItem(ADMIN_CODE_KEY, codeSaisi);
      setPhase("ready");
    } else {
      setErreur(r.message ?? "Code administrateur invalide.");
    }
    setConnexionEnCours(false);
  }

  /* ── Actualiser ─────────────────────────────────────────────── */
  async function handleActualiser() {
    const code = sessionStorage.getItem(ADMIN_CODE_KEY);
    if (!code) {
      setPhase("login");
      return;
    }
    setRafraichit(true);
    const r = await chargerDonnees(code);
    if (!r.ok) {
      sessionStorage.removeItem(ADMIN_CODE_KEY);
      setPhase("login");
    }
    setRafraichit(false);
  }

  /* ── Déconnexion ────────────────────────────────────────────── */
  function handleDeconnexion() {
    sessionStorage.removeItem(ADMIN_CODE_KEY);
    setCodeSaisi("");
    setData(null);
    setPhase("login");
  }

  /* ── Filtrage par recherche ─────────────────────────────────── */
  const tentativesFiltrees = useMemo(() => {
    if (!data) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return data.tentatives;
    return data.tentatives.filter(
      (t) =>
        t.nom.toLowerCase().includes(q) ||
        t.prenom.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
    );
  }, [data, recherche]);

  /* ── Export CSV ─────────────────────────────────────────────── */
  function handleExportCsv() {
    if (!data) return;
    const entetes = [
      "Nom",
      "Prénom",
      "Email",
      "Score (%)",
      "Bonnes réponses",
      "Résultat",
      "Statut",
      "Début",
      "Soumission",
      "Durée",
    ];
    const lignes = data.tentatives.map((t) =>
      [
        t.nom,
        t.prenom,
        t.email,
        t.pourcentage ?? "",
        t.bonnesReponses ?? "",
        t.admis === true ? "Admis" : t.admis === false ? "Refusé" : "",
        t.termine ? "Terminé" : "En cours",
        formatDate(t.startedAt),
        t.submittedAt ? formatDate(t.submittedAt) : "",
        t.dureeSecondes !== null && t.dureeSecondes !== undefined
          ? formatDuree(t.dureeSecondes)
          : "",
      ]
        .map(champCsv)
        .join(";")
    );
    const csv =
      "\uFEFF" + [entetes.map(champCsv).join(";"), ...lignes].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `harkstudent-candidats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Écran de vérification (reprise de session) ─────────────── */
  if (phase === "checking") {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="font-mono text-xs">Vérification de l&apos;accès…</p>
        </div>
      </main>
    );
  }

  /* ── Écran de connexion ─────────────────────────────────────── */
  if (phase === "login") {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="card w-full max-w-sm p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-bg-overlay border border-border-default flex items-center justify-center">
              <Lock size={20} className="text-electric" />
            </div>
            <h1 className="font-mono text-lg font-semibold tracking-wide text-text-primary">
              Espace administrateur
            </h1>
            <p className="text-sm text-text-secondary text-center">
              Zone réservée aux responsables de {SITE_NAME}.
              <br />
              Veuillez saisir le code d&apos;accès.
            </p>
          </div>
          <form onSubmit={handleConnexion} className="space-y-4">
            <Input
              label="Code d'accès"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={codeSaisi}
              onChange={(e) => setCodeSaisi(e.target.value)}
              error={erreur ?? undefined}
            />
            <Button type="submit" className="w-full" loading={connexionEnCours}>
              Se connecter
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-text-muted">
            Page confidentielle — ne pas partager ce lien.
          </p>
        </div>
      </main>
    );
  }

  /* ── Tableau de bord ────────────────────────────────────────── */
  const stats = data?.stats;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldLogo size={28} />
          <div>
            <h1 className="font-mono text-xl font-semibold tracking-wide text-text-primary">
              {SITE_NAME}
            </h1>
            <p className="text-xs text-text-secondary">
              Espace administrateur — suivi des candidats
            </p>
          </div>
        </div>
        <Badge variant="iris">Administration</Badge>
      </header>

      {/* Statistiques */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" aria-label="Statistiques">
        <StatCard label="Candidats inscrits" value={stats?.candidats ?? 0} />
        <StatCard label="Tests terminés" value={stats?.termines ?? 0} />
        <StatCard label="Candidats admis" value={stats?.admis ?? 0} accent="text-phosphor" />
        <StatCard
          label="Taux de réussite"
          value={`${stats?.tauxReussite ?? 0} %`}
          accent="text-electric"
        />
      </section>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            type="search"
            placeholder="Rechercher un nom, prénom ou email…"
            aria-label="Rechercher un candidat"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-text-primary bg-bg-raised border border-border-default rounded-[var(--radius-md)] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-electric/40 focus:border-electric transition-colors duration-150"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleActualiser} loading={rafraichit}>
          <RefreshCw size={14} />
          Actualiser
        </Button>
        <Button variant="secondary" size="sm" onClick={handleExportCsv}>
          <Download size={14} />
          Exporter CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDeconnexion}>
          <LogOut size={14} />
          Se déconnecter
        </Button>
      </div>

      {/* Tableau des candidats */}
      <div className="card overflow-hidden" role="region" aria-label="Liste des candidats">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-raised text-left">
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">#</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Nom</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Prénom</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Email</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Score</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Résultat</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Date</th>
                <th scope="col" className="px-3 py-2.5 font-medium text-text-secondary">Durée</th>
              </tr>
            </thead>
            <tbody>
              {tentativesFiltrees.map((t, i) => {
                const badge = resultatBadge(t);
                return (
                  <tr
                    key={t.id}
                    className="border-b border-border-muted last:border-0 hover:bg-bg-raised/60 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-text-muted font-mono">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-text-primary">{t.nom}</td>
                    <td className="px-3 py-2.5 text-text-primary">{t.prenom}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{t.email}</td>
                    <td className="px-3 py-2.5 font-mono">
                      {t.termine ? `${t.pourcentage} %` : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {formatDate(t.startedAt)}
                    </td>
                    <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                      {t.dureeSecondes !== null && t.dureeSecondes !== undefined
                        ? formatDuree(t.dureeSecondes)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {tentativesFiltrees.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-10 text-center text-text-secondary"
                  >
                    {data && data.tentatives.length === 0
                      ? "Aucun candidat n'a encore passé le test."
                      : "Aucun résultat pour cette recherche."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        {tentativesFiltrees.length} tentative(s) affichée(s)
        {data ? ` sur ${data.tentatives.length} au total` : ""} — seuil
        d&apos;admission : {SEUIL_REQUIS} %.
      </p>
    </main>
  );
}
