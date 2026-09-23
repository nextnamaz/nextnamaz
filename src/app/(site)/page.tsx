import { LandingPage, landingMetadata } from '@/components/landing/landing-page';

export const metadata = landingMetadata('en');

export default function HomePage() {
  return <LandingPage locale="en" />;
}
