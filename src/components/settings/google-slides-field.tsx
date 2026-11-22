'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { addGoogleSlides } from '@/lib/actions';
import type { SlideItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoogleSlidesFieldProps {
  screenId: string;
  onAdd: (item: SlideItem) => void;
}

/** Paste a published Google Slides link; each slide then shows like a photo. */
export function GoogleSlidesField({ screenId, onAdd }: GoogleSlidesFieldProps) {
  const [link, setLink] = useState('');
  const [checking, setChecking] = useState(false);

  const add = async () => {
    setChecking(true);
    const result = await addGoogleSlides(screenId, link);
    setChecking(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onAdd(result.item);
    setLink('');
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="google-slides">Google Slides</Label>
      <div className="flex gap-2">
        <Input
          id="google-slides"
          // Text, not url: the old embed code (<iframe …>) is accepted too.
          type="text"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://docs.google.com/presentation/d/e/…"
          className="min-w-0 flex-1"
        />
        <Button type="button" variant="outline" onClick={() => void add()} disabled={checking || link.trim() === ''}>
          {checking ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        In Google Slides, choose File → Share → Publish to web and paste the link. Each slide
        shows like a photo, and changes you make in Google appear on the TV by themselves.
      </p>
    </div>
  );
}
