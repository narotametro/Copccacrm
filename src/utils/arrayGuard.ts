/**
 * Utility to ensure values are always arrays
 * Helps prevent ".map is not a function" errors
 */

export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

export function safeMap<T, R>(
  value: T | T[] | null | undefined,
  callback: (item: T, index: number, array: T[]) => R
): R[] {
  const arr = ensureArray(value);
  return arr.map(callback);
}

export function safeFilter<T>(
  value: T | T[] | null | undefined,
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  const arr = ensureArray(value);
  return arr.filter(predicate);
}
