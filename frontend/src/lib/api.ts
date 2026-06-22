/**
 * Dialingua API client.
 *
 * Two modes:
 *   LOCAL  (DEV / run.ps1): proxies to FastAPI on 127.0.0.1:8000 for full NLLB support.
 *   LIVE   (GitHub Pages):  atlas is bundled statically; translations go to the
 *                           MyMemory API (free, browser-safe, no auth needed).
 */
import type { Atlas, Health, TranslationResult } from "./types";
import atlasStatic from "./atlas.json";

// --- mode detection ----------------------------------------------------------

const IS_DEV = import.meta.env.DEV;
const LOCAL_BASE = "http://127.0.0.1:8000";

// MyMemory free translation API - no auth, CORS-enabled, browser-safe
// https://mymemory.translated.net/doc/spec.php
const MYMEMORY = "https://api.mymemory.translated.net/get";

// Language codes for MyMemory (ISO 639-1 compatible)
const LANG_CODES: Record<string, { code: string; name: string; family: string; tier: number }> = {
  yor: { code: "yo",  name: "Yoruba",           family: "Niger-Congo",   tier: 1 },
  ibo: { code: "ig",  name: "Igbo",              family: "Niger-Congo",   tier: 1 },
  hau: { code: "ha",  name: "Hausa",             family: "Afro-Asiatic",  tier: 1 },
  fuv: { code: "ff",  name: "Fulfulde",          family: "Niger-Congo",   tier: 2 },
  knc: { code: "kr",  name: "Kanuri",            family: "Nilo-Saharan",  tier: 2 },
  pcm: { code: "pcm", name: "Nigerian Pidgin",   family: "Creole",        tier: 2 },
  tiv: { code: "tiv", name: "Tiv",               family: "Niger-Congo",   tier: 3 },
  ijo: { code: "ijo", name: "Ijo",               family: "Niger-Congo",   tier: 3 },
  efi: { code: "efi", name: "Efik",              family: "Niger-Congo",   tier: 3 },
  bin: { code: "bin", name: "Edo (Bini)",        family: "Niger-Congo",   tier: 3 },
};

// --- local helpers -----------------------------------------------------------

async function localGet<T>(path: string): Promise<T> {
  const res = await fetch(`${LOCAL_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function localTranslate(text: string, target: string): Promise<TranslationResult> {
  const res = await fetch(`${LOCAL_BASE}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { detail?: string }).detail || `translate -> ${res.status}`);
  }
  return res.json() as Promise<TranslationResult>;
}

// --- MyMemory API (live / static deployment) ---------------------------------

async function myMemoryTranslate(text: string, targetCode: string): Promise<string> {
  const url = `${MYMEMORY}?q=${encodeURIComponent(text)}&langpair=en|${targetCode}&de=dialingua@demo.com`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MyMemory API error ${res.status}`);
  const data = await res.json() as {
    responseStatus: number;
    responseData: { translatedText: string };
    matches?: Array<{ translation: string; quality: string }>;
  };
  if (data.responseStatus !== 200) {
    throw new Error(`Translation failed (status ${data.responseStatus})`);
  }
  const translation = data.responseData.translatedText;
  if (!translation || translation.toLowerCase() === text.toLowerCase()) {
    throw new Error("Translation not available for this language on the live demo. Run locally for full support.");
  }
  return translation;
}

// --- public API --------------------------------------------------------------

export function fetchAtlas(): Promise<Atlas> {
  if (IS_DEV) return localGet<Atlas>("/api/atlas");
  return Promise.resolve(atlasStatic as unknown as Atlas);
}

export function fetchHealth(): Promise<Health> {
  if (IS_DEV) return localGet<Health>("/api/health");
  return Promise.resolve({
    ok: true,
    nllb: { state: "ready", model: "MyMemory (live)", languages: Object.keys(LANG_CODES) },
    research: { mode: "curated", claude_available: false },
    languages: 0,
    states: 0,
  } as unknown as Health);
}

export async function translate(text: string, target: string): Promise<TranslationResult> {
  // In dev mode proxy everything to the full FastAPI + NLLB backend.
  if (IS_DEV) return localTranslate(text, target);

  // Live mode: use MyMemory free API (browser-safe, no auth, no CORS issues).
  const lang = LANG_CODES[target];
  if (!lang) {
    throw new Error(
      "This language is not supported in the live demo. Run locally for full support.",
    );
  }

  const translation = await myMemoryTranslate(text, lang.code);

  return {
    language: lang.name,
    code: target,
    tier: lang.tier as 1 | 2 | 3 | 4,
    family: lang.family,
    translation,
    engine: "nllb",
    engine_label: "Neural Translation (MyMemory)",
    model: null,
    latency_ms: 0,
    confidence: "medium",
    offline: false,
  };
}
