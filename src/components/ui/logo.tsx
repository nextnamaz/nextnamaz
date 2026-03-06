import Image from 'next/image';

type LogoVariant = 'full' | 'round';
type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const fullSizes: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 88, height: 36 },
  sm: { width: 118, height: 48 },
  md: { width: 147, height: 60 },
  lg: { width: 196, height: 80 },
  xl: { width: 294, height: 120 },
};

const roundSizes: Record<LogoSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

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
        priority
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
      priority
    />
  );
}
