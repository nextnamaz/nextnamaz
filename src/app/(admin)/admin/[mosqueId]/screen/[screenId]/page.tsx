'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Screen } from '@/types/database';

const THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional green and gold',
    preview: 'bg-gradient-to-br from-emerald-800 to-emerald-950',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimal dark theme',
    preview: 'bg-gradient-to-br from-slate-800 to-slate-950',
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Bright, high-contrast',
    preview: 'bg-gradient-to-br from-white to-gray-100 border-2',
  },
  {
    id: 'ramadan',
    name: 'Ramadan',
    description: 'Special Ramadan theme',
    preview: 'bg-gradient-to-br from-purple-800 to-indigo-950',
  },
];

export default function ScreenEditorPage() {
  const { mosqueId, screenId } = useParams<{ mosqueId: string; screenId: string }>();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadScreen = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('screens')
      .select('*')
      .eq('id', screenId)
      .single();

    if (error) {
      toast.error('Failed to load screen');
      setLoading(false);
      return;
    }

    if (data) {
      setScreen(data);
      setSelectedTheme(data.theme);
    }
    setLoading(false);
  }, [screenId]);

  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  const handleSave = async () => {
    if (!screen) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('screens')
      .update({ theme: selectedTheme })
      .eq('id', screenId);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Theme saved');
      setScreen({ ...screen, theme: selectedTheme });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!screen) {
    return <div className="text-gray-500">Screen not found</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/${mosqueId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{screen.name}</h1>
          <p className="text-gray-600">Configure this screen&apos;s theme</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose how this screen looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={cn(
                  'rounded-lg p-3 text-left transition-all border-2',
                  selectedTheme === theme.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-transparent hover:border-gray-200'
                )}
              >
                <div className={cn('w-full h-16 rounded-md mb-2', theme.preview)} />
                <div className="font-medium text-sm">{theme.name}</div>
                <div className="text-xs text-gray-500">{theme.description}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preview</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Full Screen
            </a>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full bg-gray-900 overflow-hidden rounded-b-lg" style={{ height: '400px' }}>
            <iframe
              src={`/display/${screen.slug}?theme=${selectedTheme}`}
              className="absolute top-0 left-0 border-0 pointer-events-none"
              style={{
                width: '1920px',
                height: '1080px',
                transform: 'scale(0.42)',
                transformOrigin: 'top left',
              }}
              title="Screen preview"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Theme'}
      </Button>
    </div>
  );
}
