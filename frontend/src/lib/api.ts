/**
 * Dialingua API client.
 *
 * Two modes:
 *   LOCAL  (DEV / run.ps1): proxies to FastAPI on 127.0.0.1:8000 for full NLLB support.
 *   LIVE   (GitHub Pages):  atlas and corpus are bundled statically.
 *                           - Translations go to MyMemory free API (browser-safe, no CORS).
 *                           - Linguistic annotations (IPA, tone notes, grammar, morphology)
 *                             come from the bundled research corpus, just like the backend.
 */
import type { Atlas, Health, TranslationResult } from "./types";
import atlasStatic from "./atlas.json";
import corpusStatic from "./corpus.json";

// --- mode detection ----------------------------------------------------------

const IS_DEV = import.meta.env.DEV;
const LOCAL_BASE = "http://127.0.0.1:8000";

// MyMemory free translation API - no auth, CORS-enabled, browser-safe
const MYMEMORY = "https://api.mymemory.translated.net/get";

// Language configs: MyMemory code + metadata for TranslationResult
const LANG_CONFIGS: Record<string, {
  myMemoryCode: string;
  name: string;
  family: string;
  tier: 1 | 2 | 3 | 4;
}> = {
  yor: { myMemoryCode: "yo",  name: "Yoruba",         family: "Niger-Congo",  tier: 1 },
  ibo: { myMemoryCode: "ig",  name: "Igbo",            family: "Niger-Congo",  tier: 1 },
  hau: { myMemoryCode: "ha",  name: "Hausa",           family: "Afro-Asiatic", tier: 1 },
  fuv: { myMemoryCode: "ff",  name: "Fulfulde",        family: "Niger-Congo",  tier: 2 },
  knc: { myMemoryCode: "kr",  name: "Kanuri",          family: "Nilo-Saharan", tier: 2 },
  pcm: { myMemoryCode: "en",  name: "Nigerian Pidgin", family: "Creole",       tier: 2 },
  efi: { myMemoryCode: "en",  name: "Efik",            family: "Niger-Congo",  tier: 3 },
  tiv: { myMemoryCode: "en",  name: "Tiv",             family: "Niger-Congo",  tier: 3 },
  ijc: { myMemoryCode: "en",  name: "Ijo",             family: "Niger-Congo",  tier: 3 },
  bin: { myMemoryCode: "en",  name: "Edo (Bini)",      family: "Niger-Congo",  tier: 3 },
  bkw: { myMemoryCode: "en",  name: "Bekwarra",        family: "Niger-Congo",  tier: 4 },
  bky: { myMemoryCode: "en",  name: "Bokyi",           family: "Niger-Congo",  tier: 4 },
  eja: { myMemoryCode: "en",  name: "Ejagham",         family: "Niger-Congo",  tier: 4 },
  uba: { myMemoryCode: "en",  name: "Ubang",           family: "Niger-Congo",  tier: 4 },
};

// typed corpus
const CORPUS = corpusStatic as unknown as Record<string, Array<{
  en: string;
  translation: string;
  ipa?: string;
  tone_notes?: string;
  grammar?: string;
  morphology?: string;
  confidence?: string;
  caveats?: string;
}>>;

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

// --- corpus lookup (same logic as backend research.py) ----------------------

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[.!?]+$/, "").replace(/\s+/g, " ");
}

function corpusLookup(code: string, text: string) {
  const entries = CORPUS[code];
  if (!entries || !entries.length) return null;
  const key = normalize(text);
  const exact = entries.find((e) => normalize(e.en) === key);
  if (exact) return { entry: exact, partial: false };
  // fallback: flagship first entry
  return { entry: entries[0], partial: true };
}

// --- MyMemory API (live / static deployment) ---------------------------------

async function myMemoryTranslate(text: string, targetCode: string): Promise<string> {
  const url =
    `${MYMEMORY}?q=${encodeURIComponent(text)}&langpair=en|${targetCode}&de=dialingua@demo.com`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation service error (${res.status}). Please try again.`);
  const data = (await res.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };
  if (data.responseStatus !== 200) {
    throw new Error(`Translation failed (status ${data.responseStatus}).`);
  }
  return data.responseData.translatedText;
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
    nllb: { state: "ready", model: "MyMemory Neural (live)", languages: Object.keys(LANG_CONFIGS) },
    research: { mode: "curated", claude_available: false },
    languages: 0,
    states: 0,
  } as unknown as Health);
}

export async function translate(text: string, target: string): Promise<TranslationResult> {
  // In dev mode proxy everything to the full FastAPI + NLLB backend.
  if (IS_DEV) return localTranslate(text, target);

  const cfg = LANG_CONFIGS[target];
  if (!cfg) {
    throw new Error("Language not supported in the live demo.");
  }

  // --- try corpus first (research engine languages + richer annotations) -----
  const corpusHit = corpusLookup(target, text);

  // For NLLB-tier languages (Yoruba, Igbo, Hausa, Fulfulde, Kanuri) get the
  // real neural translation from MyMemory, then annotate with corpus data.
  const isNeuralLang = ["yor", "ibo", "hau", "fuv", "knc"].includes(target);

  let translationText: string;
  let engineLabel: string;
  let confidence: "model" | "low" | "medium" | "high" = "medium";

  if (isNeuralLang) {
    try {
      translationText = await myMemoryTranslate(text, cfg.myMemoryCode);
      engineLabel = "Neural Translation (MyMemory)";
      confidence = "medium";
    } catch {
      // fallback to corpus if network fails
      translationText = corpusHit?.entry.translation ?? "-";
      engineLabel = "Research mode · curated corpus";
      confidence = "low";
    }
  } else {
    // Research-engine languages: use corpus translation
    translationText = corpusHit?.entry.translation ?? "-";
    engineLabel = "Research mode · curated corpus";
    confidence = (corpusHit?.entry.confidence as typeof confidence) ?? "low";
  }

  // Annotate with corpus linguistic data if available
  const annotation = corpusHit?.entry;
  const isPartial = corpusHit?.partial ?? false;

  return {
    language: cfg.name,
    code: target,
    tier: cfg.tier,
    family: cfg.family,
    translation: translationText,
    ipa: annotation?.ipa ?? undefined,
    tone_notes: annotation?.tone_notes ?? undefined,
    grammar: annotation?.grammar ?? undefined,
    morphology: annotation?.morphology ?? undefined,
    confidence,
    caveats: isPartial
      ? "Linguistic notes shown are from this language's flagship documented example. " +
        (annotation?.caveats ?? "")
      : (annotation?.caveats ?? undefined),
    engine: isNeuralLang ? "nllb" : "research",
    engine_label: engineLabel,
    model: isNeuralLang ? "MyMemory Neural" : null,
    latency_ms: 0,
    offline: false,
    approximate: isPartial,
  };
}
