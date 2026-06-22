"""Dialingua API - national language-AI framework for Nigeria.

Routes requests across two honest engines:
  - Engine A (engines/nllb.py): a real local NLLB-200 model for the 5 Nigerian
    languages it supports (Yoruba, Igbo, Hausa, Kanuri, Fulfulde).
  - Engine B (engines/research.py): Claude (key-gated) or a curated corpus for
    low-/zero-resource languages (Efik, Tiv, Ijaw, Pidgin, Cross River set).

Also serves the language atlas + the built frontend (single-port deployment).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from engines import nllb, research

load_dotenv()

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
FRONTEND_DIST = ROOT.parent / "frontend" / "dist"

app = FastAPI(title="Dialingua API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- data loading (atlas is the single source of truth) ----
with open(DATA / "atlas.json", encoding="utf-8") as fh:
    ATLAS = json.load(fh)

# flat index of languages by code
LANGS: dict[str, dict] = {}
for state in ATLAS["states"]:
    for lang in state["languages"]:
        LANGS.setdefault(lang["code"], {**lang, "state": state["name"]})


class TranslateIn(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    target: str


@app.get("/api/health")
def health() -> dict:
    return {
        "ok": True,
        "nllb": nllb.status(),
        "research": research.status(),
        "languages": len(LANGS),
        "states": len(ATLAS["states"]),
    }


@app.get("/api/atlas")
def atlas() -> dict:
    return ATLAS


@app.get("/api/languages/{code}")
def language(code: str) -> dict:
    lang = LANGS.get(code)
    if not lang:
        raise HTTPException(404, f"unknown language '{code}'")
    return lang


@app.post("/api/translate")
def translate(body: TranslateIn) -> dict:
    lang = LANGS.get(body.target)
    if not lang:
        raise HTTPException(404, f"unknown target language '{body.target}'")

    meta = {
        "language": lang["name"],
        "code": lang["code"],
        "tier": lang.get("tier"),
        "family": lang.get("family"),
    }

    # Route by real capability, not by wishful thinking.
    if nllb.supports(lang["code"]):
        try:
            result = nllb.translate(body.text, lang["code"])
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(503, f"model error: {type(exc).__name__}: {exc}")
    else:
        result = research.translate(body.text, lang)

    return {**meta, **result}


# ---- serve built frontend (single-port "deployment") ----
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/")
    def index() -> FileResponse:
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def spa(full_path: str) -> FileResponse:
        # SPA fallback for client routes; never shadow /api
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("PORT", 8000)))
