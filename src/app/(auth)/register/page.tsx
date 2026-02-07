'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerSchema, generateSlug } from '@/lib/validations';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mosqueName, setMosqueName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = registerSchema.safeParse({ email, password, mosqueName });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Failed to create account');
      setLoading(false);
      return;
    }

    const mosqueSlug = generateSlug(mosqueName);

    const { data: mosque, error: mosqueError } = await supabase
      .from('mosques')
      .insert({ name: mosqueName, slug: mosqueSlug })
      .select()
      .single();

    if (mosqueError) {
      setError(mosqueError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase.from('mosque_members').insert({
      mosque_id: mosque.id,
      user_id: authData.user.id,
      role: 'owner',
    });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    const { error: screenError } = await supabase.from('screens').insert({
      mosque_id: mosque.id,
      name: 'Main Screen',
      slug: `${mosqueSlug}-main`,
      theme: 'classic',
      theme_config: {},
    });

    if (screenError) {
      setError(screenError.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-secondary via-background to-secondary px-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg">N</div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Sign up and set up your mosque</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mosqueName">Mosque Name</Label>
              <Input
                id="mosqueName"
                type="text"
                value={mosqueName}
                onChange={(e) => setMosqueName(e.target.value)}
                placeholder="Your Mosque Name"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
