// 실행: node scripts/check-map-three.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    });
    module._compile(compiled.outputText, filename);
  };
}
const { THREE_BUILDINGS, THREE_ROADS, WRISTBAND_THREE_ROUTE, THREE_BOOTH, THREE_RIGHT_CLEARANCE,
  THREE_THEATER_SEATING, THREE_THEATER_STAGE, THREE_THEATER_EAST_STAND } = require('../app/maps/wristband-three-layout.ts');
const { filledRoute } = require('../app/maps/wristband-one-layout.ts');
const entrance = process.argv.includes('--entrance');
const entranceTwo = process.argv.includes('--entrance-two');
const { ENTRANCE_TWO_BUILDINGS, ENTRANCE_TWO_ROUTE, ENTRANCE_TWO_GATE, ENTRANCE_TWO_VIEW } = require('../app/maps/entrance-two-layout.ts');
const { MAP_ROADS, THEATER_SEATING, THEATER_STAGE, THEATER_EAST_STAND } = require('../app/maps/wristband-one-layout.ts');
const { ENTRANCE_ONE_BUILDINGS, ENTRANCE_ONE_ROADS, ENTRANCE_ONE_ROUTE, ENTRANCE_ONE_GATE,
  ENTRANCE_ONE_NORTH_BUILDING } = require('../app/maps/entrance-one-layout.ts');
const route = entranceTwo ? ENTRANCE_TWO_ROUTE : entrance ? ENTRANCE_ONE_ROUTE : WRISTBAND_THREE_ROUTE;
const booth = entranceTwo ? ENTRANCE_TWO_GATE : entrance ? ENTRANCE_ONE_GATE : THREE_BOOTH;

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
const footprints = entranceTwo ? [...ENTRANCE_TWO_BUILDINGS, { id: 'theater', points: THEATER_SEATING },
  { id: 'stage', points: THEATER_STAGE }, { id: 'east-stand', points: THEATER_EAST_STAND }] : [...(entrance ? ENTRANCE_ONE_BUILDINGS : THREE_BUILDINGS), { id: 'theater', points: THREE_THEATER_SEATING },
  { id: 'stage', points: THREE_THEATER_STAGE }, { id: 'east-stand', points: THREE_THEATER_EAST_STAND },
  ...(entrance ? [{ id: 'north-building', points: ENTRANCE_ONE_NORTH_BUILDING }] : [])];
let clearance = Infinity;
const collisions = [];
for (const building of footprints) {
  for (const road of [...(entranceTwo ? MAP_ROADS : entrance ? ENTRANCE_ONE_ROADS : THREE_ROADS), { id: 'queue', points: route, width: 20 }]) {
    let nearest = Infinity;
    for (let i = 1; i < road.points.length; i++) {
      if (contains(road.points[i - 1], building.points) || contains(road.points[i], building.points)) nearest = 0;
      for (let j = 0; j < building.points.length; j++) {
        nearest = Math.min(nearest, segmentDistance(road.points[i - 1], road.points[i], building.points[j], building.points[(j + 1) % building.points.length]));
      }
    }
    const gap = nearest - (road.width + 6) / 2 - 1.25;
    clearance = Math.min(clearance, gap);
    if (gap < 5) collisions.push(`${building.id} / ${road.id}: ${gap.toFixed(1)} units`);
  }
}
assert.deepEqual(collisions, [], 'Buildings must clear roads and queue');

function length(points) { return points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - points[i][0], p[1] - points[i][1]), 0); }
const total = length(route);
assert.deepEqual(filledRoute(route, 0), [booth]);
for (let value = 0; value <= 1000; value++) {
  const active = filledRoute(route, value);
  assert.deepEqual(active[0], booth, 'Queue must start at the booth / gate');
  assert.ok(Math.abs(length(active) - total * value / 1000) < 1e-6, `Uneven growth at ${value}`);
}
assert.deepEqual(filledRoute(WRISTBAND_THREE_ROUTE, -10), filledRoute(WRISTBAND_THREE_ROUTE, 0));
assert.deepEqual(filledRoute(WRISTBAND_THREE_ROUTE, 1100), filledRoute(WRISTBAND_THREE_ROUTE, 1000));
for (const p of THREE_RIGHT_CLEARANCE) {
  const nearest = Math.min(...WRISTBAND_THREE_ROUTE.slice(1).map((end, i) => pointToSegment(p, WRISTBAND_THREE_ROUTE[i], end)));
  assert.ok(nearest > 40, 'Keep the right-hand entrance space separate from the wristband route');
}
if (entrance) {
  for (let i = 1; i < route.length; i++) {
    for (let j = 1; j < WRISTBAND_THREE_ROUTE.length; j++) {
      assert.ok(segmentDistance(route[i - 1], route[i], WRISTBAND_THREE_ROUTE[j - 1], WRISTBAND_THREE_ROUTE[j]) > 28,
        'Entrance and wristband queues must remain separate');
    }
  }
}
if (entranceTwo) {
  assert.ok(booth[0] > route.at(-1)[0], 'Gate 2 must grow from right to left');
  for (const p of route) {
    assert.ok(p[0] > ENTRANCE_TWO_VIEW.left + 30 && p[0] < ENTRANCE_TWO_VIEW.left + ENTRANCE_TWO_VIEW.width - 30);
    assert.ok(p[1] > ENTRANCE_TWO_VIEW.top + 30 && p[1] < ENTRANCE_TWO_VIEW.top + ENTRANCE_TWO_VIEW.height - 30);
    assert.ok(MAP_ROADS.some((road) => road.points.slice(1).some((b, i) => pointToSegment(p, road.points[i], b) + 13 <= road.width / 2)),
      'Gate 2 queue stroke must fit within the road');
  }
}
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const name of ['one', 'two', 'three']) {
  const Map = require(`../app/maps/wristband-${name}-map.tsx`).default;
  const markup = renderToStaticMarkup(React.createElement(Map, { value: 500, locationName: '수령처' }));
  assert.match(markup, /class="campus-booth-label">수령처<\/text>/);
  assert.doesNotMatch(markup, /팔찌 부스 [123] · 시작/);
}
const EntranceMap = require('../app/maps/entrance-one-map.tsx').default;
const entranceMarkup = renderToStaticMarkup(React.createElement(EntranceMap, { value: 500, locationName: '입장문 1', overlayText: '입장 마감' }));
assert.match(entranceMarkup, /class="campus-booth-label">게이트<\/text>/);
assert.match(entranceMarkup, /입장 마감/);
assert.doesNotMatch(entranceMarkup, /class="campus-booth-label">수령처/);
const EntranceTwoMap = require('../app/maps/entrance-two-map.tsx').default;
const entranceTwoMarkup = renderToStaticMarkup(React.createElement(EntranceTwoMap, { value: 500, locationName: '입장문 2', overlayText: '입장 마감' }));
assert.match(entranceTwoMarkup, /class="campus-booth-label">게이트<\/text>/);
assert.match(entranceTwoMarkup, /입장 마감/);
assert.match(entranceTwoMarkup, /역사관/);
const EntranceThreeMap = require('../app/maps/entrance-three-map.tsx').default;
for (const value of [0, 500, 1000]) {
  const markup = renderToStaticMarkup(React.createElement(EntranceThreeMap, { value, locationName: '입장문 3', overlayText: '입장 마감' }));
  assert.match(markup, /class="campus-booth-label">게이트<\/text>/);
  assert.match(markup, /입장 마감/);
  assert.equal((markup.match(/class="campus-route-planned"/g) || []).length, 1, 'Gate 3 must be a single continuous section');
  assert.doesNotMatch(markup, /campus-passage-boundary|국제관 앞 통행 공간/);
}
console.log(`PASS: ${footprints.length} footprints clear all roads and the queue (min ${clearance.toFixed(1)} units).`);
console.log('PASS: all 1001 values grow from the booth; the right-hand entrance space stays clear.');
console.log('PASS: all three booth markers use the label 수령처.');
