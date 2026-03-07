'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Trash2,
  ExternalLink,
  Settings,
  Monitor,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Calculate scale based on the target virtual resolution
        // Landscape: 1920x1080
        // Portrait: 1080x1920
        const virtualWidth = isPortrait ? 1080 : 1920;
        const width = entry.contentRect.width;
        setScale(width / virtualWidth);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [isPortrait]);

  return (
    <div className="flex justify-center w-full bg-neutral-100/50 dark:bg-neutral-900/50 rounded-lg p-4">
      <div 
        ref={containerRef}
        className={`relative group overflow-hidden bg-neutral-950 shadow-2xl ring-4 ring-neutral-900 ring-opacity-100 rounded-lg ${
          isPortrait ? 'aspect-[9/16] h-[300px]' : 'aspect-video w-full'
        }`}
      >
        {/* TV Bezel / Frame Details */}
        <div className="absolute inset-0 border-[6px] border-neutral-800 rounded-lg z-20 pointer-events-none shadow-inner"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-neutral-800/80 rounded-t-sm z-20 pointer-events-none mb-[2px]"></div>

        {/* Glossy Screen Overlay Effects (from Legacy Code) */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 rounded pointer-events-none z-20"></div>
        <div className="absolute inset-0 rounded z-20 pointer-events-none" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)' }}></div>

        {/* Hover Overlay */}
        <div 
          className="absolute inset-x-0 bottom-0 top-auto flex items-end justify-center pointer-events-none z-30 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div className="flex items-center gap-2 bg-white/10 p-2 px-4 rounded-full backdrop-blur-md text-white border border-white/20 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <ExternalLink className="w-4 h-4" />
              <span className="text-xs font-medium">Open Preview</span>
          </div>
        </div>
        
        {/* Screen Content */}
        <div className="relative w-full h-full bg-black overflow-hidden">
          <div 
             style={{
               width: isPortrait ? '1080px' : '1920px',
               height: isPortrait ? '1920px' : '1080px',
               transform: `scale(${scale})`,
               transformOrigin: 'top left',
               opacity: scale > 0 ? 1 : 0,
               transition: 'opacity 0.2s',
             }}
          >
            <iframe
              src={`/display/${screen.slug}?preview=1`}
              title={`Preview: ${screen.name}`}
              className="w-full h-full border-0"
              scrolling="no"
            />
          </div>
        </div>
        
        {/* Click Target */}
        <a 
          href={`/display/${screen.slug}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-40 cursor-pointer"
          aria-label="Open display"
        />
      </div>
    </div>
  );
}

/* Copy URL button */

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
      theme: 'default',
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
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Screens</h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Screen
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Screen</DialogTitle>
              <DialogDescription>
                Add a display screen for your mosque.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateScreen} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenName">Screen Name</Label>
                <Input
                  id="screenName"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  placeholder="e.g. Main Hall, Ladies Section"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>Cancel</Button>
                <Button type="submit" disabled={creating || !newScreenName.trim()}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {screens.length === 0 ? (
        <Card className="border-2 border-dashed items-center justify-center py-20 px-6">
          <Monitor className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No screens yet</h3>
          <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
            Add a screen to start displaying prayer times.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Screen
          </Button>
        </Card>
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
                      <DropdownMenuItem asChild>
                        <a href={`/display/${screen.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open Display
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          const url = `${window.location.origin}/screen/${screen.short_code}`;
                          navigator.clipboard.writeText(url);
                          toast.success('Display URL copied');
                        }}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm('Delete this screen? This cannot be undone.')) {
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

                <CardFooter className="py-3 px-6 border-t bg-muted/30 flex items-center justify-end">
                   <Button
                     variant="outline"
                     size="sm"
                     className="h-8 text-xs"
                     onClick={(e) => {
                       e.stopPropagation();
                       router.push(`/admin/${mosqueId}/screen/${screen.id}`);
                     }}
                   >
                     <Settings className="w-3.5 h-3.5 mr-1.5" />
                     Configure
                   </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
