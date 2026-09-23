import Image from 'next/image';

type LogoVariant = 'full' | 'round';
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

// Kept at logo.svg's 405:70 aspect, so the box reserved before load is the one it paints into.
const fullSizes: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 88, height: 15 },
  sm: { width: 116, height: 20 },
  md: { width: 147, height: 25 },
  lg: { width: 196, height: 34 },
  xl: { width: 294, height: 51 },
};

const roundSizes: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

// Eager rather than preloaded: it tops most pages, and every copy shares one URL, so one fetch.
export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  if (variant === 'round') {
    const dim = roundSizes[size];
    return (
      <Image
        src="/round.svg"
        alt="NextNamaz"
        width={dim}
        height={dim}
        className={className}
        loading="eager"
      />
    );
  }

  const { width, height } = fullSizes[size];
  return (
    <Image
      src="/logo.svg"
      alt="NextNamaz"
      width={width}
      height={height}
      className={className}
      loading="eager"
    />
  );
}
