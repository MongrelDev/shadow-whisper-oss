type SearchParamValue = string | string[] | undefined;

export type SearchParams = Record<string, SearchParamValue>;

export function firstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function compactParam(value: SearchParamValue): string | undefined {
  const first = firstParam(value)?.trim();
  return first ? first : undefined;
}
