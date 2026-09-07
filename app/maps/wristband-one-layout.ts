// 팔찌 수령처 1 · 사용자 제공 지도(2026-09-07)의 동일한 좌표계.
// 도로와 건물은 독립 데이터입니다. 동선을 바꾸기 위해 도로를 이동하지 마세요.
export type MapPoint = readonly [number, number];

// 건물의 작은 굴곡 대신 일정한 반경의 모서리를 사용합니다.
// 반환된 외곽은 화면 표시와 도로 겹침 검사에서 함께 사용합니다.
export function softenCorners(points: readonly MapPoint[], radius = 12): MapPoint[] {
  return points.flatMap((point, index) => {
    const prev = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const before = Math.hypot(prev[0] - point[0], prev[1] - point[1]);
    const after = Math.hypot(next[0] - point[0], next[1] - point[1]);
    const inset = Math.min(radius, before / 2, after / 2);
    const start = point.map((coordinate, axis) => coordinate + (prev[axis] - coordinate) * inset / before);
    const end = point.map((coordinate, axis) => coordinate + (next[axis] - coordinate) * inset / after);
    return Array.from({ length: 9 }, (_, i): MapPoint => {
      const t = i / 8;
      return [(1 - t) ** 2 * start[0] + 2 * (1 - t) * t * point[0] + t ** 2 * end[0],
        (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * point[1] + t ** 2 * end[1]];
    });
  });
}

export function curve(start: MapPoint, a: MapPoint, b: MapPoint, end: MapPoint, steps = 32): MapPoint[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const s = 1 - t;
    return [s ** 3 * start[0] + 3 * s ** 2 * t * a[0] + 3 * s * t ** 2 * b[0] + t ** 3 * end[0],
      s ** 3 * start[1] + 3 * s ** 2 * t * a[1] + 3 * s * t ** 2 * b[1] + t ** 3 * end[1]];
  });
}

export const MAP_SIZE = { width: 1080, height: 1620 };
export const MAP_ROADS: { id: string; width: number; points: MapPoint[] }[] = [
  { id: 'west-campus-road', width: 44, points: [
    [36, -30], [38, 603], ...curve([38, 603], [43, 890], [52, 1135], [88, 1220]),
    ...curve([88, 1220], [103, 1254], [144, 1260], [147, 1300]), [147, 1650],
  ] },
  { id: 'north-of-theater', width: 44, points: [
    ...curve([38, 382], [76, 216], [178, 136], [310, 137]),
    ...curve([310, 137], [433, 124], [550, 224], [663, 226]),
    ...curve([663, 226], [745, 226], [746, 278], [753, 306]),
  ] },
  { id: 'theater-to-parking', width: 44, points: [
    [38, 610], [226, 614], ...curve([226, 614], [250, 614], [253, 603], [285, 603]),
    [743, 603], ...curve([743, 603], [791, 603], [799, 518], [901, 516]), [1110, 500],
  ] },
  { id: 'museum-east-road', width: 42, points: [
    ...curve([280, 604], [265, 610], [267, 634], [267, 658]), [267, 968],
    ...curve([267, 968], [270, 1008], [258, 1023], [234, 1040]),
  ] },
  { id: 'parking-east-road', width: 48, points: [
    ...curve([814, 552], [803, 581], [791, 619], [797, 681]),
    ...curve([797, 681], [800, 773], [814, 910], [798, 986]),
    ...curve([798, 986], [790, 1008], [785, 1008], [758, 1008]),
  ] },
  { id: 'parking-south-road', width: 48, points: [
    [782, 1008], [342, 1008], ...curve([342, 1008], [304, 1008], [267, 1026], [234, 1040]),
    ...curve([234, 1040], [190, 1081], [171, 1136], [156, 1188]),
    ...curve([156, 1188], [143, 1232], [144, 1258], [147, 1300]),
  ] },
  { id: 'south-of-industrial-center', width: 46, points: [
    ...curve([796, 995], [817, 1106], [875, 1104], [1100, 1104]),
  ] },
  { id: 'east-campus-road', width: 34, points: [
    [972, -30], ...curve([972, 0], [971, 194], [955, 351], [970, 510]),
  ] },
  { id: 'southern-main-road', width: 94, points: [
    ...curve([150, 1680], [390, 1646], [600, 1572], [722, 1450]), [1110, 1190],
  ] },
];

const BUILDING_FOOTPRINTS: {
  id: string; name: string; number: string; points: MapPoint[];
  label: MapPoint; lines: string[]; small?: boolean;
}[] = [
  { id: 'future-auto', name: '미래자동차 연구센터', number: '210동',
    points: [[135, -15], [506, -15], [506, 91], [135, 91]], label: [320, 38], lines: ['미래자동차 연구센터'], small: true },
  { id: 'engineering-2', name: '제2공학관', number: '211동',
    points: [[637, 20], [863, 20], [932, 430], [814, 440], [797, 155], [632, 155]],
    label: [865, 250], lines: ['제2', '공학관'] },
  { id: 'museum', name: '박물관', number: '109동',
    points: [[108, 711], [226, 711], [226, 947], [108, 947]],
    label: [169, 820], lines: ['박물관'] },
  { id: 'industrial-center', name: '공업센터본관', number: '206동',
    points: [[877, 570], [1040, 555], [1064, 1019], [920, 1019]],
    label: [970, 790], lines: ['공업센터', '본관'] },
  { id: 'materials', name: '신소재공학관', number: '204동',
    points: [[283, 1093], [655, 1093], [655, 1143], [890, 1143], [890, 1248], [521, 1248], [521, 1197], [283, 1197]],
    label: [575, 1168], lines: ['신소재공학관'] },
  { id: 'science', name: '과학기술관', number: '203동',
    points: [[252, 1315], [427, 1340], [548, 1480], [442, 1540], [363, 1430], [252, 1430]],
    label: [370, 1399], lines: ['과학기술관'] },
  { id: 'architecture', name: '건축관', number: '202동',
    points: [[195, 1457], [263, 1457], [297, 1590], [195, 1590]],
    label: [248, 1515], lines: ['건축관'], small: true },
  { id: 'civil', name: '재성토목관', number: '201동',
    points: [[-20, 1310], [90, 1310], [105, 1580], [-20, 1580]],
    label: [43, 1450], lines: ['재성', '토목관'], small: true },
];

export const MAP_BUILDINGS = BUILDING_FOOTPRINTS.map((building) => ({
  ...building, points: softenCorners(building.points),
}));

function seatingArc(rx: number, ry: number): MapPoint[] {
  return Array.from({ length: 49 }, (_, i) => {
    const angle = Math.PI + Math.PI * i / 48;
    return [353 + rx * Math.cos(angle), 486 + ry * Math.sin(angle)];
  });
}

export const THEATER_SEATING = [...seatingArc(268, 298), ...seatingArc(151, 178).reverse()];
export const THEATER_TIERS = Array.from({ length: 5 }, (_, i) => seatingArc(167 + i * 21, 194 + i * 22));
export const THEATER_EAST_STAND = softenCorners([[630, 387], [748, 387], [748, 465], [693, 555], [504, 555], [504, 512]]);
export const THEATER_STAGE = softenCorners([[289, 444], [414, 444], [459, 484], [428, 560], [278, 560], [247, 484]]);

// 동선 수정 위치: 첫 점은 팔찌 부스(수령 시작점), 마지막 점은 최대 대기 지점.
// 초록/청록색으로 표시해주신 구간을 하나의 연속 동선으로 옮겼습니다.
export const WRISTBAND_ONE_ROUTE: MapPoint[] = [
  [599, 661], [768, 661], ...curve([768, 661], [791, 661], [797, 665], [797, 691]),
  ...curve([797, 691], [800, 788], [808, 907], [798, 986]),
  ...curve([798, 986], [798, 1008], [790, 1008], [766, 1008]), [342, 1008],
  ...curve([342, 1008], [304, 1008], [267, 1026], [234, 1040]),
  ...curve([234, 1040], [190, 1081], [166, 1150], [154, 1210]),
];

export function pointsAttribute(points: readonly MapPoint[]) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
}

// 각 구간의 실제 길이를 누적하므로 직선과 곡선 모두 0~1000에 균일하게 대응합니다.
export function filledRoute(points: readonly MapPoint[], value: number): MapPoint[] {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1000, value)) / 1000;
  const result: MapPoint[] = [points[0]];
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= 0) break;
    const length = lengths[i];
    if (length === 0) continue;
    if (remaining >= length) {
      result.push(points[i + 1]);
      remaining -= length;
    } else {
      const fraction = remaining / length;
      result.push([points[i][0] + (points[i + 1][0] - points[i][0]) * fraction,
        points[i][1] + (points[i + 1][1] - points[i][1]) * fraction]);
      break;
    }
  }
  return result;
}
