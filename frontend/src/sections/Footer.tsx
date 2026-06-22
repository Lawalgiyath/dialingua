import Logo from "../components/Logo";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <hr className="divider" />
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo size={32} variant="outline" showWordmark />
            <p>
              A scaling framework for speech and translation AI across Nigeria's
              520+ indigenous languages. Prototype.
            </p>
          </div>

          <div className="footer__col">
            <h5>Engines</h5>
            <ul>
              <li>Meta NLLB-200 (local, offline)</li>
              <li>Claude research-mode (key-gated)</li>
              <li>Curated linguistic corpus</li>
            </ul>
          </div>

          <div className="footer__col">
            <h5>Data provenance</h5>
            <ul>
              <li>geoBoundaries ADM1 (CC-BY 4.0)</li>
              <li>Ethnologue / Glottolog estimates</li>
              <li>Comparative Benue-Congo sources</li>
            </ul>
          </div>

          <div className="footer__col">
            <h5>Honest scope</h5>
            <ul>
              <li>~80 of 520 languages sampled</li>
              <li>5 languages run on the real model</li>
              <li>Tone data reconstructed where noted</li>
            </ul>
          </div>
        </div>

        <p className="footer__note">
          <strong>Prototype, built in good faith.</strong> Translations for
          high-resource languages are genuine neural-model output; research-mode
          results are clearly labelled and should not be treated as
          native-verified. Speaker figures are best-available estimates. The
          framework's purpose is to make the path from endangered language to
          working AI explicit - and to be honest at every step about what is known
          and what must still be collected.
        </p>
        <p className="footer__sign mono">
          DIALINGUA · ÈDÈ KÌ Í KÚ - a language does not die
        </p>
      </div>
    </footer>
  );
}
