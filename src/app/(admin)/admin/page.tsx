'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
import { Plus, Trash2, LogOut, Monitor, ChevronRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Mosque } from '@/types/database';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface MosqueWithScreenCount extends Mosque {
  screenCount: number;
}

export default function MosquesPage() {
  const [mosques, setMosques] = useState<MosqueWithScreenCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const loadMosques = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: memberships } = await supabase
      .from('mosque_members')
      .select('mosque_id, mosques(*, screens(count))')
      .eq('user_id', user.id);

    if (memberships) {
      const mosqueList = memberships
        .map((m) => {
          const mosque = m.mosques as unknown as Mosque & { screens: { count: number }[] };
          if (!mosque) return null;
          return {
            ...mosque,
            screenCount: mosque.screens?.[0]?.count ?? 0,
          };
        })
        .filter((m): m is MosqueWithScreenCount => m !== null);
      setMosques(mosqueList);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMosques();
  }, [loadMosques]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const slug = generateSlug(newName);

    const { data: mosque, error: mosqueError } = await supabase
      .from('mosques')
      .insert({ name: newName.trim(), slug })
      .select()
      .single();

    if (mosqueError) {
      toast.error(mosqueError.message);
      setCreating(false);
      return;
    }

    const { error: memberError } = await supabase.from('mosque_members').insert({
      mosque_id: mosque.id,
      user_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      toast.error(memberError.message);
      setCreating(false);
      return;
    }

    const { error: screenError } = await supabase.from('screens').insert({
      mosque_id: mosque.id,
      name: 'Main Screen',
      slug: `${slug}-main`,
      theme: 'classic',
      theme_config: {},
    });

    if (screenError) {
      toast.error(screenError.message);
      setCreating(false);
      return;
    }

    setNewName('');
    setDialogOpen(false);
    setCreating(false);
    toast.success('Mosque created');
    loadMosques();
  };

  const handleDelete = async (mosqueId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('mosques').delete().eq('id', mosqueId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mosque deleted');
      loadMosques();
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your mosques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-primary">NextNamaz</span>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome + action */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Mosques</h1>
            <p className="text-muted-foreground mt-1">
              {mosques.length === 0
                ? 'Get started by creating your first mosque'
                : `Managing ${mosques.length} mosque${mosques.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                New Mosque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new mosque</DialogTitle>
                <DialogDescription>
                  Add your mosque to start managing prayer times and display screens.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Mosque Name</Label>
                  <Input
                    id="name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Islamic Center of Springfield"
                    required
                    autoFocus
                  />
                  {newName.trim() && (
                    <p className="text-xs text-muted-foreground">
                      URL slug: <span className="font-mono text-foreground/70">{generateSlug(newName)}</span>
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Mosque'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {mosques.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No mosques yet</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
              Create your first mosque to start configuring prayer times and setting up display screens.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Mosque
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {mosques.map((mosque) => (
              <button
                key={mosque.id}
                className="group w-full text-left rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/admin/${mosque.id}`)}
              >
                {/* Initials avatar */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0">
                  {mosque.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">{mosque.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      {mosque.screenCount} screen{mosque.screenCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      /{mosque.slug}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this mosque? This cannot be undone.')) {
                        handleDelete(mosque.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
