'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, ExternalLink, Settings, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import type { Screen, Mosque } from '@/types/database';
import { ScreenPresence } from '@/components/admin/screen-presence';

function generateSlug(mosqueName: string, screenName: string): string {
  const base = `${mosqueName}-${screenName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base;
}

/* ─── TV-frame screen preview ─── */

function ScreenPreview({ screen }: { screen: Screen }) {
  const isPortrait = screen.rotation === 90 || screen.rotation === 270;

  return (
    <div className="w-full">
      {/* TV Frame */}
      <div className="bg-neutral-900 rounded-sm p-1 shadow-2xl">
        <div
          className="relative w-full"
          style={{ aspectRatio: isPortrait ? '9/16' : '16/9' }}
        >
          <iframe
            src={`/display/${screen.slug}?preview=1`}
            title={`Preview: ${screen.name}`}
            className="absolute inset-0 w-full h-full border-0 pointer-events-none"
            style={{
              transform: 'scale(0.4)',
              transformOrigin: '0 0',
              width: '250%',
              height: '250%',
            }}
            scrolling="no"
          />
          {/* Screen overlay effects */}
          <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function MosqueScreensPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const router = useRouter();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [newScreenName, setNewScreenName] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    const [{ data: mosqueData }, { data: screenData }] = await Promise.all([
      supabase.from('mosques').select('*').eq('id', mosqueId).single(),
      supabase.from('screens').select('*').eq('mosque_id', mosqueId).order('created_at'),
    ]);

    if (mosqueData) setMosque(mosqueData);
    if (screenData) setScreens(screenData);
    setLoading(false);
  }, [mosqueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScreenName.trim() || !mosque) return;

    setCreating(true);
    const supabase = createClient();

    const slug = generateSlug(mosque.name, newScreenName);

    const { error } = await supabase.from('screens').insert({
      mosque_id: mosqueId,
      name: newScreenName.trim(),
      slug,
      theme: 'classic',
      theme_config: {},
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Screen created');
      setNewScreenName('');
      setDialogOpen(false);
      loadData();
    }
    setCreating(false);
  };

  const handleDeleteScreen = async (screenId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('screens').delete().eq('id', screenId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Screen deleted');
      loadData();
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Screens</h1>
          <p className="text-muted-foreground">Manage display screens for {mosque?.name}</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Screen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Screen</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateScreen} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen Name</Label>
                <Input
                  id="screenName"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="e.g. Main Hall, Second Floor"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Screen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {screens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No screens yet.</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Screen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {screens.map((screen) => {
            const isPortrait = screen.rotation === 90 || screen.rotation === 270;
            return (
              <Card key={screen.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{screen.name}</CardTitle>
                    <ScreenPresence screenId={screen.id} compact />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/${mosqueId}/screen/${screen.id}`)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this screen?')) {
                          handleDeleteScreen(screen.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* TV Preview area */}
                  <div className="flex items-center justify-center rounded-xl bg-muted/40 py-6 px-4">
                    <ScreenPreview screen={screen} />
                  </div>

                  {/* Info bar */}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span className="capitalize font-medium">{screen.theme}</span>
                    <span className="flex items-center gap-1">
                      {isPortrait ? (
                        <><Smartphone className="w-3 h-3" /> Portrait</>
                      ) : (
                        <><Monitor className="w-3 h-3" /> Landscape</>
                      )}
                    </span>
                    <span className="opacity-60">/display/{screen.slug}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
