/**
 * Dialingua API client.
 *
 * Two modes:
 *   LOCAL  (DEV / run.ps1): proxies to FastAPI on 127.0.0.1:8000 for full support.
 *   LIVE   (GitHub Pages):  atlas is bundled statically; translations go directly
 *                           to the free HuggingFace Inference API - no backend needed.
 */
import type { Atlas, Health, TranslationResult } from "./types";

// --- mode detection ----------------------------------------------------------

const IS_DEV = import.meta.env.DEV;
const LOCAL_BASE = "http://127.0.0.1:8000";

// HuggingFace free Inference API endpoint for NLLB-200-distilled-600M
const HF_MODEL =
  "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

// FLORES-200 codes for the Nigerian languages NLLB actually supports
const FLORES: Record<string, string> = {
  yor: "yor_Latn", // Yoruba
  ibo: "ibo_Latn", // Igbo
  hau: "hau_Latn", // Hausa
  knc: "knc_Latn", // Central Kanuri
  fuv: "fuv_Latn", // Nigerian Fulfulde
};

// --- local helpers -----------------------------------------------------------

async function localGet<T>(path: string): Promise<T> {
  const res = await fetch(`${LOCAL_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

async function localTranslate(
  text: string,
  target: string,
): Promise<TranslationResult> {
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

// --- HuggingFace Inference API (live / static deployment) -------------------

/** Call HF API with automatic retry when the model is cold-starting. */
async function hfTranslate(
  text: string,
  floresTarget: string,
): Promise<string> {
  const MAX_RETRIES = 6;
  const RETRY_DELAY = 8000; // 8 s between retries while model warms up

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(HF_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: text,
        parameters: { src_lang: "eng_Latn", tgt_lang: floresTarget },
      }),
    });

    const body = (await res.json()) as
      | Array<{ translation_text: string }>
      | { error?: string; estimated_time?: number };

    // Model still loading - wait and retry
    if (!Array.isArray(body) && body.error && body.estimated_time) {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY));
        continue;
      }
      throw new Error(
        "The AI model is still loading on HuggingFace (cold start). Please try again in ~30 seconds.",
      );
    }

    if (!Array.isArray(body)) {
      throw new Error(
        (body as { error?: string }).error || "Unexpected response from HuggingFace API.",
      );
    }

    return body[0].translation_text;
  }

  throw new Error("Translation timed out. Please try again.");
}

// --- static atlas (bundled at build time for GitHub Pages) -------------------

import atlasStatic from "./atlas.json";

// --- public API --------------------------------------------------------------

export function fetchAtlas(): Promise<Atlas> {
  if (IS_DEV) return localGet<Atlas>("/api/atlas");
  return Promise.resolve(atlasStatic as unknown as Atlas);
}

export function fetchHealth(): Promise<Health> {
  if (IS_DEV) return localGet<Health>("/api/health");
  // On the live static site we have no backend - return a minimal stub.
  return Promise.resolve({
    ok: true,
    nllb: {
      state: "ready",
      model: "facebook/nllb-200-distilled-600M",
      languages: Object.keys(FLORES),
    },
    research: { mode: "curated", claude_available: false },
    languages: 0,
    states: 0,
  } as unknown as Health);
}

export async function translate(
  text: string,
  target: string,
): Promise<TranslationResult> {
  // In dev mode, proxy everything to the full FastAPI backend.
  if (IS_DEV) return localTranslate(text, target);

  // Live mode: NLLB languages go to HuggingFace; others use research corpus stub.
  const floresCode = FLORES[target];

  if (floresCode) {
    const translation = await hfTranslate(text, floresCode);
    return {
      language: target,
      code: target,
      tier: 1,
      family: "",
      translation,
      engine: "nllb",
      engine_label: "NLLB-200 via HuggingFace Inference API",
      model: "facebook/nllb-200-distilled-600M",
      flores_code: floresCode,
      latency_ms: 0,
      confidence: "model",
      offline: false,
    };
  }

  // Research-only languages (Efik, Tiv, Ijaw, Pidgin, etc.): full translation
  // requires the local backend. Surface a clear message on the live site.
  throw new Error(
    "This language uses the research engine which runs locally only. " +
      "Tier-1 languages (Yoruba, Igbo, Hausa, Kanuri, Fulfulde) are fully " +
      "supported on the live site.",
  );
}
