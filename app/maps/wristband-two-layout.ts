import { curve, filledRoute, softenCorners, type MapPoint } from './wristband-one-layout';

// 팔찌 부스 2: 제공한 지도의 본관~재성토목관 구간. 원본의 상대 위치를 유지합니다.
// 아래 좌표는 945px 너비 참고 이미지 기준이며 표시할 때 부스 1과 같은 축척으로 변환합니다.
const scale = 1080 / 945;
export const projectTwo = ([x, y]: MapPoint): MapPoint => [x * scale, (y - 250) * scale];
export const projectPoints = (points: readonly MapPoint[]) => points.map(projectTwo);
export const TWO_MAP_SIZE = { width: 1080, height: 1860 };

const roads: { id: string; width: number; points: MapPoint[] }[] = [
  { id: 'history-east', width: 46, points: [
    ...curve([395, 193], [460, 278], [535, 465], [531, 594]),
    ...curve([531, 594], [528, 729], [512, 862], [516, 976]),
  ] },
  { id: 'theater-north', width: 44, points: [
    ...curve([523, 740], [595, 554], [739, 506], [971, 610]),
  ] },
  { id: 'theater-south', width: 40, points: [[516, 979], [715, 979], [970, 977]] },
  { id: 'international-east', width: 58, points: [
    [516, 976], ...curve([516, 976], [520, 1002], [520, 1038], [520, 1060]),
    ...curve([520, 1060], [516, 1180], [519, 1420], [523, 1528]),
  ] },
  { id: 'civil-east', width: 48, points: [
    ...curve([523, 1528], [550, 1545], [608, 1529], [612, 1620]),
    ...curve([612, 1620], [617, 1770], [619, 1870], [608, 1920]),
  ] },
  { id: 'aejimon-access', width: 44, points: [
    ...curve([515, 1016], [429, 984], [323, 912], [247, 871]),
    ...curve([247, 871], [206, 846], [190, 886], [188, 929]),
    ...curve([188, 929], [183, 1034], [239, 1179], [269, 1227]), [318, 1209],
  ] },
  { id: 'museum-east', width: 40, points: [
    ...curve([752, 979], [730, 979], [732, 1000], [732, 1032]), [732, 1292],
    ...curve([732, 1292], [732, 1322], [683, 1352], [663, 1391]),
    ...curve([663, 1391], [641, 1432], [618, 1496], [621, 1540]),
  ] },
  { id: 'parking-south', width: 42, points: [[713, 1330], [964, 1330]] },
];
export const TWO_ROADS = roads.map((road) => ({ ...road, width: road.width * scale, points: projectPoints(road.points) }));

const buildings: {
  id: string; name: string; number: string; points: MapPoint[];
  label: MapPoint; lines: string[]; small?: boolean;
}[] = [
  { id: 'main-hall', name: '본관', number: '102동', points: [[144, 273], [355, 273], [355, 360], [432, 360], [432, 442], [73, 442], [73, 321], [144, 321]], label: [252, 353], lines: ['본관'] },
  { id: 'future-auto', name: '미래자동차 연구센터', number: '210동', points: [[512, 321], [670, 328], [936, 440], [936, 520], [628, 514]], label: [751, 429], lines: ['미래자동차', '연구센터'] },
  { id: 'history', name: '역사관', number: '101동', points: [[395, 489], [465, 489], [478, 864], [403, 864], [403, 780], [422, 780], [422, 550], [395, 550]], label: [438, 686], lines: ['역사관'], small: true },
  { id: 'international', name: '국제관', number: '108동', points: [[359, 1110], [449, 1097], [475, 1307], [383, 1321]], label: [417, 1190], lines: ['국제관'] },
  { id: 'tokeon', name: '토건관', number: '', points: [[365, 1345], [453, 1330], [477, 1520], [343, 1520], [343, 1471], [372, 1465]], label: [413, 1435], lines: ['토건관'] },
  { id: 'museum', name: '박물관', number: '109동', points: [[590, 1058], [681, 1058], [694, 1267], [589, 1267]], label: [640, 1164], lines: ['박물관'] },
  { id: 'materials', name: '신소재공학관', number: '204동', points: [[757, 1384], [965, 1384], [965, 1504], [859, 1504], [859, 1474], [716, 1474], [716, 1434], [757, 1434]], label: [859, 1424], lines: ['신소재', '공학관'], small: true },
  { id: 'civil', name: '재성토목관', number: '201동', points: [[409, 1580], [551, 1580], [576, 1866], [535, 1866]], label: [519, 1739], lines: ['재성', '토목관'], small: true },
  { id: 'science', name: '과학기술관', number: '203동', points: [[721, 1588], [923, 1588], [958, 1650], [958, 1790], [764, 1760], [710, 1677], [674, 1650], [674, 1627], [721, 1627]], label: [849, 1692], lines: ['과학기술관'] },
  { id: 'architecture', name: '건축관', number: '202동', points: [[666, 1710], [707, 1710], [707, 1754], [742, 1754], [756, 1868], [666, 1868]], label: [711, 1807], lines: ['건축관'], small: true },
];
export const TWO_BUILDINGS = buildings.map((building) => ({
  ...building, label: projectTwo(building.label), points: softenCorners(projectPoints(building.points)),
}));

function theaterArc(rx: number, ry: number): MapPoint[] {
  return Array.from({ length: 49 }, (_, i) => {
    const angle = Math.PI + Math.PI * i / 48;
    return projectTwo([805 + rx * Math.cos(angle), 884 + ry * Math.sin(angle)]);
  });
}
export const TWO_THEATER_SEATING = [...theaterArc(247, 286), ...theaterArc(136, 171).reverse()];
export const TWO_THEATER_TIERS = Array.from({ length: 5 }, (_, i) => theaterArc(151 + i * 20, 186 + i * 20));
export const TWO_THEATER_STAGE = softenCorners(projectPoints([[749, 838], [847, 838], [880, 877], [853, 940], [727, 940], [703, 878]]));

// 동선 수정 위치: 첫 구간은 부스부터 국제관 북쪽까지, 두 번째는 통행로 건너편부터 아래쪽까지.
// 두 배열 사이를 연결하는 선은 그리지 않습니다. 통행 공간은 1000에서도 항상 비워둡니다.
export const TWO_ROUTE_SECTIONS: MapPoint[][] = [
  projectPoints([
    [347, 1251], ...curve([347, 1251], [337, 1251], [324, 1250], [324, 1228]),
    ...curve([324, 1228], [324, 1171], [332, 1112], [329, 1070]), [324, 1024],
    ...curve([324, 1024], [322, 1005], [298, 986], [285, 977]), [219, 931],
    ...curve([219, 931], [211, 926], [221, 910], [224, 897]), [237, 870],
    ...curve([237, 870], [285, 895], [377, 950], [424, 985]),
  ]),
  projectPoints([[505, 1036], [505, 1522]]),
];
export const TWO_BOOTH = TWO_ROUTE_SECTIONS[0][0];
export const TWO_CLEAR_PASSAGE = {
  from: TWO_ROUTE_SECTIONS[0].at(-1)!, to: TWO_ROUTE_SECTIONS[1][0],
};

export function sectionLength(points: readonly MapPoint[]) {
  return points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i][0], point[1] - points[i][1]), 0);
}

// 통행 공간의 길이는 대기열 계산에서 제외합니다. 두 구간을 순서대로 균일하게 채웁니다.
export function filledTwoSections(value: number): MapPoint[][] {
  const lengths = TWO_ROUTE_SECTIONS.map(sectionLength);
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * Math.max(0, Math.min(1000, value)) / 1000;
  return TWO_ROUTE_SECTIONS.map((section, index) => {
    if (remaining <= 1e-8) return [];
    const amount = Math.min(remaining, lengths[index]);
    remaining -= amount;
    return filledRoute(section, amount / lengths[index] * 1000);
  });
}
