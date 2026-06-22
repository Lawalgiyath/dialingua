"""Engine B - research mode for languages with no production MT model.

These are the low-/zero-resource languages (Efik, Tiv, Ijaw, Nigerian Pidgin,
and the Cross River endangered set: Bekwarra, Bokyi, Ejagham, Ubang). NLLB does
not cover them. Two honest paths:

  1. If ANTHROPIC_API_KEY is set -> Claude produces a linguist-grade analysis
     (translation, IPA, tone notes, grammar, morphology, confidence) with prompt
     caching on the system prompt. Clearly labelled as model-reasoned, not a
     trained MT system, with native-speaker-verification caveats.

  2. Otherwise -> a curated corpus of worked examples (same JSON shape, authored
     at the quality of the Efik sample), clearly labelled "curated".

Either way the UI is told exactly which path produced the result.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

DATA = Path(__file__).resolve().parent.parent / "data"

_corpus: Optional[dict] = None


def _load_corpus() -> dict:
    global _corpus
    if _corpus is None:
        with open(DATA / "corpus.json", encoding="utf-8") as fh:
            _corpus = json.load(fh)
    return _corpus


def has_claude() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY"))


def status() -> dict:
    return {
        "engine": "research",
        "mode": "claude" if has_claude() else "curated",
        "claude_available": has_claude(),
    }


def _normalize(s: str) -> str:
    return " ".join(s.lower().strip().rstrip(".!?").split())


SYSTEM_PROMPT = (
    "You are a descriptive field linguist specializing in the Benue-Congo and "
    "Cross River languages of Nigeria. Given an English sentence and a target "
    "low-resource Nigerian language, produce a careful, honest scholarly gloss. "
    "You are NOT a trained machine-translation system for these languages; you "
    "reason from comparative and documentary linguistics and you MUST flag "
    "uncertainty rather than inventing confident forms. Always recommend "
    "native-speaker verification. Preserve tone marks and use IPA in slashes. "
    "Respond ONLY with a JSON object with keys: translation (string), ipa "
    "(string, slashed broken into syllables), tone_notes (string), grammar "
    "(string), morphology (string), confidence (one of 'low','medium','high'), "
    "caveats (string)."
)


def _claude_translate(text: str, lang: dict) -> dict:
    import anthropic

    client = anthropic.Anthropic()
    user = (
        f"English sentence: {text!r}\n"
        f"Target language: {lang['name']} (ISO 639-3 {lang.get('iso639_3', '?')}, "
        f"family {lang.get('family', '?')}, subgroup {lang.get('subgroup', '?')}).\n"
        "Return the JSON object as specified."
    )
    msg = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=1100,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # prompt caching
            }
        ],
        messages=[{"role": "user", "content": user}],
    )
    raw = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1].lstrip("json").strip()
    data = json.loads(raw)
    return {
        "translation": data.get("translation", ""),
        "ipa": data.get("ipa", ""),
        "tone_notes": data.get("tone_notes", ""),
        "grammar": data.get("grammar", ""),
        "morphology": data.get("morphology", ""),
        "confidence": data.get("confidence", "low"),
        "caveats": data.get("caveats", ""),
        "engine": "research",
        "engine_label": "Research mode · Claude reasoning",
        "model": "claude-opus-4-8",
        "offline": False,
    }


def _curated_translate(text: str, lang: dict) -> dict:
    corpus = _load_corpus()
    entries = corpus.get(lang["code"], [])
    key = _normalize(text)
    match = None
    for entry in entries:
        if _normalize(entry["en"]) == key:
            match = entry
            break
    if match is None and entries:
        # fall back to the language's flagship demo phrase
        match = entries[0]
        partial = True
    else:
        partial = False

    if match is None:
        return {
            "translation": "-",
            "ipa": "",
            "tone_notes": "",
            "grammar": "",
            "morphology": "",
            "confidence": "low",
            "caveats": (
                f"{lang['name']} is a {lang.get('tier_label', 'low-resource')} language with no "
                "production model and no curated example for this phrase yet. This is exactly the "
                "data-archeology gap the framework is built to close: corpora must be collected "
                "from church archives, university linguistics departments, and community elders "
                "before reliable translation is possible."
            ),
            "engine": "research",
            "engine_label": "Research mode · data needed",
            "model": None,
            "offline": True,
        }

    out = {
        "translation": match["translation"],
        "ipa": match.get("ipa", ""),
        "tone_notes": match.get("tone_notes", ""),
        "grammar": match.get("grammar", ""),
        "morphology": match.get("morphology", ""),
        "confidence": match.get("confidence", "low"),
        "caveats": match.get("caveats", ""),
        "engine": "research",
        "engine_label": "Research mode · curated corpus",
        "model": None,
        "offline": True,
    }
    if partial:
        out["confidence"] = "low"
        out["caveats"] = (
            "No curated entry for this exact phrase. Showing this language's flagship documented "
            "example so you can inspect the analysis depth. " + out.get("caveats", "")
        )
        out["approximate"] = True
    return out


def translate(text: str, lang: dict) -> dict:
    if has_claude():
        try:
            return _claude_translate(text, lang)
        except Exception as exc:  # noqa: BLE001 - never 500 on the demo path
            res = _curated_translate(text, lang)
            res["caveats"] = (
                f"(Claude research-mode unavailable: {type(exc).__name__}. Showing curated data.) "
                + res.get("caveats", "")
            )
            return res
    return _curated_translate(text, lang)
