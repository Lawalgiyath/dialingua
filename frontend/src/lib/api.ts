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
// Covers all 77 Nigerian languages in the atlas.
// Languages MyMemory can translate get a real translation code;
// low-resource languages fall back to the research corpus.
const LANG_CONFIGS: Record<string, {
  myMemoryCode: string;
  name: string;
  family: string;
  tier: 1 | 2 | 3 | 4;
}> = {
  // --- Tier 1: Full neural MT (MyMemory supports these) ---
  yor: { myMemoryCode: "yo",  name: "Yoruba",                      family: "Niger-Congo",   tier: 1 },
  ibo: { myMemoryCode: "ig",  name: "Igbo",                        family: "Niger-Congo",   tier: 1 },
  hau: { myMemoryCode: "ha",  name: "Hausa",                       family: "Afro-Asiatic",  tier: 1 },
  fuv: { myMemoryCode: "ff",  name: "Nigerian Fulfulde",           family: "Niger-Congo",   tier: 1 },
  knc: { myMemoryCode: "kr",  name: "Central Kanuri",              family: "Nilo-Saharan",  tier: 1 },
  // --- Tier 2: Partial neural support ---
  pcm: { myMemoryCode: "en",  name: "Nigerian Pidgin",             family: "Creole",        tier: 2 },
  tiv: { myMemoryCode: "en",  name: "Tiv",                        family: "Niger-Congo",   tier: 2 },
  ibb: { myMemoryCode: "en",  name: "Ibibio",                     family: "Niger-Congo",   tier: 2 },
  bin: { myMemoryCode: "en",  name: "Edo (Bini)",                  family: "Niger-Congo",   tier: 2 },
  nup: { myMemoryCode: "en",  name: "Nupe",                       family: "Niger-Congo",   tier: 2 },
  urh: { myMemoryCode: "en",  name: "Urhobo",                     family: "Niger-Congo",   tier: 2 },
  ngas: { myMemoryCode: "en", name: "Ngas (Angas)",                family: "Afro-Asiatic",  tier: 2 },
  jju: { myMemoryCode: "en",  name: "Jju (Kaje)",                  family: "Niger-Congo",   tier: 2 },
  ham: { myMemoryCode: "en",  name: "Hamer-Banna",                 family: "Afro-Asiatic",  tier: 2 },
  // --- Tier 3: Research mode ---
  efi: { myMemoryCode: "en",  name: "Efik",                       family: "Niger-Congo",   tier: 3 },
  ijc: { myMemoryCode: "en",  name: "Ijo (Izon)",                  family: "Niger-Congo",   tier: 3 },
  ijb: { myMemoryCode: "en",  name: "Ijo (Biseni)",                family: "Niger-Congo",   tier: 3 },
  ilj: { myMemoryCode: "en",  name: "Ijo (Inland)",                family: "Niger-Congo",   tier: 3 },
  iri: { myMemoryCode: "en",  name: "Irigwe",                     family: "Niger-Congo",   tier: 3 },
  iso: { myMemoryCode: "en",  name: "Isoko",                      family: "Niger-Congo",   tier: 3 },
  ito: { myMemoryCode: "en",  name: "Itonama",                    family: "Niger-Congo",   tier: 3 },
  izi: { myMemoryCode: "en",  name: "Izi-Ezaa-Ikwo-Mgbo",         family: "Niger-Congo",   tier: 3 },
  idu: { myMemoryCode: "en",  name: "Iduna",                      family: "Niger-Congo",   tier: 3 },
  igd: { myMemoryCode: "en",  name: "Igede",                      family: "Niger-Congo",   tier: 3 },
  ogb: { myMemoryCode: "en",  name: "Ogba",                       family: "Niger-Congo",   tier: 3 },
  ogu: { myMemoryCode: "en",  name: "Ogu-Ologbo",                 family: "Niger-Congo",   tier: 3 },
  oko: { myMemoryCode: "en",  name: "Oko",                        family: "Niger-Congo",   tier: 3 },
  okr: { myMemoryCode: "en",  name: "Okrika",                     family: "Niger-Congo",   tier: 3 },
  ola: { myMemoryCode: "en",  name: "Olulomo-Ikom",               family: "Niger-Congo",   tier: 3 },
  orn: { myMemoryCode: "en",  name: "Oron",                       family: "Niger-Congo",   tier: 3 },
  owa: { myMemoryCode: "en",  name: "Owa",                        family: "Niger-Congo",   tier: 3 },
  ann: { myMemoryCode: "en",  name: "Anaang",                     family: "Niger-Congo",   tier: 3 },
  aty: { myMemoryCode: "en",  name: "Aten (Gerka)",                family: "Niger-Congo",   tier: 3 },
  awo: { myMemoryCode: "en",  name: "Aworo",                      family: "Niger-Congo",   tier: 3 },
  alg: { myMemoryCode: "en",  name: "Algerian Arabic (diaspora)",  family: "Afro-Asiatic",  tier: 3 },
  bcq: { myMemoryCode: "en",  name: "Bench",                      family: "Niger-Congo",   tier: 3 },
  bde: { myMemoryCode: "en",  name: "Bade",                       family: "Afro-Asiatic",  tier: 3 },
  ber: { myMemoryCode: "en",  name: "Berom",                      family: "Niger-Congo",   tier: 3 },
  bru: { myMemoryCode: "en",  name: "Bru",                        family: "Austroasiatic", tier: 3 },
  dnd: { myMemoryCode: "en",  name: "Donde",                      family: "Niger-Congo",   tier: 3 },
  ebi: { myMemoryCode: "en",  name: "Ebira",                      family: "Niger-Congo",   tier: 3 },
  egb: { myMemoryCode: "en",  name: "Egbirra",                    family: "Niger-Congo",   tier: 3 },
  eki: { myMemoryCode: "en",  name: "Ekiti (Yoruba dialect)",      family: "Niger-Congo",   tier: 3 },
  ekn: { myMemoryCode: "en",  name: "Ekene",                      family: "Niger-Congo",   tier: 3 },
  esa: { myMemoryCode: "en",  name: "Esan",                       family: "Niger-Congo",   tier: 3 },
  fya: { myMemoryCode: "en",  name: "Fyer",                       family: "Afro-Asiatic",  tier: 3 },
  gbg: { myMemoryCode: "en",  name: "Gbagyi (Gwari)",              family: "Niger-Congo",   tier: 3 },
  gde: { myMemoryCode: "en",  name: "Gude",                       family: "Afro-Asiatic",  tier: 3 },
  gwd: { myMemoryCode: "en",  name: "Gwandara",                   family: "Afro-Asiatic",  tier: 3 },
  hig: { myMemoryCode: "en",  name: "Himba",                      family: "Niger-Congo",   tier: 3 },
  jim: { myMemoryCode: "en",  name: "Jimbin",                     family: "Afro-Asiatic",  tier: 3 },
  jbu: { myMemoryCode: "en",  name: "Juba Arabic",                family: "Afro-Asiatic",  tier: 3 },
  kal: { myMemoryCode: "en",  name: "Kalabari",                   family: "Niger-Congo",   tier: 3 },
  kam: { myMemoryCode: "en",  name: "Kamba",                      family: "Niger-Congo",   tier: 3 },
  kcl: { myMemoryCode: "en",  name: "Kainji",                     family: "Niger-Congo",   tier: 3 },
  khn: { myMemoryCode: "en",  name: "Khanty",                     family: "Uralic",        tier: 3 },
  kio: { myMemoryCode: "en",  name: "Kiong",                      family: "Niger-Congo",   tier: 3 },
  kor: { myMemoryCode: "en",  name: "Koro",                       family: "Niger-Congo",   tier: 3 },
  kor2: { myMemoryCode: "en", name: "Koro (variant)",             family: "Niger-Congo",   tier: 3 },
  mada: { myMemoryCode: "en", name: "Mada",                       family: "Afro-Asiatic",  tier: 3 },
  mfi: { myMemoryCode: "en",  name: "Mafa",                       family: "Afro-Asiatic",  tier: 3 },
  mrt: { myMemoryCode: "en",  name: "Marghi",                     family: "Afro-Asiatic",  tier: 3 },
  mwg: { myMemoryCode: "en",  name: "Mwanga",                     family: "Niger-Congo",   tier: 3 },
  mzm: { myMemoryCode: "en",  name: "Mumuye",                     family: "Niger-Congo",   tier: 3 },
  nem: { myMemoryCode: "en",  name: "Nembe",                      family: "Niger-Congo",   tier: 3 },
  ngz: { myMemoryCode: "en",  name: "Ngizim",                     family: "Afro-Asiatic",  tier: 3 },
  rin: { myMemoryCode: "en",  name: "Rigwe",                      family: "Niger-Congo",   tier: 3 },
  say: { myMemoryCode: "en",  name: "Saya",                       family: "Afro-Asiatic",  tier: 3 },
  tar: { myMemoryCode: "en",  name: "Taraba languages",           family: "Niger-Congo",   tier: 3 },
  tnq: { myMemoryCode: "en",  name: "Tangale",                    family: "Afro-Asiatic",  tier: 3 },
  uki: { myMemoryCode: "en",  name: "Ukpe-Bayobiri",              family: "Niger-Congo",   tier: 3 },
  ukq: { myMemoryCode: "en",  name: "Ukwa",                       family: "Niger-Congo",   tier: 3 },
  wja: { myMemoryCode: "en",  name: "Waja",                       family: "Niger-Congo",   tier: 3 },
  // --- Tier 4: Endangered / critically low-resource ---
  bkw: { myMemoryCode: "en",  name: "Bekwarra",                   family: "Niger-Congo",   tier: 4 },
  bky: { myMemoryCode: "en",  name: "Bokyi",                      family: "Niger-Congo",   tier: 4 },
  eja: { myMemoryCode: "en",  name: "Ejagham",                    family: "Niger-Congo",   tier: 4 },
  uba: { myMemoryCode: "en",  name: "Ubang",                      family: "Niger-Congo",   tier: 4 },
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
