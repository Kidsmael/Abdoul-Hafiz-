export function formatXOF(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "0 FCFA";
  return (
    new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(value)) + " FCFA"
  );
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  // FIX : les chaînes "YYYY-MM-DD" sont parsées en UTC par new Date(),
  // ce qui peut afficher J-1 selon le fuseau. On parse manuellement.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(y, m - 1, d));
  }
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Génère un numéro de document basé sur l'horodatage en millisecondes
 * pour éviter les collisions (pas de random, séquence naturelle par temps).
 */
export function genDocNumber(prefix: "DEV" | "FAC"): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  // Suffixe = secondes depuis minuit → 5 chiffres uniques dans la journée
  const sec = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  return `${prefix}-${y}${m}-${String(sec).padStart(5, "0")}`;
}
