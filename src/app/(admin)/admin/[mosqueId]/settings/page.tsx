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
  const [deleting, setDeleting] = useState(false);
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
        toast.error('Failed to load settings');
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

      if (removeLogo && savedSnapshot.current?.logo_url) {
        const url = savedSnapshot.current.logo_url;
        const bucketPath = url.split('/mosque-logos/')[1]?.split('?')[0];
        if (bucketPath) {
          await supabase.storage.from('mosque-logos').remove([bucketPath]);
        }
        newLogoUrl = null;
      }

      const { error } = await supabase
        .from('mosques')
        .update({ name: name.trim(), logo_url: newLogoUrl })
        .eq('id', mosqueId);

      if (error) {
        toast.error('Failed to save');
        setSaving(false);
        return;
      }

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

  const handleDelete = async () => {
    if (!confirm('Are you sure? This will permanently delete this mosque, all screens, and all settings.')) return;

    setDeleting(true);
    const { error } = await supabase.from('mosques').delete().eq('id', mosqueId);
    if (error) {
      toast.error(error.message);
      setDeleting(false);
    } else {
      toast.success('Mosque deleted');
      router.push('/admin');
    }
  };

  const displayLogoUrl = removeLogo ? null : (logoPreview ?? logoUrl);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Name */}
        <Card>
          <CardHeader>
            <CardTitle>Mosque Name</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter mosque name"
              maxLength={100}
            />
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="size-16 rounded-lg">
                {displayLogoUrl ? (
                  <AvatarImage src={displayLogoUrl} alt="Logo" />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  <Building2 className="size-6 text-muted-foreground" />
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
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4 mr-2" />
                  Upload
                </Button>
                {displayLogoUrl && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive">
                    <Trash2 className="size-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this mosque and all its data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="size-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Mosque'}
            </Button>
          </CardContent>
        </Card>
      </div>

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
