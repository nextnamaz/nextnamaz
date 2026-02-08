'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2, Upload, Trash2 } from 'lucide-react';

interface MosqueData {
  name: string;
  logo_url: string | null;
}

export default function SettingsPage() {
  const { mosqueId } = useParams<{ mosqueId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const savedSnapshot = useRef<MosqueData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('mosques')
        .select('name, logo_url')
        .eq('id', mosqueId)
        .single();

      if (error || !data) {
        toast.error('Failed to load mosque settings');
        setLoading(false);
        return;
      }

      setName(data.name);
      setLogoUrl(data.logo_url);
      savedSnapshot.current = { name: data.name, logo_url: data.logo_url };
      setLoading(false);
    }
    load();
  }, [mosqueId, supabase]);

  const changeCount = (() => {
    if (!savedSnapshot.current) return 0;
    let count = 0;
    if (name !== savedSnapshot.current.name) count++;
    if (logoFile || removeLogo) count++;
    return count;
  })();
  const dirty = changeCount > 0;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }

    setLogoFile(file);
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  }, []);

  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Mosque name is required');
      return;
    }

    setSaving(true);
    let newLogoUrl = logoUrl;

    try {
      // Upload new logo
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() ?? 'png';
        const path = `${mosqueId}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('mosque-logos')
          .upload(path, logoFile, { upsert: true });

        if (uploadError) {
          toast.error('Failed to upload logo');
          setSaving(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('mosque-logos')
          .getPublicUrl(path);
        newLogoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

      // Remove logo
      if (removeLogo && savedSnapshot.current?.logo_url) {
        const url = savedSnapshot.current.logo_url;
        const bucketPath = url.split('/mosque-logos/')[1]?.split('?')[0];
        if (bucketPath) {
          await supabase.storage.from('mosque-logos').remove([bucketPath]);
        }
        newLogoUrl = null;
      }

      // Update mosque record
      const { error } = await supabase
        .from('mosques')
        .update({ name: name.trim(), logo_url: newLogoUrl })
        .eq('id', mosqueId);

      if (error) {
        toast.error('Failed to save settings');
        setSaving(false);
        return;
      }

      // Reset state
      setLogoUrl(newLogoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);
      savedSnapshot.current = { name: name.trim(), logo_url: newLogoUrl };
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Settings saved');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const displayLogoUrl = removeLogo ? null : (logoPreview ?? logoUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General</h1>
        <p className="text-muted-foreground mt-1">Mosque name and branding</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Name */}
        <Card>
          <CardHeader>
            <CardTitle>Mosque Name</CardTitle>
            <CardDescription>This is displayed on your screens and in the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mosque-name">Name</Label>
              <Input
                id="mosque-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter mosque name"
                maxLength={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
            <CardDescription>Upload a logo to display on your screens. Max 2MB, image files only.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="size-20 rounded-lg">
                {displayLogoUrl ? (
                  <AvatarImage src={displayLogoUrl} alt="Mosque logo" />
                ) : null}
                <AvatarFallback className="rounded-lg text-lg">
                  <Building2 className="size-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4 mr-2" />
                  Upload logo
                </Button>
                {displayLogoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-full bg-background/80 backdrop-blur-xl border shadow-2xl pl-4 pr-1.5 py-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {changeCount} {changeCount === 1 ? 'change' : 'changes'}
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-full h-7 px-4 text-xs">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
