'use client';

import { Button } from '@/components/ui/button';

interface SaveBarProps {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

/** Floating action bar shown while there are unsaved changes. */
export function SaveBar({ visible, saving, onSave, onDiscard }: SaveBarProps) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-full bg-background/90 backdrop-blur-xl border shadow-2xl p-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-4"
          onClick={onDiscard}
          disabled={saving}
        >
          Discard
        </Button>
        <Button
          size="sm"
          className="rounded-full px-6"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
