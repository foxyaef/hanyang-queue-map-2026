// 실행: node scripts/check-map-layout.mjs (Node 22.18+)
// 화면 겹침을 좌표로 검증합니다. 도로 외곽선의 실제 폭도 포함합니다.
import assert from 'node:assert/strict';
import { MAP_BUILDINGS, MAP_ROADS, THEATER_SEATING, THEATER_EAST_STAND, THEATER_STAGE,
  WRISTBAND_ONE_ROUTE, filledRoute } from '../app/maps/wristband-one-layout.ts';

function pointToSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = dx || dy ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}
function orient(a, b, p) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); }
function segmentDistance(a, b, c, d) {
  if (orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0) return 0;
  return Math.min(pointToSegment(a, c, d), pointToSegment(b, c, d), pointToSegment(c, a, b), pointToSegment(d, a, b));
}
function contains(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
const footprints = [...MAP_BUILDINGS,
  { id: 'theater-seating', points: THEATER_SEATING },
  { id: 'theater-east-stand', points: THEATER_EAST_STAND },
  { id: 'theater-stage', points: THEATER_STAGE },
];
let clearance = Infinity;
const collisions = [];
for (const building of footprints) {
  for (const road of MAP_ROADS) {
    let nearest = Infinity;
    for (let i = 1; i < road.points.length; i++) {
      if (contains(road.points[i], building.points)) nearest = 0;
      for (let j = 0; j < building.points.length; j++) {
        nearest = Math.min(nearest, segmentDistance(road.points[i - 1], road.points[i], building.points[j], building.points[(j + 1) % building.points.length]));
      }
    }
    const gap = nearest - (road.width + 6) / 2 - 1.5; // building stroke / 2
    clearance = Math.min(clearance, gap);
    if (gap < 5) collisions.push(`${building.id} / ${road.id}: ${gap.toFixed(1)} units`);
  }
}
assert.deepEqual(collisions, [], 'Road and building clearance failed');

// 시작점부터 끝점까지의 모든 값에서 경로 길이가 균일하게 늘어나는지 확인.
const length = (points) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0);
const total = length(WRISTBAND_ONE_ROUTE);
assert.deepEqual(filledRoute(WRISTBAND_ONE_ROUTE, 0), [WRISTBAND_ONE_ROUTE[0]]);
for (let value = 0; value <= 1000; value++) {
  const active = filledRoute(WRISTBAND_ONE_ROUTE, value);
  assert.deepEqual(active[0], WRISTBAND_ONE_ROUTE[0]);
  assert.ok(Math.abs(length(active) - total * value / 1000) < 1e-6, `Nonuniform queue at ${value}`);
}
assert.ok(Math.hypot(...filledRoute(WRISTBAND_ONE_ROUTE, 1000).at(-1).map((v, i) => v - WRISTBAND_ONE_ROUTE.at(-1)[i])) < 1e-6);

// 주차장 안쪽 시작 구간 이후에는 동선의 선 두께까지 실제 도로 안에 있어야 합니다.
for (const p of WRISTBAND_ONE_ROUTE.filter((p) => p[0] >= 789 || p[1] >= 986)) {
  const onRoad = MAP_ROADS.some((road) => road.points.slice(1).some((b, i) => pointToSegment(p, road.points[i], b) + 9 <= road.width / 2));
  assert.ok(onRoad, `Queue leaves road at ${p}`);
}
console.log(`PASS: ${footprints.length} building footprints × ${MAP_ROADS.length} roads; minimum clearance ${clearance.toFixed(1)} units.`);
console.log('PASS: queue stays within the road, with uniform booth-first growth at all 1001 values.');
