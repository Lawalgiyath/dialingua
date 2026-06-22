import { geoMercator, geoPath } from "d3-geo";
import type { GeoProjection } from "d3-geo";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import statesRaw from "./nigeria-states.json";

export const states = statesRaw as unknown as FeatureCollection<
  Geometry,
  { name: string }
>;

/** Build a Mercator projection fit to a viewbox for Nigeria. */
export function makeProjection(width: number, height: number): GeoProjection {
  const proj = geoMercator();
  proj.fitExtent(
    [
      [8, 8],
      [width - 8, height - 8],
    ],
    states,
  );
  return proj;
}

export function statePaths(width: number, height: number) {
  const proj = makeProjection(width, height);
  const path = geoPath(proj);
  return states.features.map((f: Feature<Geometry, { name: string }>) => ({
    name: f.properties.name,
    d: path(f) ?? "",
    centroid: path.centroid(f),
  }));
}

/**
 * Sample points inside the Nigeria landmass for the stippled "language-density"
 * logo / point-cloud. Denser sampling near a centre weight (the Middle Belt),
 * thinner at the margins - an observatory star-chart of the country.
 */
export function densityPoints(
  width: number,
  height: number,
  count = 460,
  seed = 7,
): { x: number; y: number; r: number; w: number }[] {
  const proj = makeProjection(width, height);
  const path = geoPath(proj);
  // crude rasterized inside-test via the projected bounding polygons:
  const ctxPaths = states.features.map((f) => new Path2D(path(f) ?? ""));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Middle Belt focus (Plateau ~ 9.2N, 9.5E) projected:
  const focus = proj([8.9, 9.3]) ?? [width / 2, height / 2];

  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };

  const pts: { x: number; y: number; r: number; w: number }[] = [];
  let tries = 0;
  while (pts.length < count && tries < count * 40) {
    tries++;
    const x = rand() * width;
    const y = rand() * height;
    const inside = ctxPaths.some((p) => ctx.isPointInPath(p, x, y));
    if (!inside) continue;
    const dx = x - focus[0];
    const dy = y - focus[1];
    const dist = Math.hypot(dx, dy) / Math.hypot(width, height);
    // density weight: higher near focus
    const w = Math.max(0, 1 - dist * 1.6);
    if (rand() > 0.25 + w * 0.75) continue;
    pts.push({ x, y, r: 0.7 + w * 1.8, w });
  }
  return pts;
}
