import "./aurora.css";

/**
 * Drifting indigo + ochre radial blobs over a deep-indigo canvas, with an
 * adire-grid texture and a coordinate hairline grid (the "observatory" floor).
 * Provides the refraction surface that makes the glass read as glass.
 * Motion respects prefers-reduced-motion (see aurora.css).
 */
export default function AuroraBg() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--indigo" />
      <div className="aurora__blob aurora__blob--ochre" />
      <div className="aurora__blob aurora__blob--deep" />
      <div className="aurora__grid" />
      <div className="aurora__adire adire-grid" />
      <div className="aurora__vignette" />
    </div>
  );
}
