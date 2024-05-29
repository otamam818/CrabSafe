export function match<T extends string, R = void>(
  key: T,
  cases: Record<T, () => R>
): R {
  return cases[key]();
}

export function vmatch<T extends { variant: V }, V extends string, R>(
  v: T,
  cases: { [K in T["variant"]]: (arg: Extract<T, { variant: K }>) => R }
): R {
  const fn = cases[v.variant];
  if (!fn) {
    panic(`Unmatched variant: ${v.variant}`);
  }
  return fn(v as Extract<T, { variant: typeof v.variant }>);
}

export function panic(errorMessage: string): never {
  throw new Error(errorMessage);
}
