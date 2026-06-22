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
          <span className="eyebrow">System architecture · hub & spoke</span>
          <h2>
            One backbone. Hundreds of lightweight{" "}
            <span className="u-ochre">adapters</span>.
          </h2>
          <p className="sec-sub">
            Not one model per language - that never scales to 520. A shared
            foundation (NLLB-200 / Whisper / MMS) carries the heavy lifting;
            ~4M-parameter LoRA/DoRA adapters specialise it per language or per
            related-language cluster. An orchestration layer routes each input by
            detected language and state to the right adapter.
          </p>
        </header>

        <div className="arch__diagram glass grain glass--shine">
          <div className="arch__col arch__col--in">
            <span className="arch__col-label mono">INPUT</span>
            <div className="arch__node arch__node--soft">English text / speech</div>
            <div className="arch__node arch__node--soft">Detected language + state</div>
          </div>

          <div className="arch__flow" aria-hidden="true">
            <svg viewBox="0 0 80 200" preserveAspectRatio="none">
              <path d="M0 100 C 40 100, 40 100, 80 100" className="arch__wire" />
            </svg>
          </div>

          <div className="arch__col arch__col--hub">
            <span className="arch__col-label mono">ORCHESTRATION</span>
            <div className="arch__router">
              <span className="arch__glyph"></span>
              Router
              <small>language → adapter</small>
            </div>
            <div className="arch__backbone">
              <span className="mono">SHARED BACKBONE</span>
              <strong>NLLB-200 · Whisper · MMS</strong>
              <small>tonal-aware tokenization · diacritic-preserving</small>
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
            <span className="arch__col-label mono">ADAPTERS (~4M params)</span>
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
              <h4>Cluster-shared adapters</h4>
              <p>
                Related languages share adapters - Bendi tongues adapt to one
                another far more easily than Bendi to Yoruba. Compute stays sane.
              </p>
            </div>
          </div>
          <div className="arch__note">
            <span className="arch__note-glyph"></span>
            <div>
              <h4>Offline-first edge</h4>
              <p>
                whisper.cpp + TFLite for deployment to rural areas with patchy
                connectivity - the model in this demo already runs fully offline.
              </p>
            </div>
          </div>
          <div className="arch__note">
            <span className="arch__note-glyph"></span>
            <div>
              <h4>Tonal embedding integrity</h4>
              <p>
                Diacritic-preserving tokenization keeps tone marks (á à ā â ǎ) and
                subdot vowels intact - most Nigerian languages are tonal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
