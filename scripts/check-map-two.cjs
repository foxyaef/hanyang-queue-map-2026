// 실행: node scripts/check-map-two.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  module._compile(compiled.outputText, filename);
};
const { TWO_BUILDINGS, TWO_ROADS, TWO_ROUTE_SECTIONS, TWO_CLEAR_PASSAGE, TWO_BOOTH,
  TWO_THEATER_SEATING, TWO_THEATER_STAGE, filledTwoSections, sectionLength } = require('../app/maps/wristband-two-layout.ts');
const { ENTRANCE_THREE_ROADS, ENTRANCE_THREE_ROUTE, ENTRANCE_THREE_GATE } = require('../app/maps/entrance-three-layout.ts');
const { filledRoute } = require('../app/maps/wristband-one-layout.ts');

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
const footprints = [...TWO_BUILDINGS, { id: 'theater', points: TWO_THEATER_SEATING }, { id: 'stage', points: TWO_THEATER_STAGE }];
let clearance = Infinity;
const collisions = [];
for (const building of footprints) {
  for (const road of [...ENTRANCE_THREE_ROADS, ...TWO_ROUTE_SECTIONS.map((points, i) => ({ id: `queue-section-${i + 1}`, points, width: 20 }))]) {
    let nearest = Infinity;
    for (let i = 1; i < road.points.length; i++) {
      if (contains(road.points[i], building.points)) nearest = 0;
      for (let j = 0; j < building.points.length; j++) {
        nearest = Math.min(nearest, segmentDistance(road.points[i - 1], road.points[i], building.points[j], building.points[(j + 1) % building.points.length]));
      }
    }
    const gap = nearest - (road.width + 6) / 2 - 1.25;
    clearance = Math.min(clearance, gap);
    if (gap < 5) collisions.push(`${building.id} / ${road.id}: ${gap.toFixed(1)} units`);
  }
}
assert.deepEqual(collisions, [], 'Building / road or queue overlap');
const lengths = TWO_ROUTE_SECTIONS.map(sectionLength), total = lengths.reduce((sum, length) => sum + length, 0);
const passageCenter = TWO_CLEAR_PASSAGE.from.map((n, i) => (n + TWO_CLEAR_PASSAGE.to[i]) / 2);
assert.deepEqual(filledTwoSections(0), [[], []]);
for (let value = 1; value <= 1000; value++) {
  const sections = filledTwoSections(value);
  assert.equal(sections.length, 2);
  assert.deepEqual(sections[0][0], TWO_BOOTH);
  assert.ok(Math.abs(sections.reduce((sum, section) => sum + sectionLength(section), 0) - total * value / 1000) < 1e-6, `Uneven growth at ${value}`);
  for (const section of sections) {
    for (let i = 1; i < section.length; i++) {
      assert.ok(pointToSegment(passageCenter, section[i - 1], section[i]) > 34, `Passage filled at ${value}`);
    }
  }
}
const boundary = lengths[0] / total * 1000;
assert.equal(filledTwoSections(boundary)[1].length, 0, 'Second section should wait for the first');
assert.ok(filledTwoSections(boundary + .01)[1].length > 1, 'Queue should continue immediately after the gap');
for (const [i, section] of filledTwoSections(1000).entries()) {
  assert.ok(Math.hypot(...section.at(-1).map((n, axis) => n - TWO_ROUTE_SECTIONS[i].at(-1)[axis])) < 1e-6);
}
console.log(`PASS: ${footprints.length} footprints clear all roads and both queue sections (min ${clearance.toFixed(1)} units).`);
console.log('PASS: 0–1000 uniform growth excludes the passage; even the full queue leaves it empty.');

const entranceLength = sectionLength(ENTRANCE_THREE_ROUTE);
assert.deepEqual(ENTRANCE_THREE_ROADS, TWO_ROADS, 'Do not invent a road to fit gate 3');
for (const p of ENTRANCE_THREE_ROUTE) {
  assert.ok(TWO_ROADS.some((road) => road.points.slice(1).some((b, i) => pointToSegment(p, road.points[i], b) + 13 <= road.width / 2)),
    `Gate 3 entire stroke must fit inside the original road at ${p}`);
}
assert.ok(ENTRANCE_THREE_GATE[1] < ENTRANCE_THREE_ROUTE.at(-1)[1], 'Gate 3 must grow southwards');
for (let value = 0; value <= 1000; value++) {
  const active = filledRoute(ENTRANCE_THREE_ROUTE, value);
  assert.deepEqual(active[0], ENTRANCE_THREE_GATE);
  assert.ok(Math.abs(sectionLength(active) - entranceLength * value / 1000) < 1e-6);
  for (let i = 1; i < active.length; i++) assert.ok(active[i][1] >= active[i - 1][1], 'Gate 3 should remain continuous and go south');
}
for (let i = 1; i < ENTRANCE_THREE_ROUTE.length; i++) {
  for (const section of TWO_ROUTE_SECTIONS) for (let j = 1; j < section.length; j++) {
    assert.ok(segmentDistance(ENTRANCE_THREE_ROUTE[i - 1], ENTRANCE_THREE_ROUTE[i], section[j - 1], section[j]) > 28,
      'Gate 3 and wristband 2 must stay separate');
  }
}
console.log('PASS: gate 3 grows continuously southwards at all 1001 values, separate from wristband 2.');
let previousAngle;
for (let i = 1; i < ENTRANCE_THREE_ROUTE.length; i++) {
  const dx = ENTRANCE_THREE_ROUTE[i][0] - ENTRANCE_THREE_ROUTE[i - 1][0];
  const dy = ENTRANCE_THREE_ROUTE[i][1] - ENTRANCE_THREE_ROUTE[i - 1][1];
  assert.ok(dx >= 0 && dy > 0, 'Gate 3 should not wiggle back and forth');
  const angle = Math.atan2(dy, dx);
  if (previousAngle !== undefined) assert.ok(Math.abs(angle - previousAngle) < Math.PI / 180, 'Gate 3 should not kink');
  previousAngle = angle;
}
console.log('PASS: gate 3 follows one smooth curve without sideways reversals or abrupt turns.');
