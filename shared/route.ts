// DB에는 SVG 문자열 대신 숫자 좌표만 저장합니다. v1 좌표계는 기존 지도와 동일합니다.
export type Point = readonly [number, number];
export type RouteData = { schemaVersion: 1; sections: Point[][]; rounding: number };
export const routeIds = ['wristband-1', 'wristband-2', 'wristband-3', 'entrance-1', 'entrance-2', 'entrance-3'] as const;
export function validRoute(value: unknown): value is RouteData {
  if (!value || typeof value !== 'object') return false;
  const r = value as RouteData;
  return r.schemaVersion === 1 && Number.isFinite(r.rounding) && r.rounding >= 0 && r.rounding <= 24
    && Array.isArray(r.sections) && r.sections.length > 0 && r.sections.length <= 8
    && r.sections.every(s => Array.isArray(s) && s.length >= 2 && s.length <= 120
      && s.every(p => Array.isArray(p) && p.length === 2 && p.every(n => typeof n === 'number' && Number.isFinite(n) && n >= -1000 && n <= 3000))
      && length(s) > 2)
    && r.sections.reduce((n, s) => n + s.length, 0) <= 240;
}
export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const length = (p: readonly Point[]) => p.slice(1).reduce((n, q, i) => n + distance(p[i], q), 0);
export function segmentDistance(p: Point, a: Point, b: Point) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}
export function simplify(p: readonly Point[], tolerance = 1.5): Point[] {
  if (p.length <= 2) return [...p];
  let max = tolerance, index = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = segmentDistance(p[i], p[0], p[p.length - 1]);
    if (d > max) { max = d; index = i; }
  }
  return index ? [...simplify(p.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(p.slice(index), tolerance)] : [p[0], p[p.length - 1]];
}
// 열린 선의 시작/끝을 고정하고 모서리만 작게 둥글립니다. 과도한 곡선 돌출을 피합니다.
export function smooth(p: readonly Point[], radius: number): Point[] {
  if (!radius || p.length < 3) return [...p];
  const result: Point[] = [p[0]];
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1], b = p[i], c = p[i + 1];
    const before = distance(a, b), after = distance(b, c);
    if (!before || !after) continue;
    const r = Math.min(radius, before / 3, after / 3);
    const start: Point = [b[0] + (a[0] - b[0]) * r / before, b[1] + (a[1] - b[1]) * r / before];
    const end: Point = [b[0] + (c[0] - b[0]) * r / after, b[1] + (c[1] - b[1]) * r / after];
    for (let k = 0; k <= 8; k++) { const t = k / 8, s = 1 - t; result.push([s*s*start[0]+2*s*t*b[0]+t*t*end[0], s*s*start[1]+2*s*t*b[1]+t*t*end[1]]); }
  }
  return [...result, p[p.length - 1]];
}
export const renderedSections = (r: RouteData) => r.sections.map(s => smooth(s, r.rounding));
// 끊어진 구간 사이 거리는 길이에 포함하지 않습니다.
export function fillSections(sections: readonly (readonly Point[])[], value: number): Point[][] {
  let remaining = sections.reduce((n, s) => n + length(s), 0) * Math.max(0, Math.min(1000, value)) / 1000;
  return sections.map(s => {
    if (remaining <= 0) return [];
    const result: Point[] = [s[0]];
    for (let i = 1; i < s.length && remaining > 0; i++) {
      const d = distance(s[i-1], s[i]);
      if (d <= remaining) result.push(s[i]);
      else { const t = remaining / d; result.push([s[i-1][0]+t*(s[i][0]-s[i-1][0]), s[i-1][1]+t*(s[i][1]-s[i-1][1])]); }
      remaining = Math.max(0, remaining - d);
    }
    return result;
  });
}
