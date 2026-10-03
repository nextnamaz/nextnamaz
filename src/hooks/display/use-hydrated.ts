import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};

/**
 * False on the server and while hydrating, true from the first client render.
 *
 * The server renders in its own time zone, and React keeps a hydrated text or
 * attribute as the server wrote it until it next changes: a TV loaded just
 * after local midnight from a UTC server would show yesterday's date all day.
 * A theme renders nothing it reads off the clock until this is true.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}
