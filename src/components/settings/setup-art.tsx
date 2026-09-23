import { Calculator } from 'lucide-react';
import type { WizardSource } from '@/lib/prayer-sources/match';

/** The pin's ripple and drop, and the lock's shackle closing. Still under reduced motion. */
const MOTION = `
@media (prefers-reduced-motion: no-preference) {
  .sa-ripple { animation: sa-ripple 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite; transform-box: fill-box; transform-origin: center; }
  .sa-ripple-2 { animation-delay: 1.2s; }
  .sa-drop { animation: sa-drop 900ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both; }
  .sa-shackle { animation: sa-shackle 900ms cubic-bezier(0.34, 1.56, 0.64, 1) 500ms both; }
}
@keyframes sa-ripple { from { transform: scale(0.3); opacity: 0.7; } to { transform: scale(2.4); opacity: 0; } }
@keyframes sa-drop { from { transform: translateY(-14px); opacity: 0; } }
@keyframes sa-shackle { from { transform: translateY(-7px); } }
`;

/** A TV showing its code, a phone scanning it, and a padlock closing between them: the PIN's job. */
export function PinArt() {
  return (
    <div className="relative h-40 overflow-hidden rounded-3xl border border-border bg-linear-to-b from-[#FBFAF7] to-[#F1ECE3]">
      <style>{MOTION}</style>
      <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" aria-hidden>
        {/* The TV and its code. */}
        <rect x="46" y="36" width="130" height="78" rx="4" fill="#111113" />
        <rect x="50" y="40" width="122" height="70" rx="2" fill="#FFFFFF" />
        <g fill="#111113">
          <rect x="95" y="52" width="32" height="32" rx="2" fill="none" stroke="#111113" strokeWidth="3" />
          <rect x="101" y="58" width="8" height="8" />
          <rect x="113" y="58" width="8" height="8" />
          <rect x="101" y="70" width="8" height="8" />
          <rect x="115" y="72" width="4" height="4" />
        </g>
        <rect x="80" y="92" width="62" height="4" rx="2" fill="#D9D4CA" />
        {/* The phone. */}
        <rect x="262" y="30" width="62" height="112" rx="12" fill="#111113" />
        <rect x="266" y="36" width="54" height="100" rx="8" fill="#F6F5F1" />
        <rect x="276" y="52" width="34" height="5" rx="2.5" fill="#1F1A12" />
        <rect x="276" y="62" width="26" height="4" rx="2" fill="#C9C2B4" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={280 + i * 9} cy="84" r="3" fill="#1F1A12" />
        ))}
        <rect x="276" y="104" width="34" height="12" rx="6" fill="#E8A817" />
        {/* The dotted way between them, and the lock on it. */}
        <path d="M180 76 H258" stroke="#C9B894" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
        <g transform="translate(219 78)">
          <circle r="22" fill="#FFFFFF" stroke="#EADFC8" strokeWidth="2" />
          <path className="sa-shackle" d="M-7 -2 V-8 A7 7 0 0 1 7 -8 V-2" fill="none" stroke="#8A6206" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="-11" y="-3" width="22" height="16" rx="3.5" fill="#E8A817" />
          <circle cx="0" cy="4" r="2.2" fill="#8A6206" />
        </g>
      </svg>
    </div>
  );
}

const LOGOS: Partial<Record<WizardSource, string>> = {
  vaktija_ba: '/sources/vaktija-ba.png',
  vaktija_eu: '/sources/vaktija-eu.png',
  aladhan: '/sources/aladhan.png',
  islamiska_forbundet: '/sources/islamiska-forbundet.png',
};

/** Each source's own mark, so it is recognised at a glance; a calculator for the calculated times. */
export function SourceLogo({ source }: { source: WizardSource }) {
  const src = LOGOS[source];
  const box = 'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white';
  if (src) {
    return (
      <span className={box}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a 44px mark; next/image adds nothing here. */}
        <img src={src} alt="" className="size-8 object-contain" />
      </span>
    );
  }
  return (
    <span className={`${box} bg-secondary text-foreground/70`} aria-hidden>
      <Calculator className="size-5" />
    </span>
  );
}
