export function severityTone(severity: number): { fg: string; bg: string; label: string } {
  if (severity >= 4) return { fg: "var(--rose-500)", bg: "var(--rose-50)", label: "Hoog" };
  if (severity === 3) return { fg: "var(--amber-500)", bg: "var(--amber-50)", label: "Midden" };
  return { fg: "var(--moss-700)", bg: "var(--moss-50)", label: "Laag" };
}
