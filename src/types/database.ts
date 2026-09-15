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
          prayer_times: Json;
          locale: string;
          display_text: Json;
          prayer_source: string;
          prayer_source_config: Json;
          theme: string;
          theme_config: Json;
          display_config: Json;
          configured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          prayer_source?: string;
          prayer_source_config?: Json;
          theme?: string;
          theme_config?: Json;
          display_config?: Json;
          configured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          prayer_times?: Json;
          locale?: string;
          display_text?: Json;
          prayer_source?: string;
          prayer_source_config?: Json;
          theme?: string;
          theme_config?: Json;
          display_config?: Json;
          configured?: boolean;
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

const DEFAULT_PRAYER_TIMES: PrayerTimesMap = {
  fajr: '05:00',
  sunrise: '06:30',
  dhuhr: '13:00',
  asr: '16:30',
  maghrib: '19:00',
  isha: '20:30',
};

// Type-safe JSONB → PrayerTimesMap
export function asPrayerTimes(json: Json): PrayerTimesMap {
  const stored = asStringRecord(json);
  const times = { ...DEFAULT_PRAYER_TIMES };
  for (const key of Object.keys(times) as (keyof PrayerTimesMap)[]) {
    const value = stored[key];
    if (value !== undefined) times[key] = value;
  }
  return times;
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

// Screen behaviour stored in screens.display_config.
export type Rotation = 0 | 90 | 180 | 270;

export interface SlideItem {
  /** Storage object path inside the `slides` bucket. */
  path: string;
  /** Public URL the TV loads. */
  url: string;
  kind: 'image' | 'video';
}

export interface DisplayConfig {
  rotation: Rotation;
  zoom: number;
  /** Dark screen while the congregation prays. */
  blackout: {
    enabled: boolean;
    /** How long the screen stays dark from each prayer time, in minutes. */
    minutes: number;
  };
  /**
   * Small settings QR shown in the corner for a while after each prayer, so a
   * kiosk with no input device is still reachable by whoever is in the room.
   */
  controlQr: {
    enabled: boolean;
  };
  /** Uploaded media the TV cycles to between prayer views. */
  announcements: {
    enabled: boolean;
    /** Whether media covers the whole screen or shares it with the times. */
    layout: 'full' | 'split';
    /** Minutes between slideshows. */
    intervalMin: number;
    /** Seconds each image stays up (videos play to their end). */
    showSeconds: number;
    items: SlideItem[];
  };
}

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

function clamped(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && value >= min && value <= max ? value : fallback;
}

// Type-safe JSONB → DisplayConfig, defaulting anything malformed.
export function asDisplayConfig(json: Json): DisplayConfig {
  const raw = asRecord(json);
  const blackout = asRecord((raw.blackout ?? {}) as Json);
  const controlQr = asRecord((raw.controlQr ?? {}) as Json);
  const ann = asRecord((raw.announcements ?? {}) as Json);
  const items = (Array.isArray(ann.items) ? ann.items : [])
    .filter(
      (i): i is { path: string; url: string; kind?: string } =>
        !!i &&
        typeof i === 'object' &&
        typeof (i as SlideItem).path === 'string' &&
        typeof (i as SlideItem).url === 'string'
    )
    .map((i) => ({
      path: i.path,
      url: i.url,
      kind: (i.kind === 'video' ? 'video' : 'image') as SlideItem['kind'],
    }));
  return {
    rotation: ROTATIONS.includes(raw.rotation as Rotation) ? (raw.rotation as Rotation) : 0,
    zoom: clamped(raw.zoom, 0.8, 1, 1),
    blackout: {
      enabled: blackout.enabled === true,
      minutes: clamped(blackout.minutes, 1, 60, 15),
    },
    // On unless explicitly switched off, so screens saved before this existed
    // gain the way back into their own settings without being re-saved.
    controlQr: { enabled: controlQr.enabled !== false },
    announcements: {
      enabled: ann.enabled === true,
      layout: ann.layout === 'split' ? 'split' : 'full',
      intervalMin: clamped(ann.intervalMin, 1, 120, 10),
      showSeconds: clamped(ann.showSeconds, 3, 60, 12),
      items: items.slice(0, 12),
    },
  };
}
