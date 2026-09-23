'use client';

import { useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { X } from 'lucide-react';
import { sendFeedback } from '@/lib/feedback';
import type { LandingCopy } from '@/lib/landing-copy';

type Status = 'idle' | 'sending' | 'sent' | 'error';

interface FeedbackButtonProps {
  t: LandingCopy['footer']['feedback'];
  locale: string;
  /** Set on a screen's settings page, so a report can be matched to its screen. */
  screenId?: string;
  className?: string;
  /** The trigger's content; defaults to t.button. */
  children?: ReactNode;
}

const field =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-[15px] outline-none focus-visible:border-foreground';

/** A button that opens a small form; what is sent is stored for the owner to read on /admin. */
export function FeedbackButton({ t, locale, screenId, className, children }: FeedbackButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? '');
    setStatus('sending');
    const result = await sendFeedback({
      message: text('message'),
      email: text('email'),
      website: text('website'),
      page: window.location.pathname.replace(/[0-9a-f-]{36}/i, ':id'),
      locale,
      screenId: screenId ?? null,
    });
    setStatus(result.ok ? 'sent' : 'error');
  }

  function open() {
    setStatus((s) => (s === 'sent' ? 'idle' : s));
    dialogRef.current?.showModal();
  }

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children ?? t.button}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-heading"
        // Click on the backdrop closes it.
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="feedback-heading" className="font-heading text-xl font-semibold tracking-tight">
              {t.heading}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={t.close}
              className="-m-1.5 rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {status === 'sent' ? (
            <p role="status" className="mt-4 text-[15px]">
              {t.sent}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-2 space-y-4">
              <p className="text-[15px] text-muted-foreground">{t.intro}</p>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t.message}</span>
                <textarea name="message" required minLength={3} maxLength={4000} rows={5} className={field} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">{t.email}</span>
                <input name="email" type="email" maxLength={200} autoComplete="email" className={field} />
              </label>
              {/* A trap for bots: people never see it, so it stays empty. */}
              <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              {status === 'error' && (
                <p role="alert" className="text-sm text-red-700">
                  {t.error}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
              >
                {status === 'sending' ? t.sending : t.send}
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
