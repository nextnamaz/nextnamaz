'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Trash2, ExternalLink, Settings, Monitor, Smartphone, Copy, Check } from 'lucide-react';
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

/* TV-frame screen preview */

function ScreenPreview({ screen }: { screen: Screen }) {
  const isPortrait = screen.rotation === 90 || screen.rotation === 270;

  return (
    <div className="w-full">
      <div className="bg-neutral-900 rounded-lg p-1.5 shadow-xl">
        <div
          className="relative w-full rounded-sm overflow-hidden"
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
          <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
          <div
            className="absolute inset-0"
            style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)' }}
          />
        </div>
      </div>
      {/* Stand */}
      <div className="mx-auto w-16 h-1.5 bg-neutral-800 rounded-b-full" />
    </div>
  );
}

/* Copy URL button */

function CopyUrlButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `/display/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopied(true);
    toast.success('Display URL copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleCopy();
      }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
    >
      {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {url}
    </button>
  );
}

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading screens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Screens</h1>
          <p className="text-muted-foreground mt-1">
            {screens.length === 0
              ? 'Add display screens for your mosque'
              : `${screens.length} display screen${screens.length !== 1 ? 's' : ''} configured`}
          </p>
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
              <DialogTitle>Add a new screen</DialogTitle>
              <DialogDescription>
                Each screen can have its own theme and display orientation.
              </DialogDescription>
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
                  autoFocus
                />
                {newScreenName.trim() && mosque && (
                  <p className="text-xs text-muted-foreground">
                    URL: <span className="font-mono text-foreground/70">/display/{generateSlug(mosque.name, newScreenName)}</span>
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Screen'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {screens.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No screens yet</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Add a display screen to show prayer times on a TV or monitor in your mosque.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Screen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {screens.map((screen) => {
            const isPortrait = screen.rotation === 90 || screen.rotation === 270;
            return (
              <div
                key={screen.id}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-200"
              >
                {/* Card header */}
                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{screen.name}</h3>
                    <ScreenPresence screenId={screen.id} compact />
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => router.push(`/admin/${mosqueId}/screen/${screen.id}`)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        if (confirm('Delete this screen?')) {
                          handleDeleteScreen(screen.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* TV Preview */}
                <div className="px-5 pb-3">
                  <div className="rounded-lg bg-muted/30 p-5 flex items-center justify-center">
                    <ScreenPreview screen={screen} />
                  </div>
                </div>

                {/* Info footer */}
                <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 bg-background px-2.5 py-1 rounded-md capitalize border border-border/50">
                      {screen.theme}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isPortrait ? (
                        <><Smartphone className="w-3.5 h-3.5" /> Portrait</>
                      ) : (
                        <><Monitor className="w-3.5 h-3.5" /> Landscape</>
                      )}
                    </span>
                  </div>
                  <CopyUrlButton slug={screen.slug} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
