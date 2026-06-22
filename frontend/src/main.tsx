import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Fonts - Fraunces (display), Inter (UI), Charis SIL (tone marks + IPA), JetBrains Mono (codes)
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/charis-sil/400.css";
import "@fontsource/charis-sil/700.css";
import "@fontsource-variable/jetbrains-mono";

// Design system
import "./design/tokens.css";
import "./design/base.css";
import "./design/glass.css";
import "./index.css";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
