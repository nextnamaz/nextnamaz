import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, kept live. The server has no screen, so
 * each caller says what to assume there (`null` for "not known yet").
 */
export function useMediaQuery<S extends boolean | null>(query: string, serverValue: S): boolean | S {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query]
  );
  return useSyncExternalStore<boolean | S>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}
