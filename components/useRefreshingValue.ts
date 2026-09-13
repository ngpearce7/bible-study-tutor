import { useEffect, useState } from "react";

/** Preserve loaded data during refreshes, but never across profile/scope changes. */
export function useRefreshingValue<T>(scope: string | null, value: T | undefined): T | undefined {
  const [loaded, setLoaded] = useState<{ scope: string | null; value: T | undefined }>({ scope, value });
  useEffect(() => {
    setLoaded(previous => {
      if (scope === null) return { scope: null, value: undefined };
      if (value !== undefined) return { scope, value };
      return previous.scope === scope ? previous : { scope, value: undefined };
    });
  }, [scope, value]);
  if (scope === null) return undefined;
  return value !== undefined ? value : loaded.scope === scope ? loaded.value : undefined;
}
