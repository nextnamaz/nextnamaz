'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
  prayerTime: string;
  prayerName: string;
  className?: string;
}

function getTimeUntil(prayerTime: string) {
  const now = new Date();
  const [h, m] = prayerTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  if (target <= now) target.setDate(target.getDate() + 1);

  const diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  return {
    hours: Math.floor(diff / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
}

export function Countdown({ prayerTime, prayerName, className = '' }: CountdownProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => setCountdown(getTimeUntil(prayerTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [prayerTime]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={className}>
      {prayerName && <div className="text-sm opacity-70 mb-1">Next: {prayerName}</div>}
      <div className="font-mono text-3xl font-bold">
        {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
      </div>
    </div>
  );
}
