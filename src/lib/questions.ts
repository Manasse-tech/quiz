export type Option = {
  id: string;
  texte: string;
};

export type Question = {
  id: string;
  domaine: string;
  enonce: string;
  options: Option[];
  correctOptionId: string;
};

export type DomaineMeta = {
  nom: string;
  recommandations: string[];
  competencesAmeliorer: string[];
};

export const DOMAINES: DomaineMeta[] = [
  {
    nom: "Fondamentaux de la cybersécurité",
    recommandations: [
      "Reprenez les bases : mots de passe forts, authentification à deux facteurs et chiffrement.",
      "Apprenez à reconnaître les principales menaces (phishing, malwares, ransomwares).",
    ],
    competencesAmeliorer: [
      "Gestion des mots de passe",
      "Authentification multifacteur (MFA)",
      "Chiffrement des données",
      "Rôle d'un pare-feu",
    ],
  },
  {
    nom: "Menaces et bonnes pratiques",
    recommandations: [
      "Étudiez les techniques d'ingénierie sociale et apprenez à détecter les messages frauduleux.",
      "Appliquez les réflexes de sécurité : mises à jour, sauvegardes et vigilance au quotidien.",
    ],
    competencesAmeliorer: [
      "Détection du phishing",
      "Ingénierie sociale",
      "Mises à jour de sécurité",
      "Sauvegardes et restauration",
    ],
  },
];

export const QUESTIONS: Question[] = [
  // ── Fondamentaux de la cybersécurité (5) ─────────────────────────
  {
    id: "c1",
    domaine: "Fondamentaux de la cybersécurité",
    enonce:
      "Quelles caractéristiques définissent un mot de passe réellement solide ?",
    options: [
      { id: "c1o1", texte: "Long, mêlant majuscules, chiffres et caractères spéciaux, et unique pour chaque compte" },
      { id: "c1o2", texte: "Court pour être mémorisable facilement, comme « 1234 »" },
      { id: "c1o3", texte: "Identique sur tous ses comptes pour ne pas l'oublier" },
      { id: "c1o4", texte: "Composé de son prénom et de sa date de naissance" },
    ],
    correctOptionId: "c1o1",
  },
  {
    id: "c2",
    domaine: "Fondamentaux de la cybersécurité",
    enonce: "Que signifie l'authentification à deux facteurs (2FA) ?",
    options: [
      { id: "c2o1", texte: "Saisir deux fois le même mot de passe pour éviter les fautes de frappe" },
      { id: "c2o2", texte: "Combiner deux preuves d'identité distinctes, par exemple un mot de passe et un code reçu sur téléphone" },
      { id: "c2o3", texte: "Se connecter depuis deux appareils différents" },
      { id: "c2o4", texte: "Créer deux comptes utilisateur séparés" },
    ],
    correctOptionId: "c2o2",
  },
  {
    id: "c3",
    domaine: "Fondamentaux de la cybersécurité",
    enonce: "Quel est le rôle principal d'un pare-feu (firewall) ?",
    options: [
      { id: "c3o1", texte: "Filtrer le trafic réseau entrant et sortant selon des règles de sécurité" },
      { id: "c3o2", texte: "Supprimer automatiquement les virus déjà présents sur le disque dur" },
      { id: "c3o3", texte: "Accélérer la connexion Internet de l'utilisateur" },
      { id: "c3o4", texte: "Stocker les mots de passe de manière sécurisée" },
    ],
    correctOptionId: "c3o1",
  },
  {
    id: "c4",
    domaine: "Fondamentaux de la cybersécurité",
    enonce: "Que permet le chiffrement d'une donnée ?",
    options: [
      { id: "c4o1", texte: "De la compresser pour qu'elle prenne moins de place" },
      { id: "c4o2", texte: "De la rendre illisible pour quiconque ne possède pas la clé de déchiffrement" },
      { id: "c4o3", texte: "De l'envoyer plus rapidement sur le réseau" },
      { id: "c4o4", texte: "De la protéger contre la suppression accidentelle" },
    ],
    correctOptionId: "c4o2",
  },
  {
    id: "c5",
    domaine: "Fondamentaux de la cybersécurité",
    enonce: "Parmi ces comptes, lequel présente le risque de cybersécurité le plus faible ?",
    options: [
      { id: "c5o1", texte: "motdepasse123 utilisé sur tous les sites" },
      { id: "c5o2", texte: "admin / admin sur la box Internet de la maison" },
      { id: "c5o3", texte: "Un gestionnaire de mots de passe générant un mot de passe unique et complexe par compte" },
      { id: "c5o4", texte: "Le prénom du chien suivi de « 2024 »" },
    ],
    correctOptionId: "c5o3",
  },

  // ── Menaces et bonnes pratiques (5) ──────────────────────────────
  {
    id: "c6",
    domaine: "Menaces et bonnes pratiques",
    enonce: "Comment reconnaître une tentative de phishing dans un e-mail ?",
    options: [
      { id: "c6o1", texte: "L'expéditeur est inconnu, l'urgence est artificielle et le message pousse à cliquer sur un lien ou fournir des informations sensibles" },
      { id: "c6o2", texte: "L'e-mail contient au moins une faute d'orthographe, toujours" },
      { id: "c6o3", texte: "L'e-mail arrive le week-end, moment préféré des pirates" },
      { id: "c6o4", texte: "L'e-mail est rédigé en langue étrangère" },
    ],
    correctOptionId: "c6o1",
  },
  {
    id: "c7",
    domaine: "Menaces et bonnes pratiques",
    enonce: "Qu'est-ce qu'un ransomware ?",
    options: [
      { id: "c7o1", texte: "Un logiciel publicitaire qui ralentit le navigateur" },
      { id: "c7o2", texte: "Un programme malveillant qui chiffre les données de la victime et exige une rançon pour les restituer" },
      { id: "c7o3", texte: "Un outil officiel de sauvegarde proposé par les fournisseurs d'accès" },
      { id: "c7o4", texte: "Un virus qui se contente d'afficher des messages d'humour" },
    ],
    correctOptionId: "c7o2",
  },
  {
    id: "c8",
    domaine: "Menaces et bonnes pratiques",
    enonce: "Que désigne l'ingénierie sociale en cybersécurité ?",
    options: [
      { id: "c8o1", texte: "La manipulation psychologique d'une personne pour lui soutirer des informations ou un accès" },
      { id: "c8o2", texte: "La conception de réseaux informatiques pour les grandes entreprises" },
      { id: "c8o3", texte: "L'étude des réseaux sociaux à des fins marketing" },
      { id: "c8o4", texte: "La formation des ingénieurs en informatique" },
    ],
    correctOptionId: "c8o1",
  },
  {
    id: "c9",
    domaine: "Menaces et bonnes pratiques",
    enonce: "Pourquoi installer régulièrement les mises à jour de sécurité est-il essentiel ?",
    options: [
      { id: "c9o1", texte: "Pour bénéficier des nouvelles polices d'écriture" },
      { id: "c9o2", texte: "Parce qu'elles corrigent des vulnérabilités connues que des attaquants pourraient exploiter" },
      { id: "c9o3", texte: "Pour augmenter la capacité de stockage du disque dur" },
      { id: "c9o4", texte: "Pour changer l'adresse IP de la machine automatiquement" },
    ],
    correctOptionId: "c9o2",
  },
  {
    id: "c10",
    domaine: "Menaces et bonnes pratiques",
    enonce: "Vous recevez un e-mail de votre « banque » vous demandant de confirmer vos identifiants en urgence. Que faites-vous ?",
    options: [
      { id: "c10o1", texte: "Je réponds rapidement avec mes identifiants pour éviter le blocage de mon compte" },
      { id: "c10o2", texte: "Je clique sur le lien pour vérifier si le site est authentique avant de saisir quoi que ce soit" },
      { id: "c10o3", texte: "Je ne clique sur rien et je contacte directement ma banque via son application ou son numéro officiel" },
      { id: "c10o4", texte: "Je transfère l'e-mail à tous mes proches pour les prévenir" },
    ],
    correctOptionId: "c10o3",
  },
];

export function questionsForClient() {
  return QUESTIONS.map((q) => ({
    id: q.id,
    domaine: q.domaine,
    enonce: q.enonce,
    options: q.options.map((o) => ({ id: o.id, texte: o.texte })),
  }));
}
