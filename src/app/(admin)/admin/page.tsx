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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Building2, User2, LogOut, ChevronsUpDown, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
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

    setUserEmail(user.email ?? null);

    const { data: memberships } = await supabase
      .from('mosque_members')
      .select('mosque_id, mosques(*, screens(count))')
      .eq('user_id', user.id);

    if (memberships) {
      const mosqueList = memberships
        .map((m) => {
          const mosque = m.mosques as unknown as Mosque & { screens: { count: number }[] };
          if (!mosque) return null;
          const { screens, ...rest } = mosque;
          return {
            ...rest,
            screenCount: screens?.[0]?.count ?? 0,
          };
        })
        .filter((m): m is MosqueWithScreenCount => m != null);
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
      theme: 'default',
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User2 className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">{userEmail}</span>
                <ChevronsUpDown className="w-3 h-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/billing')}>
                <CreditCard className="mr-2 w-4 h-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold tracking-tight">Your Mosques</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                New Mosque
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new mosque</DialogTitle>
                <DialogDescription>
                  Add your mosque to start managing prayer times and displays.
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
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Mosque'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {mosques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No mosques yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Create your first mosque to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Mosque
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {mosques.map((mosque) => (
              <div
                key={mosque.id}
                role="button"
                tabIndex={0}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border bg-card cursor-pointer hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                onClick={() => router.push(`/admin/${mosque.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/admin/${mosque.id}`); }}
              >
                <Avatar className="size-14 rounded-xl shrink-0">
                  {mosque.logo_url && (
                    <AvatarImage src={mosque.logo_url} alt={mosque.name} className="rounded-xl object-cover" />
                  )}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-lg">
                    {mosque.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center min-w-0 w-full">
                  <p className="text-sm font-semibold truncate">{mosque.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mosque.screenCount} screen{mosque.screenCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
