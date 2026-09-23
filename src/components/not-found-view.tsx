import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { buttonVariants } from '@/components/ui/button';
import { TvFrame } from '@/components/landing/tv-frame';

/**
 * The 404, for an address that matches nothing and for a screen link whose
 * screen is gone: a set on the wall that is off air, and the two ways on.
 */
export function NotFoundView() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <Link href="/" aria-label="NextNamaz home" className="rounded-md">
          <Logo size="md" />
        </Link>

        <div className="mt-12 w-full max-w-sm" aria-hidden>
          <TvFrame>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1B1C1F] text-white">
              <p className="text-[18cqw] leading-none font-semibold tabular-nums tracking-[-0.05em]">404</p>
              <p className="mt-[2cqw] text-[3.4cqw] tracking-[0.3em] text-white/50 uppercase">Off air</p>
            </div>
          </TvFrame>
        </div>

        <h1 className="mt-12 font-heading text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
          This page isn&apos;t here
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-pretty text-muted-foreground">
          The link may be mistyped or old. If it was a screen&apos;s link, that screen may have been removed. You can set it up again in two minutes.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants({ size: 'lg', className: 'h-12 px-7 text-[15px]' })}>
            Go to the homepage
          </Link>
          <Link href="/s" className={buttonVariants({ size: 'lg', variant: 'outline', className: 'h-12 px-7 text-[15px]' })}>
            Set up a screen
          </Link>
        </div>
      </div>
    </main>
  );
}
