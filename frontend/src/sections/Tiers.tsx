import { useMemo } from "react";
import type { Atlas } from "../lib/types";
import "./tiers.css";

const TIER_META: Record<
  number,
  { color: string; examples: string; glyph: string }
> = {
  1: { color: "var(--tier-1)", glyph: "T1", examples: "Hausa · Yoruba · Igbo · Nigerian Pidgin" },
  2: { color: "var(--tier-2)", glyph: "T2", examples: "Efik · Tiv · Ibibio · Izon · Edo" },
  3: { color: "var(--tier-3)", glyph: "T3", examples: "Bekwarra · Bokyi · Nupe · Idoma" },
  4: { color: "var(--tier-4)", glyph: "T4", examples: "Ejagham · Ubang · Kiong · Reshe" },
};

export default function Tiers({ atlas }: { atlas: Atlas | null }) {
  const tiers = atlas?.meta.tiers;

  const counts = useMemo(() => {
    const c: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const seen = new Set<string>();
    atlas?.states.forEach((s) =>
      s.languages.forEach((l) => {
        const k = l.code + l.name;
        if (!seen.has(k)) {
          seen.add(k);
          c[l.tier]++;
        }
      }),
    );
    return c;
  }, [atlas]);

  if (!tiers) return null;

  return (
    <section className="section tiers" id="tiers">
      <div className="wrap">
        <header className="sec-head">
          <span className="eyebrow">Resource triage · not uniform treatment</span>
          <h2>
            You cannot build Whisper-grade ASR for 520 languages. So you{" "}
            <span className="u-ochre">triage</span>.
          </h2>
          <p className="sec-sub">
            Data density is wildly uneven, so treatment is too. Each tier gets a
            different strategy - from fine-tuning foundation models on the
            high-resource giants down to textless, visually-grounded speech for
            languages whose written corpora barely exist.
          </p>
        </header>

        <div className="tiers__grid">
          {[1, 2, 3, 4].map((t) => {
            const info = tiers[String(t)];
            const meta = TIER_META[t];
            return (
              <article
                key={t}
                className="tier glass grain"
                style={{ ["--tc" as string]: meta.color }}
              >
                <div className="tier__head">
                  <span className="tier__glyph" style={{ color: meta.color }}>
                    {meta.glyph}
                  </span>
                  <div>
                    <span className="tier__n mono">TIER {t}</span>
                    <h3 className="tier__label">{info.label}</h3>
                  </div>
                  <span className="tier__count" style={{ color: meta.color }}>
                    {counts[t]}
                  </span>
                </div>
                <p className="tier__desc">{info.desc}</p>
                <div className="tier__strategy">
                  <span className="mono">STRATEGY</span>
                  <p>{info.strategy}</p>
                </div>
                <p className="tier__examples ling">{meta.examples}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
