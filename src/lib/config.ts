export const SITE_NAME = "HARKSTUDENT";

export const FORMATION_TITLE =
  "Initiation au Pentest Web avec l'Intelligence Artificielle";

export const DUREE_MINUTES = 10;

export const QUESTIONS_COUNT = 10;

export const SEUIL_REQUIS = 60;

export const WHATSAPP_LINK =
  "https://chat.whatsapp.com/CJpFKNJ6mgO2OqMBgOJqbu?s=cl&p=a&iam=2";

export function appreciation(pourcentage: number): string {
  if (pourcentage >= 85) return "Expert — excellent niveau théorique";
  if (pourcentage >= 70) return "Confirmé — solides connaissances";
  if (pourcentage >= 50) return "Intermédiaire — bases à consolider";
  return "Débutant — bases à acquérir";
}
