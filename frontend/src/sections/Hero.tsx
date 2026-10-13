import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import type { Atlas } from "../lib/types";
import "./hero.css";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1300;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      {n.toLocaleString()}
      {suffix}
    </>
  );
}

export default function Hero({ atlas }: { atlas: Atlas | null }) {
  const m = atlas?.meta;
  return (
    <section className="hero section" id="top">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <span className="eyebrow">National Language AI Platform · Nigeria</span>
          <h1 className="hero__title">
            Bringing AI to{" "}
            <span className="hero__accent">every Nigerian language</span>, not just the big five.
          </h1>
          <p className="hero__lede">
            Dialingua makes speech and translation technology work for all Nigerian 
            languages - from widely spoken Yoruba, Igbo and Hausa to the endangered 
            languages of Cross River State. We're building AI that preserves cultural 
            heritage while connecting communities.
          </p>
          <p className="hero__yoruba ling" lang="yo">
            “Èdè kì í kú” - <span className="hero__gloss">a language does not die.</span>
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary" href="#studio">
              Translate something
            </a>
            <a className="btn" href="#atlas">
              Explore the atlas
            </a>
          </div>

          <dl className="hero__stats">
            <div>
              <dt>
                <Counter to={m?.living_languages ?? 520} suffix="+" />
              </dt>
              <dd>living languages</dd>
            </div>
            <div>
              <dt>
                <Counter to={atlas?.states.length ?? 37} />
              </dt>
              <dd>states + FCT</dd>
            </div>
            <div>
              <dt>
                <Counter to={m?.endangered_est ?? 165} />
              </dt>
              <dd>endangered</dd>
            </div>
            <div>
              <dt>
                <Counter to={m?.families.length ?? 4} />
              </dt>
              <dd>language families</dd>
            </div>
          </dl>
        </div>

        <div className="hero__map glass grain glass--shine">
          <div className="hero__map-head">
            <span className="mono">FIG.01 - LANGUAGE-DENSITY FIELD</span>
            <span className="mono hero__coords">9.08°N · 8.68°E</span>
          </div>
          <div className="hero__map-stage">
            <Logo size={360} variant="stipple" />
          </div>
          <p className="hero__map-cap">
            Each point a language; the field thickens over the Middle Belt - among
            the most linguistically dense regions on earth. The Niger–Benue
            confluence threads through as the recurring family-tree glyph.
          </p>
        </div>
      </div>
    </section>
  );
}
