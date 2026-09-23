import { ChevronDown, CircleCheck, Clock, ExternalLink, Languages, Lock, Megaphone, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { PhoneMock } from './phone-mock';

interface Field {
  label: string;
  value: string;
  changed?: boolean;
}

/** The Default theme's three fields (themes/default.tsx defaultDefinition). */
const FIELDS: Field[] = [
  { label: 'Mode', value: 'Dark', changed: true },
  { label: 'Color Scheme', value: 'Classic' },
  { label: 'Footer Text', value: 'بسم الله الرحمن الرحيم' },
];

/** The page's tabs, as its phone tab bar draws them; Theme is open. */
const TABS: { icon: LucideIcon; active?: boolean }[] = [
  { icon: Clock },
  { icon: Languages },
  { icon: Palette, active: true },
  { icon: Megaphone },
  { icon: Lock },
];

/**
 * One screen's settings page on a phone, a moment after saving: the Theme tab
 * with its Mode set to Dark, and the toast the page shows once it has saved.
 * Drawn from settings-form.tsx and the Default theme's fields, with the type
 * set larger than life so it reads at the size it hangs on the page.
 */
export function SettingsPhone({ url, className }: { url: string; className?: string }) {
  return (
    <PhoneMock className={className}>
      <div className="absolute inset-0 flex flex-col bg-[#F7F6F2] pt-[12.5cqw] font-sans">
        {/* The browser's address bar: the one screen this page controls. */}
        <div className="bg-background px-[4cqw] pb-[2.4cqw]">
          <div className="flex h-[9.5cqw] items-center gap-[1.6cqw] rounded-full bg-[#ECE9E2] px-[3.6cqw] text-[4.8cqw] text-[#4A463C]">
            <Lock className="size-[3.6cqw] shrink-0" strokeWidth={2.4} />
            <span className="truncate">{url}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-y border-border bg-background px-[4.5cqw] py-[2.6cqw]">
          <Logo size="xs" className="h-auto w-[26cqw]" />
          <span className="flex items-center gap-[1.4cqw] rounded-full border border-border px-[3cqw] py-[1.6cqw] text-[4.6cqw] leading-none font-medium">
            <ExternalLink className="size-[3.6cqw]" />
            View screen
          </span>
        </div>

        <p className="px-[5cqw] pt-[5.5cqw] text-[7cqw] leading-none font-bold">Screen settings</p>

        <div className="mx-[4cqw] mt-[4.5cqw] rounded-[3.4cqw] bg-card px-[4.5cqw] pt-[4.5cqw] pb-[5cqw] shadow-[0_0.3cqw_1cqw_rgba(38,24,10,0.06)]">
          <p className="text-[5.8cqw] leading-none font-medium">Theme</p>
          <div className="mt-[4cqw] space-y-[3.4cqw]">
            {FIELDS.map((field) => (
              <div key={field.label}>
                <p className="text-[4.8cqw] leading-none font-medium">{field.label}</p>
                <div
                  className={cn(
                    'mt-[1.8cqw] flex h-[10cqw] items-center justify-between rounded-[2cqw] border px-[3cqw] text-[5cqw]',
                    field.changed ? 'border-primary ring-[0.8cqw] ring-primary/20' : 'border-border'
                  )}
                >
                  <span className="truncate">{field.value}</span>
                  <ChevronDown className="size-[4.4cqw] shrink-0 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-[4cqw] mt-[3.4cqw] rounded-[3.4cqw] bg-card px-[4.5cqw] py-[4.5cqw] shadow-[0_0.3cqw_1cqw_rgba(38,24,10,0.06)]">
          <p className="text-[5.8cqw] leading-none font-medium">During prayer</p>
          <div className="mt-[3.6cqw] flex items-center justify-between gap-[3cqw]">
            <p className="text-[4.8cqw] leading-tight font-medium">Dark screen while praying</p>
            <span className="relative h-[6cqw] w-[10.5cqw] shrink-0 rounded-full bg-primary">
              <span className="absolute top-[0.6cqw] right-[0.6cqw] size-[4.8cqw] rounded-full bg-white shadow-sm" />
            </span>
          </div>
        </div>

        {/* The toast the page raises once the save has gone through. */}
        <div className="mx-[4cqw] mt-auto mb-[4cqw] flex items-start gap-[2.4cqw] rounded-[3cqw] border border-border bg-card px-[3.6cqw] py-[3.4cqw] shadow-[0_2cqw_5cqw_-2cqw_rgba(38,24,10,0.3)]">
          <CircleCheck className="mt-[0.3cqw] size-[5cqw] shrink-0" />
          <p className="text-[4.8cqw] leading-[1.3] font-medium">Saved. The screen updates in a moment.</p>
        </div>

        <div className="grid grid-cols-5 border-t border-border bg-background pt-[3cqw] pb-[6cqw]">
          {TABS.map(({ icon: Icon, active }, i) => (
            <span key={i} className={cn('flex justify-center', active ? 'text-primary' : 'text-muted-foreground')}>
              <Icon className="size-[6cqw]" />
            </span>
          ))}
        </div>
      </div>
    </PhoneMock>
  );
}
