export interface Language {
  code: string;
  name: string;
  iso639_3: string;
  family: string;
  subgroup: string;
  speakers: number;
  tier: 1 | 2 | 3 | 4;
  status: string;
  engine: "nllb" | "research";
  lgas: string[];
  tonal: boolean;
  note?: string;
  state?: string;
}

export interface AtlasState {
  name: string;
  zone: string;
  lat: number;
  lng: number;
  density: number;
  virtual?: boolean;
  languages: Language[];
}

export interface TierInfo {
  label: string;
  desc: string;
  strategy: string;
}

export interface Atlas {
  meta: {
    country: string;
    living_languages: number;
    extinct: number;
    endangered_est: number;
    families: string[];
    note: string;
    tiers: Record<string, TierInfo>;
  };
  states: AtlasState[];
}

export interface TranslationResult {
  language: string;
  code: string;
  tier: number;
  family: string;
  translation: string;
  ipa?: string;
  tone_notes?: string;
  grammar?: string;
  morphology?: string;
  confidence: "model" | "low" | "medium" | "high";
  caveats?: string;
  engine: "nllb" | "research";
  engine_label: string;
  model?: string | null;
  latency_ms?: number;
  flores_code?: string;
  offline: boolean;
  approximate?: boolean;
}

export interface Health {
  ok: boolean;
  nllb: {
    state: "idle" | "loading" | "ready" | "error";
    model: string;
    languages: string[];
    load_seconds?: number | null;
    error?: string | null;
  };
  research: { mode: "claude" | "curated"; claude_available: boolean };
  languages: number;
  states: number;
}
