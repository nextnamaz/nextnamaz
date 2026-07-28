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

export type Database = {
  public: {
    Tables: {
      screens: {
        Row: {
          id: string;
          name: string;
          prayer_times: Json;
          locale: string;
          display_text: Json;
          prayer_source: string;
          prayer_source_config: Json;
          theme: string;
          theme_config: Json;
          configured: boolean;
          pin: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          prayer_source?: string;
          prayer_source_config?: Json;
          theme?: string;
          theme_config?: Json;
          configured?: boolean;
          pin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          prayer_source?: string;
          prayer_source_config?: Json;
          theme?: string;
          theme_config?: Json;
          configured?: boolean;
          pin?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Screen = Database['public']['Tables']['screens']['Row'];

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
