import "./architecture.css";

const ADAPTERS = [
  { code: "yor", name: "Yoruba", engine: "nllb" },
  { code: "ibo", name: "Igbo", engine: "nllb" },
  { code: "hau", name: "Hausa", engine: "nllb" },
  { code: "efi", name: "Lower Cross ⋯ Efik · Ibibio", engine: "research" },
  { code: "bnd", name: "Bendi ⋯ Bokyi", engine: "research" },
  { code: "ijo", name: "Ijoid ⋯ Izon", engine: "research" },
];

export default function Architecture() {
  return (
    <section className="section arch" id="architecture">
      <div className="wrap">
        <header className="sec-head">
          <span className="eyebrow">How It Works</span>
          <h2>
            Smart technology that{" "}
            <span className="u-ochre">scales</span> to every language.
          </h2>
          <p className="sec-sub">
            We use a powerful core AI system that adapts to each Nigerian language. 
            Instead of building separate models for 520+ languages, we created a flexible 
            platform that learns each language's unique characteristics - from tones and 
            dialects to regional variations.
          </p>
        </header>

        <div className="arch__diagram glass grain glass--shine">
          <div className="arch__col arch__col--in">
            <span className="arch__col-label mono">YOUR TEXT</span>
            <div className="arch__node arch__node--soft">English text or speech</div>
            <div className="arch__node arch__node--soft">Language detection</div>
          </div>

          <div className="arch__flow" aria-hidden="true">
            <svg viewBox="0 0 80 200" preserveAspectRatio="none">
              <path d="M0 100 C 40 100, 40 100, 80 100" className="arch__wire" />
            </svg>
          </div>

          <div className="arch__col arch__col--hub">
            <span className="arch__col-label mono">AI SYSTEM</span>
            <div className="arch__router">
              <span className="arch__glyph"></span>
              Smart Router
              <small>matches your language</small>
            </div>
            <div className="arch__backbone">
              <span className="mono">CORE AI PLATFORM</span>
              <strong>Advanced Language Models</strong>
              <small>preserves tones and special characters</small>
            </div>
          </div>

          <div className="arch__flow" aria-hidden="true">
            <svg viewBox="0 0 80 200" preserveAspectRatio="none">
              <path d="M0 100 C 40 60, 40 60, 80 30" className="arch__wire" />
              <path d="M0 100 C 40 100, 40 100, 80 100" className="arch__wire" />
              <path d="M0 100 C 40 140, 40 140, 80 170" className="arch__wire" />
            </svg>
          </div>

          <div className="arch__col arch__col--out">
            <span className="arch__col-label mono">LANGUAGE SPECIALISTS</span>
            <div className="arch__adapters">
              {ADAPTERS.map((a) => (
                <div
                  key={a.code}
                  className="arch__adapter"
                  style={{
                    borderColor:
                      a.engine === "nllb"
                        ? "var(--success)"
                        : "var(--ochre-500)",
                  }}
                >
                  <span className="arch__adapter-dot" style={{
                    background: a.engine === "nllb" ? "var(--success)" : "var(--ochre-400)",
                  }} />
                  {a.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="arch__notes">
          <div className="arch__note">
            <span className="arch__note-glyph"></span>
            <div>
              <h4>Bekwarra Pilot Program</h4>
              <p>
                We're partnering with the Bekwarra community to preserve their endangered 
                language through AI. This pilot demonstrates how technology can help 
                document and revitalize languages with fewer than 100,000 speakers.
              </p>
            </div>
          </div>
          <div className="arch__note">
            <span className="arch__note-glyph"></span>
            <div>
              <h4>Works Offline</h4>
              <p>
                Our technology works in areas with limited internet connectivity. 
                Communities in rural regions can access translation and speech tools 
                even without reliable data connections.
              </p>
            </div>
          </div>
          <div className="arch__note">
            <span className="arch__note-glyph"></span>
            <div>
              <h4>Preserves Tones & Accents</h4>
              <p>
                Nigerian languages use tones and special characters that change meaning. 
                Our system keeps these intact (á à ā â ǎ), ensuring accurate translations 
                that respect each language's unique sound system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
