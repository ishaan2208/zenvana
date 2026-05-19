interface FormatGuestNameOptions {
  useFirstName?: boolean;
  withHonorific?: boolean;
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatGuestName(
  rawName?: string | null,
  options: FormatGuestNameOptions = {}
): string | null {
  const { useFirstName = false, withHonorific = true } = options;
  const cleaned = rawName?.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;

  const baseName = useFirstName ? cleaned.split(" ")[0] : cleaned;
  const titleCased = toTitleCase(baseName);
  if (!withHonorific) return titleCased;

  if (/\bji$/i.test(titleCased)) return titleCased;
  return `${titleCased} ji`;
}
