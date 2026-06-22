"""Engine A - local Meta NLLB-200-distilled-600M translation.

A genuine open-source neural MT model running offline on CPU. Supports the five
Nigerian languages that NLLB-200 actually covers (verified against FLORES-200):
Yoruba, Igbo, Hausa, Central Kanuri, Nigerian Fulfulde.

Model is lazy-loaded on first request (so the API boots instantly) and cached as
a process-global singleton. ~2.5 GB download on first ever run, then cached by HF.
"""
from __future__ import annotations

import threading
import time
from typing import Optional

MODEL_ID = "facebook/nllb-200-distilled-600M"
SRC = "eng_Latn"

# Verified FLORES-200 codes for Nigerian languages NLLB-200 actually supports.
# (Efik / Tiv / Ijaw / Pidgin are NOT in NLLB and are handled by the research engine.)
NLLB_CODES: dict[str, str] = {
    "yor": "yor_Latn",  # Yoruba
    "ibo": "ibo_Latn",  # Igbo
    "hau": "hau_Latn",  # Hausa
    "knc": "knc_Latn",  # Central Kanuri (Latin)
    "fuv": "fuv_Latn",  # Nigerian Fulfulde
}

_lock = threading.Lock()
_tokenizer = None
_model = None
_state = "idle"  # idle | loading | ready | error
_error: Optional[str] = None
_load_seconds: Optional[float] = None


def supports(code: str) -> bool:
    return code in NLLB_CODES


def status() -> dict:
    return {
        "engine": "nllb",
        "model": MODEL_ID,
        "state": _state,
        "error": _error,
        "load_seconds": _load_seconds,
        "languages": list(NLLB_CODES.keys()),
    }


def _ensure_loaded() -> None:
    """Load tokenizer + model once, guarded so concurrent requests share one load."""
    global _tokenizer, _model, _state, _error, _load_seconds
    if _state == "ready":
        return
    with _lock:
        if _state == "ready":
            return
        _state = "loading"
        _error = None
        try:
            t0 = time.time()
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            import torch

            # Source language is set on the tokenizer (current, non-deprecated API).
            _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, src_lang=SRC)
            _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)
            device = "cuda" if torch.cuda.is_available() else "cpu"
            _model = _model.to(device)
            _model.eval()
            _load_seconds = round(time.time() - t0, 1)
            _state = "ready"
        except Exception as exc:  # noqa: BLE001 - surface any load failure to the API
            _state = "error"
            _error = f"{type(exc).__name__}: {exc}"
            raise


def translate(text: str, target_code: str) -> dict:
    """Translate English -> target. Returns the model output plus provenance."""
    flores = NLLB_CODES.get(target_code)
    if flores is None:
        raise ValueError(f"NLLB does not support '{target_code}'")

    _ensure_loaded()
    assert _tokenizer is not None and _model is not None

    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"

    bos = _tokenizer.convert_tokens_to_ids(flores)
    inputs = _tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    t0 = time.time()
    with torch.no_grad():
        out = _model.generate(
            **inputs,
            forced_bos_token_id=bos,
            max_length=512,
            num_beams=1,
            no_repeat_ngram_size=3,
        )
    translation = _tokenizer.batch_decode(out, skip_special_tokens=True)[0].strip()

    return {
        "translation": translation,
        "engine": "nllb",
        "engine_label": "Local NLLB-200 model",
        "model": MODEL_ID,
        "flores_code": flores,
        "latency_ms": int((time.time() - t0) * 1000),
        "confidence": "model",  # genuine model output (not a heuristic)
        "offline": True,
    }
