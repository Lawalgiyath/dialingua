import type { Atlas, Health, TranslationResult } from "./types";

const BASE = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchAtlas = () => get<Atlas>("/api/atlas");
export const fetchHealth = () => get<Health>("/api/health");

export async function translate(
  text: string,
  target: string,
): Promise<TranslationResult> {
  const res = await fetch(`${BASE}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `translate -> ${res.status}`);
  }
  return res.json() as Promise<TranslationResult>;
}
