import { timingSafeEqual } from "crypto";

/**
 * Code d'accès à l'espace administrateur.
 * Modifiable via la variable d'environnement ADMIN_CODE (fichier .env).
 */
const ADMIN_CODE = process.env.ADMIN_CODE ?? "HARK2026";

/**
 * Vérifie le code administrateur en temps constant
 * (évite les attaques temporelles).
 */
export function verifyAdminCode(
  provided: string | null | undefined
): boolean {
  if (!provided) return false;
  const expected = Buffer.from(ADMIN_CODE, "utf8");
  const received = Buffer.from(provided, "utf8");
  if (expected.length !== received.length) {
    // Comparaison factice pour garder un temps de réponse constant
    timingSafeEqual(expected, expected);
    return false;
  }
  return timingSafeEqual(expected, received);
}
