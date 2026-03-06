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
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Monitor, ChevronRight, Building2, CreditCard, User2, LogOut, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

function getStatusBadge(status: string | null) {
  const s = (status ?? 'trialing') as SubscriptionStatus;
  const config: Record<SubscriptionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    trialing: { label: 'Trial', variant: 'secondary' },
    past_due: { label: 'Past Due', variant: 'destructive' },
    canceled: { label: 'Canceled', variant: 'outline' },
  };
  const c = config[s] ?? config.canceled;
  return <Badge variant={c.variant} className="text-[10px] px-1.5 py-0">{c.label}</Badge>;
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
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Nav header */}
        <nav className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
            <Logo size="sm" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                    <User2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm hidden sm:inline">{userEmail}</span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Account</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Your Mosques</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mosques.length === 0
                  ? 'Get started by creating your first mosque'
                  : `Managing ${mosques.length} mosque${mosques.length !== 1 ? 's' : ''}`}
              </p>
            </div>

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

          <Separator className="mb-8" />

          {mosques.length === 0 ? (
            <Card className="border-2 border-dashed items-center justify-center py-20 px-6">
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
            </Card>
          ) : (
            <div className="grid gap-3">
              {mosques.map((mosque) => (
                <Card
                  key={mosque.id}
                  className="group gap-0 py-0 hover:shadow-md hover:border-primary/30 transition-all duration-200"
                >
                  <CardHeader className="px-4 py-3">
                    <div
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => router.push(`/admin/${mosque.id}`)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/admin/${mosque.id}`); }}
                    >
                      <Avatar size="lg" className="rounded-lg">
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {mosque.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm truncate">{mosque.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0 font-normal gap-1">
                            <Monitor className="w-3 h-3" />
                            {mosque.screenCount} screen{mosque.screenCount !== 1 ? 's' : ''}
                          </Badge>
                          {getStatusBadge(mosque.subscription_status)}
                          <span className="text-[11px] text-muted-foreground/60 font-mono">
                            /{mosque.slug}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <CardAction>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => router.push(`/admin/${mosque.id}/billing`)}
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Billing</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (confirm('Delete this mosque? This cannot be undone.')) {
                                  handleDelete(mosque.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete mosque</TooltipContent>
                        </Tooltip>
                        <ChevronRight
                          className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/${mosque.id}`)}
                        />
                      </div>
                    </CardAction>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
