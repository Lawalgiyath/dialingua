import Logo from "./Logo";
import "./nav.css";

const LINKS = [
  { href: "#atlas", label: "Atlas" },
  { href: "#studio", label: "Studio" },
  { href: "#tiers", label: "Tiers" },
  { href: "#architecture", label: "Architecture" },
];

interface Props {
  health?: { research: { mode: string }; nllb: { state: string } } | null;
}

export default function Nav({ health }: Props) {
  const mode = health?.research.mode;
  return (
    <header className="nav">
      <div className="nav__inner glass glass--shine grain">
        <a href="#top" className="nav__brand">
          <Logo size={34} variant="outline" />
          <span className="nav__word">Dialingua</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <span
            className="chip nav__engine"
            title={
              mode === "claude"
                ? "Live Claude research-mode enabled"
                : "Offline: local NLLB model + curated corpus"
            }
          >
            <span
              className="nav__dot"
              style={{
                background:
                  mode === "claude" ? "var(--ochre-400)" : "var(--success)",
              }}
            />
            {mode === "claude" ? "Claude + NLLB" : "Offline · NLLB"}
          </span>
          <a className="btn btn--primary nav__cta" href="#studio">
            Open Studio
          </a>
        </div>
      </div>
    </header>
  );
}
