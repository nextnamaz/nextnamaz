import { ArrowUpRight, Github } from 'lucide-react';
import type { LandingCopy } from '@/lib/landing-copy';
import { Reveal } from './reveal';

/**
 * Questions, on native <details>: keyboard and screen-reader support come
 * free, and the answers open without JavaScript. The plus turns into a minus
 * from the [open] state alone, and where the browser can animate to `auto`
 * the answer slides open and shut (see SLIDE); elsewhere it simply opens.
 *
 * Source order is heading, questions, open-source note: the phone layout, and
 * the order a keyboard or screen reader meets them. On wide screens the note
 * is placed back into the left column, in the grid's second row, and stays
 * pinned while the questions scroll past.
 */
interface FaqProps {
  t: LandingCopy['faq'];
  oss: LandingCopy['openSource'];
}

/**
 * The answer's box eases between closed and its own height, and the words
 * settle in as it opens. CSS only: ::details-content is the part <details>
 * hides, and interpolate-size lets its height run to `auto`. A browser
 * without either skips the rule and opens the answer at once.
 */
const SLIDE = `
@media (prefers-reduced-motion: no-preference) {
  .faq-item { interpolate-size: allow-keywords; }
  .faq-item::details-content {
    block-size: 0;
    overflow-y: clip;
    transition: block-size 380ms cubic-bezier(0.32, 0.72, 0, 1), content-visibility 380ms allow-discrete;
  }
  .faq-item[open]::details-content { block-size: auto; }
  .faq-answer { opacity: 0; translate: 0 -4px; transition: opacity 240ms ease-out, translate 380ms cubic-bezier(0.32, 0.72, 0, 1); }
  .faq-item[open] .faq-answer { opacity: 1; translate: 0 0; transition-delay: 60ms; }
  @starting-style { .faq-item[open] .faq-answer { opacity: 0; translate: 0 -4px; } }
}
`;

export function Faq({ t, oss }: FaqProps) {

  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-border px-6 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <Reveal className="lg:col-span-4 lg:row-start-1">
          <h2 id="faq-title" className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] text-balance sm:text-[2.5rem]">
            {t.title}
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-10 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:mt-0">
          <style>{SLIDE}</style>
          <div className="border-t border-border">
            {t.items.map(({ q, a }, i) => (
              <details key={q} open={i === 0} className="faq-item group border-b border-border">
                <summary className="-mx-3 flex cursor-pointer list-none items-start justify-between gap-6 rounded-lg px-3 py-5 text-[17px] leading-snug font-semibold tracking-[-0.01em] text-foreground outline-none transition-colors hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
                  <span className="text-balance">{q}</span>
                  <span aria-hidden className="relative mt-[3px] size-4 shrink-0 text-muted-foreground group-open:text-foreground">
                    <span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute top-0 left-1/2 h-4 w-[1.5px] -translate-x-1/2 rounded-full bg-current motion-safe:transition-transform motion-safe:duration-200 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="faq-answer max-w-[62ch] pe-10 pb-6 text-[15px] leading-relaxed text-pretty text-muted-foreground sm:text-base">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>

        <Reveal
          delay={120}
          className="mt-16 lg:sticky lg:top-28 lg:col-span-4 lg:row-start-2 lg:mt-12 lg:self-start lg:border-t lg:border-border lg:pt-8"
        >
          <h3 className="font-heading text-[20px] font-semibold leading-tight tracking-[-0.02em] text-balance">{oss.title}</h3>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-pretty text-muted-foreground">{oss.body}</p>
          <a
            href={oss.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex items-center gap-2 rounded-sm text-[15px] font-semibold text-foreground outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            <Github aria-hidden className="size-[18px]" strokeWidth={1.75} />
            <span className="underline decoration-border decoration-1 underline-offset-[6px] transition-colors group-hover:decoration-primary">
              {oss.link.label}
            </span>
            <ArrowUpRight
              aria-hidden
              className="size-4 text-muted-foreground transition-transform rtl:-scale-x-100 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 rtl:motion-safe:group-hover:-translate-x-0.5"
            />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
