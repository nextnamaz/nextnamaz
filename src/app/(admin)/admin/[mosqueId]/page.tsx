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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Monitor, 
  Smartphone, 
  Copy, 
  Check, 
  MoreVertical,
  Laptop,
  Tv
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <div className="relative w-full overflow-hidden rounded-md border bg-neutral-950 shadow-sm aspect-video group">
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      >
        <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-4 rounded-xl backdrop-blur-sm text-white">
            <ExternalLink className="w-6 h-6" />
            <span className="text-xs font-medium">Open Preview</span>
        </div>
      </div>
      
      <div
        className="relative w-full h-full"
      >
        <iframe
          src={`/display/${screen.slug}?preview=1`}
          title={`Preview: ${screen.name}`}
          className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-90 transition-opacity hover:opacity-100"
          style={{
            transform: isPortrait ? 'scale(0.5) rotate(-90deg)' : 'scale(0.5)',
            transformOrigin: 'top left',
            width: '200%',
            height: '200%',
            // For portrait, we need to adjust the position after rotation if needed, 
            // but simple scaling is often enough for a quick preview.
            // Actually, for portrait in a landscape container, we might want to center it.
             ...(isPortrait ? {
                width: '200vh', 
                height: '200vw',
                transform: 'rotate(-90deg) translateX(-100%) scale(0.5)', 
                transformOrigin: 'top left' 
             } : {})
          }}
          scrolling="no"
        />
      </div>
      
      {/* Overlay to catch clicks and redirect if needed */ }
      <a 
        href={`/display/${screen.slug}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute inset-0 z-20 cursor-pointer"
        aria-label="Open display"
      />
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
    <Button
      variant="outline"
      size="sm"
      className="h-8 gap-2 text-xs font-mono bg-muted/50 hover:bg-muted"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleCopy();
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="truncate max-w-[150px]">{url}</span>
    </Button>
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
      toast.success('Screen created successfully');
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading displays...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Screens</h1>
          <p className="text-muted-foreground mt-1">
            Manage your digital signage displays and prayer time screens.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm">
              <Plus className="w-5 h-5 mr-2" />
              Add New Screen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Screen</DialogTitle>
              <DialogDescription>
                Create a new digital signage screen for your mosque.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateScreen} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen Name</Label>
                <Input
                  id="screenName"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="e.g. Main Hall TV, Ladies Section"
                  className="col-span-3"
                  autoFocus
                />
                {newScreenName.trim() && mosque && (
                  <p className="text-[11px] text-muted-foreground bg-muted/50 p-2 rounded border">
                    Public URL: <span className="font-mono select-all">/display/{generateSlug(mosque.name, newScreenName)}</span>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
                <Button type="submit" disabled={creating || !newScreenName.trim()}>
                  {creating ? 'Creating...' : 'Create Screen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {screens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-card/30">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Monitor className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No screens configured</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            You haven't set up any display screens yet. Add your first screen to start displaying prayer times on your TVs.
          </p>
          <Button onClick={() => setDialogOpen(true)} variant="secondary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create First Screen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {screens.map((screen) => {
            const isPortrait = screen.rotation === 90 || screen.rotation === 270;
            return (
              <Card key={screen.id} className="overflow-hidden bg-card hover:shadow-lg transition-all duration-300 border-muted">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 pt-6 px-6">
                  <div className="space-y-1.5">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      {screen.name}
                      <ScreenPresence screenId={screen.id} compact />
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {screen.theme} theme • {isPortrait ? 'Portrait' : 'Landscape'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/admin/${mosqueId}/screen/${screen.id}`)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Display
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this screen? This action cannot be undone.')) {
                            handleDeleteScreen(screen.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                
                <CardContent className="pb-6 px-6">
                  <ScreenPreview screen={screen} />
                </CardContent>

                <CardFooter className="py-4 px-6 border-t bg-muted/30 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal text-[10px] h-6 px-2 gap-1.5 bg-background">
                        {isPortrait ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        {isPortrait ? '9:16' : '16:9'}
                      </Badge>
                   </div>
                   <CopyUrlButton slug={screen.slug} />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
