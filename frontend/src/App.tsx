import { useEffect, useState } from "react";
import AuroraBg from "./components/AuroraBg";
import Nav from "./components/Nav";
import Hero from "./sections/Hero";
import AtlasSection from "./sections/Atlas";
import Studio from "./sections/Studio";
import Tiers from "./sections/Tiers";
import Architecture from "./sections/Architecture";
import Footer from "./sections/Footer";
import { fetchAtlas, fetchHealth } from "./lib/api";
import type { Atlas, Health } from "./lib/types";

export default function App() {
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchAtlas().then(setAtlas).catch((e) => setErr(e.message));
    fetchHealth().then(setHealth).catch(() => {});
  }, []);

  return (
    <>
      <AuroraBg />
      <Nav health={health} />
      <main>
        <Hero atlas={atlas} />
        {err && (
          <div
            className="wrap"
            style={{ color: "var(--danger)", padding: "20px 0" }}
          >
            Error: Could not reach the Dialingua API ({err}). Start the backend:{" "}
            <code className="mono">python backend/main.py</code>
          </div>
        )}
        <AtlasSection atlas={atlas} />
        <Studio atlas={atlas} health={health} />
        <Tiers atlas={atlas} />
        <Architecture />
      </main>
      <Footer />
    </>
  );
}
