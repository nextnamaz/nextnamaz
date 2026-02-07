export type MemberRole = 'owner' | 'admin' | 'viewer';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PrayerTimesMap = {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

// Row types — convenience aliases for typed app code
export type Mosque = Database['public']['Tables']['mosques']['Row'];
export type MosqueMember = Database['public']['Tables']['mosque_members']['Row'];
export type Screen = Database['public']['Tables']['screens']['Row'];

// Typed settings with proper JSONB shapes
export type MosqueSettings = {
  mosque_id: string;
  prayer_times: PrayerTimesMap;
  locale: string;
  display_text: Record<string, string>;
  metadata: Record<string, unknown>;
  updated_at: string;
};

// Supabase Database type — gives full type safety on all queries
export type Database = {
  public: {
    Tables: {
      mosques: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      mosque_members: {
        Row: {
          id: string;
          mosque_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          mosque_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          mosque_id?: string;
          user_id?: string;
          role?: MemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mosque_members_mosque_id_fkey";
            columns: ["mosque_id"];
            isOneToOne: false;
            referencedRelation: "mosques";
            referencedColumns: ["id"];
          },
        ];
      };
      mosque_settings: {
        Row: {
          mosque_id: string;
          prayer_times: Json;
          locale: string;
          display_text: Json;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          mosque_id: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          mosque_id?: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mosque_settings_mosque_id_fkey";
            columns: ["mosque_id"];
            isOneToOne: true;
            referencedRelation: "mosques";
            referencedColumns: ["id"];
          },
        ];
      };
      screens: {
        Row: {
          id: string;
          mosque_id: string;
          name: string;
          slug: string;
          theme: string;
          theme_config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          mosque_id: string;
          name?: string;
          slug: string;
          theme?: string;
          theme_config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          mosque_id?: string;
          name?: string;
          slug?: string;
          theme?: string;
          theme_config?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "screens_mosque_id_fkey";
            columns: ["mosque_id"];
            isOneToOne: false;
            referencedRelation: "mosques";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      member_role: MemberRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper: extract typed Row from table name
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

// Type-safe JSONB → PrayerTimesMap
export function asPrayerTimes(json: Json): PrayerTimesMap {
  const obj = json as Record<string, string>;
  return {
    fajr: obj.fajr ?? '05:00',
    sunrise: obj.sunrise ?? '06:30',
    dhuhr: obj.dhuhr ?? '13:00',
    asr: obj.asr ?? '16:30',
    maghrib: obj.maghrib ?? '19:00',
    isha: obj.isha ?? '20:30',
  };
}

// Type-safe JSONB → Record<string, string>
export function asStringRecord(json: Json): Record<string, string> {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) {
      if (typeof v === 'string') result[k] = v;
    }
    return result;
  }
  return {};
}

// Type-safe JSONB → Record<string, unknown>
export function asRecord(json: Json): Record<string, unknown> {
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

// DB Row type for mosque_settings (JSONB fields are Json)
export type MosqueSettingsRow = Database['public']['Tables']['mosque_settings']['Row'];

// Convert DB row → app-level MosqueSettings
export function toMosqueSettings(row: MosqueSettingsRow): MosqueSettings {
  return {
    mosque_id: row.mosque_id,
    prayer_times: asPrayerTimes(row.prayer_times),
    locale: row.locale,
    display_text: asStringRecord(row.display_text),
    metadata: asRecord(row.metadata),
    updated_at: row.updated_at,
  };
}
