import { useMemo, useState } from "react";
import { statePaths } from "../lib/geo";
import type { Atlas as AtlasT, AtlasState, Language } from "../lib/types";
import "./atlas.css";

const W = 720;
const H = 720;

const RAMP = [
  "var(--ramp-0)",
  "var(--ramp-1)",
  "var(--ramp-2)",
  "var(--ramp-4)",
  "var(--ramp-5)",
];

const TIER_COLOR: Record<number, string> = {
  1: "var(--tier-1)",
  2: "var(--tier-2)",
  3: "var(--tier-3)",
  4: "var(--tier-4)",
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${n}`;
}

function SpecimenCard({ lang }: { lang: Language }) {
  return (
    <article className="spec">
      <div className="spec__top">
        <h4 className="spec__name ling">{lang.name}</h4>
        <span
          className="spec__tier"
          style={{ color: TIER_COLOR[lang.tier], borderColor: TIER_COLOR[lang.tier] }}
        >
          T{lang.tier}
        </span>
      </div>
      <div className="spec__meta mono">
        <span>{lang.iso639_3}</span>
        <span>·</span>
        <span>{lang.family}</span>
      </div>
      <div className="spec__row">
        <span className="chip">{fmt(lang.speakers)} speakers</span>
        <span className="chip">{lang.status}</span>
        <span
          className="chip"
          style={{
            borderColor:
              lang.engine === "nllb" ? "var(--success)" : "var(--ochre-500)",
            color: lang.engine === "nllb" ? "var(--success)" : "var(--ochre-400)",
          }}
        >
          {lang.engine === "nllb" ? "NLLB model" : "research"}
        </span>
        {lang.tonal && <span className="chip">tonal</span>}
      </div>
      {lang.note && <p className="spec__note">{lang.note}</p>}
    </article>
  );
}

export default function AtlasSection({ atlas }: { atlas: AtlasT | null }) {
  const paths = useMemo(() => statePaths(W, H), []);
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>("Cross River");

  const byName = useMemo(() => {
    const m = new Map<string, AtlasState>();
    atlas?.states.forEach((s) => m.set(s.name, s));
    return m;
  }, [atlas]);

  const active =
    byName.get(selected ?? "") ?? byName.get(hover ?? "") ?? null;

  const maxLangs = useMemo(
    () => Math.max(1, ...(atlas?.states.map((s) => s.languages.length) ?? [1])),
    [atlas],
  );

  function densityFill(name: string) {
    const st = byName.get(name);
    if (!st) return "var(--surface-1)";
    const t = st.languages.length / maxLangs;
    const idx = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
    return RAMP[idx];
  }

  // FCT label nudges over Abuja shape name mismatch
  const displayName = (n: string) =>
    n === "Abuja Federal Capital Territory" ? "FCT" : n;

  function lookupState(geoName: string): AtlasState | undefined {
    if (byName.has(geoName)) return byName.get(geoName);
    if (geoName.startsWith("Abuja")) return byName.get("FCT (Abuja)");
    return undefined;
  }

  return (
    <section className="section atlas" id="atlas">
      <div className="wrap">
        <header className="sec-head">
          <span className="eyebrow">The Atlas · single source of truth</span>
          <h2>
            A state-by-state language map, tinted by{" "}
            <span className="u-ochre">density</span>.
          </h2>
          <p className="sec-sub">
            Coverage is wildly uneven - Plateau and the Middle Belt hold dozens of
            languages per state, while the far north runs on Hausa plus a few. The
            framework is built for that asymmetry. Hover a state; click to inspect
            its languages as specimen cards.
          </p>
        </header>

        <div className="atlas__layout">
          <div className="atlas__mapwrap glass grain">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="atlas__svg"
              role="img"
              aria-label="Map of Nigeria states by language density"
            >
              {paths.map((p) => {
                const st = lookupState(p.name);
                const name = st?.name ?? p.name;
                const isActive = active?.name === name;
                return (
                  <path
                    key={p.name}
                    d={p.d}
                    fill={st ? densityFill(p.name) : "var(--surface-1)"}
                    stroke={isActive ? "var(--ochre-400)" : "var(--bg-sunken)"}
                    strokeWidth={isActive ? 2 : 0.8}
                    className="atlas__state"
                    style={{ opacity: isActive ? 1 : hover ? 0.78 : 0.92 }}
                    onMouseEnter={() => setHover(name)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setSelected(name)}
                    tabIndex={0}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") && setSelected(name)
                    }
                  >
                    <title>
                      {displayName(name)} - {st?.languages.length ?? 0} languages
                    </title>
                  </path>
                );
              })}
              {paths.map((p) => {
                const st = lookupState(p.name);
                if (!st || st.languages.length < 3) return null;
                return (
                  <text
                    key={`l-${p.name}`}
                    x={p.centroid[0]}
                    y={p.centroid[1]}
                    className="atlas__count mono"
                    textAnchor="middle"
                  >
                    {st.languages.length}
                  </text>
                );
              })}
            </svg>

            <div className="atlas__legend">
              <span className="mono">SPARSE</span>
              <div className="atlas__ramp">
                {RAMP.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </div>
              <span className="mono">DENSE</span>
            </div>
          </div>

          <aside className="atlas__panel glass grain glass--shine">
            {active ? (
              <>
                <div className="atlas__panel-head">
                  <div>
                    <span className="eyebrow">{active.zone}</span>
                    <h3 className="atlas__state-name">{displayName(active.name)}</h3>
                  </div>
                  <div className="atlas__big mono">
                    {active.languages.length}
                    <span>langs</span>
                  </div>
                </div>
                <hr className="divider" />
                <div className="atlas__specs">
                  {active.languages.map((l) => (
                    <SpecimenCard key={l.code + l.name} lang={l} />
                  ))}
                </div>
              </>
            ) : (
              <p className="atlas__empty">Select a state to inspect its languages.</p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
