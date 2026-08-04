/**
 * Normalizes an ID to a number for safe comparison.
 * Backend always returns IDs as numbers, but frontend sources
 * (URL params via useParams(), form inputs, some client state)
 * often produce strings — direct === comparison then silently
 * fails even when the values represent the same ID.
 */
export const normalizeId = (id) => {
  if (id === null || id === undefined || id === '') return null;
  const num = Number(id);
  return Number.isNaN(num) ? null : num;
};

/**
 * Safely compares two IDs regardless of whether either is a
 * string or number. Use this instead of === wherever an ID from
 * one source (API response) might be compared to an ID from
 * another source (URL param, form input, local state).
 */
export const idsMatch = (a, b) => {
  const normA = normalizeId(a);
  const normB = normalizeId(b);
  return normA !== null && normA === normB;
};
