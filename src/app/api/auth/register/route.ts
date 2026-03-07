import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { registerSchema, generateSlug } from '@/lib/validations';

// Service role client to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface RegisterBody {
  email: string;
  password: string;
  mosqueName: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterBody;

  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 },
    );
  }

  const { email, password, mosqueName } = body;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user.id;
  const mosqueSlug = generateSlug(mosqueName);

  // 2. Create mosque
  const { data: mosque, error: mosqueError } = await supabase
    .from('mosques')
    .insert({ name: mosqueName, slug: mosqueSlug })
    .select('id')
    .single();

  if (mosqueError) {
    return NextResponse.json({ error: mosqueError.message }, { status: 500 });
  }

  // 3. Create membership + default screen in parallel
  const [memberResult, screenResult] = await Promise.all([
    supabase.from('mosque_members').insert({
      mosque_id: mosque.id,
      user_id: userId,
      role: 'owner',
    }),
    supabase.from('screens').insert({
      mosque_id: mosque.id,
      name: 'Main Screen',
      slug: `${mosqueSlug}-main`,
      theme: 'default',
      theme_config: {},
    }),
  ]);

  if (memberResult.error) {
    return NextResponse.json({ error: memberResult.error.message }, { status: 500 });
  }

  if (screenResult.error) {
    return NextResponse.json({ error: screenResult.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
