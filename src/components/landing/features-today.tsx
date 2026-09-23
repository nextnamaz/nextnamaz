'use client';

import { useSyncExternalStore } from 'react';
import { formatDisplayDate } from '@/lib/display-locale';
import { PREVIEW_LOCALE } from '@/lib/theme-preview';

const noSubscribe = () => () => {};
const today = () => formatDisplayDate(new Date(), PREVIEW_LOCALE);
/** Same line height as a date, so the header does not move when it fills in. */
const onServer = () => ' ';

/** Today's date as the boards print it, the same date the hero's live screen shows. */
export function FeaturesToday() {
  return useSyncExternalStore(noSubscribe, today, onServer);
}
