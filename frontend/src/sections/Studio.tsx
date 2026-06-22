import { useMemo, useState } from "react";
import { translate } from "../lib/api";
import type { Atlas, Health, Language, TranslationResult } from "../lib/types";
import "./studio.css";

const CONFIDENCE: Record<string, { label: string; pct: number; color: string }> = {
  model: { label: "Model output", pct: 86, color: "var(--success)" },
  high: { label: "High confidence", pct: 88, color: "var(--success)" },
  medium: { label: "Medium confidence", pct: 58, color: "var(--ochre-400)" },
  low: { label: "Low confidence", pct: 30, color: "var(--danger)" },
};

const SAMPLES = [
  "I am a good boy",
  "Good morning",
  "Thank you",
  "How are you",
  "Water is life",
];

function Detail({ title, body }: { title: string; body?: string }) {
  const [open, setOpen] = useState(true);
  if (!body) return null;
  return (
    <div className={`detail ${open ? "is-open" : ""}`}>
      <button className="detail__head" onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="detail__chev">{open ? "–" : "+"}</span>
      </button>
      {open && <p className="detail__body">{body}</p>}
    </div>
  );
}

export default function Studio({
  atlas,
  health,
}: {
  atlas: Atlas | null;
  health: Health | null;
}) {
  // Unique languages grouped by engine, deduped by code+name.
  const langs = useMemo(() => {
    const seen = new Set<string>();
    const out: Language[] = [];
    atlas?.states.forEach((s) =>
      s.languages.forEach((l) => {
        const key = l.code + l.name;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(l);
        }
      }),
    );
    return out;
  }, [atlas]);

  const nllbLangs = langs.filter((l) => l.engine === "nllb");
  const researchLangs = langs.filter((l) => l.engine === "research");

  const [target, setTarget] = useState("yor");
  const [text, setText] = useState("I am a good boy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetLang = langs.find((l) => l.code === target);
  const isModel = targetLang?.engine === "nllb";

  async function run() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await translate(text.trim(), target);
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const conf = result ? CONFIDENCE[result.confidence] ?? CONFIDENCE.low : null;

  return (
    <section className="section studio" id="studio">
      <div className="wrap">
        <header className="sec-head">
          <span className="eyebrow">Translation Studio · live</span>
          <h2>
            Translate English into Nigerian languages - with the{" "}
            <span className="u-ochre">linguistics shown</span>.
          </h2>
          <p className="sec-sub">
            High-resource languages run on a real, local Meta NLLB-200 model,
            entirely offline. Low-resource and endangered languages route to
            research mode - a curated linguistic corpus now, live Claude reasoning
            when an API key is present. Every result declares which engine produced
            it and how confident it is.
          </p>
        </header>

        <div className="studio__grid">
          {/* ---- input ---- */}
          <div className="studio__input glass grain glass--shine">
            <label className="studio__label">Target language</label>
            <div className="studio__select-wrap">
              <select
                className="studio__select"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <optgroup label="Local NLLB model - offline neural MT">
                  {nllbLangs.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} · {l.family}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Research mode - curated / Claude">
                  {researchLangs.map((l) => (
                    <option key={l.code + l.name} value={l.code}>
                      {l.name} · T{l.tier} · {l.status}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {targetLang && (
              <div className="studio__langmeta">
                <span
                  className="chip"
                  style={{
                    borderColor: isModel ? "var(--success)" : "var(--ochre-500)",
                    color: isModel ? "var(--success)" : "var(--ochre-400)",
                  }}
                >
                  {isModel ? "Local NLLB model" : "Research mode"}
                </span>
                <span className="chip">ISO {targetLang.iso639_3}</span>
                <span className="chip">{targetLang.subgroup}</span>
                {targetLang.tonal && <span className="chip">tonal</span>}
              </div>
            )}

            <label className="studio__label studio__label--mt">English input</label>
            <textarea
              className="studio__textarea ling"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="Type English to translate…"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
              }}
            />

            <div className="studio__samples">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  className="studio__sample"
                  onClick={() => setText(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="studio__actions">
              <span className="studio__hint mono">⌘/Ctrl + Enter</span>
              <button
                className="btn btn--primary"
                onClick={run}
                disabled={loading || !text.trim()}
              >
                {loading ? "Translating…" : `Translate → ${targetLang?.name ?? ""}`}
              </button>
            </div>
            {isModel && health?.nllb.state === "idle" && (
              <p className="studio__warm mono">
                First model translation loads ~2.5GB on CPU (a few seconds).
              </p>
            )}
          </div>

          {/* ---- output ---- */}
          <div className="studio__output glass grain glass--shine">
            {!result && !error && !loading && (
              <div className="studio__placeholder">
                <p className="ling">Àbúbúdandun…</p>
                <span>Your translation, IPA and linguistic analysis appear here.</span>
              </div>
            )}
            {loading && (
              <div className="studio__placeholder">
                <div className="studio__spinner" />
                <span>
                  {isModel
                    ? "Running NLLB-200 on CPU…"
                    : "Consulting research corpus…"}
                </span>
              </div>
            )}
            {error && <div className="studio__error">Error: {error}</div>}

            {result && !loading && (
              <article className="trans">
                <div className="trans__head">
                  <span
                    className="chip"
                    style={{
                      borderColor:
                        result.engine === "nllb"
                          ? "var(--success)"
                          : "var(--ochre-500)",
                      color:
                        result.engine === "nllb"
                          ? "var(--success)"
                          : "var(--ochre-400)",
                    }}
                  >
                    {result.engine_label}
                  </span>
                  {result.latency_ms != null && (
                    <span className="chip mono">{result.latency_ms} ms</span>
                  )}
                  {result.offline && <span className="chip mono">offline</span>}
                </div>

                {result.translation && result.translation !== "-" ? (
                  <p className="trans__primary ling">{result.translation}</p>
                ) : (
                  <div className="trans__nodata">
                    <span className="trans__nodata-icon">🔬</span>
                    <span>No translation data available yet for this language in the live demo.</span>
                    <span className="trans__nodata-sub">Linguistic notes below are from comparative documentation.</span>
                  </div>
                )}
                {result.ipa && <p className="trans__ipa ling">{result.ipa}</p>}

                {conf && (
                  <div className="trans__conf">
                    <div className="trans__conf-bar">
                      <span
                        style={{ width: `${conf.pct}%`, background: conf.color }}
                      />
                    </div>
                    <span className="mono" style={{ color: conf.color }}>
                      {conf.label}
                    </span>
                  </div>
                )}

                <div className="trans__details">
                  <Detail title="Tone notes" body={result.tone_notes} />
                  <Detail title="Grammar" body={result.grammar} />
                  <Detail title="Morphology" body={result.morphology} />
                </div>

                {result.caveats && (
                  <p className="trans__caveat">
                    <strong>Caveat.</strong> {result.caveats}
                  </p>
                )}
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
