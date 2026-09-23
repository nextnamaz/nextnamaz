import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  DEFAULT_LANDING_LOCALE,
  LANDING_LOCALE_COOKIE,
  detectLandingLocale,
  isLandingLocale,
  landingPath,
} from '@/lib/landing-locales';
import type { LandingLocale } from '@/lib/landing-locales';

/**
 * Sends a first visit to the homepage in the visitor's language.
 *
 * Only the homepage is translated, so only / is ever redirected; the locale
 * pages themselves (/sv, /bs ...) are always served as asked. The order:
 *
 * 1. ?hl=xx is a choice made in the language picker: remember it and go there.
 * 2. A remembered choice wins over everything else, English included.
 * 3. Crawlers stay put, so each language is indexed at its own address.
 * 4. The browser's languages, in order of preference.
 * 5. The country the request comes from (Vercel's geo header).
 * 6. English.
 */

const CRAWLER = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|lighthouse/i;

function redirectTo(request: NextRequest, locale: LandingLocale): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = landingPath(locale);
  url.search = '';
  return NextResponse.redirect(url, 307);
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const picked = searchParams.get('hl');
  if (picked && isLandingLocale(picked)) {
    const response = redirectTo(request, picked);
    response.cookies.set(LANDING_LOCALE_COOKIE, picked, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return response;
  }

  // /en is not a page: English is the homepage itself.
  if (pathname === '/en') return redirectTo(request, DEFAULT_LANDING_LOCALE);
  if (pathname !== '/') return NextResponse.next();

  const remembered = request.cookies.get(LANDING_LOCALE_COOKIE)?.value;
  if (remembered && isLandingLocale(remembered)) {
    return remembered === DEFAULT_LANDING_LOCALE ? NextResponse.next() : redirectTo(request, remembered);
  }

  if (CRAWLER.test(request.headers.get('user-agent') ?? '')) return NextResponse.next();

  const locale = detectLandingLocale(request.headers.get('accept-language'), request.headers.get('x-vercel-ip-country'));
  return locale !== DEFAULT_LANDING_LOCALE ? redirectTo(request, locale) : NextResponse.next();
}

export const config = {
  // The homepage in each language, and the /en alias. Nothing else runs through here.
  matcher: ['/', '/en', '/sv', '/bs', '/de', '/ar', '/tr'],
};
