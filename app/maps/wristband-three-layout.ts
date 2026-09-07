import { curve, softenCorners, type MapPoint } from './wristband-one-layout';

// 수령처 3: 참고 이미지의 사회과학관~국제관 구간. 도로와 건물의 상대 배치를 유지합니다.
// 좌표는 945px 너비 참고 이미지 기준입니다. 상단의 동선과 무관한 영역만 잘라냅니다.
const scale = 1080 / 945;
export const projectThree = ([x, y]: MapPoint): MapPoint => [x * scale, (y - 740) * scale];
export const projectThreePoints = (points: readonly MapPoint[]) => points.map(projectThree);
export const THREE_MAP_SIZE = { width: 1080, height: 1320 };

const roads: { id: string; width: number; points: MapPoint[] }[] = [
  { id: 'main-campus-road', width: 64, points: [
    ...curve([277, 690], [253, 763], [261, 850], [304, 942]),
    ...curve([304, 942], [360, 1018], [391, 1128], [443, 1198]),
    ...curve([443, 1198], [452, 1246], [437, 1300], [437, 1355]),
    ...curve([437, 1355], [435, 1425], [430, 1503], [432, 1580]),
    ...curve([432, 1580], [437, 1680], [435, 1810], [441, 1930]),
  ] },
  { id: 'social-sciences-front', width: 34, points: [
    [99, 942], ...curve([99, 942], [172, 931], [245, 933], [304, 942]), [411, 958],
  ] },
  { id: 'theater-north', width: 42, points: [
    ...curve([440, 1418], [471, 1324], [557, 1241], [664, 1254]),
    ...curve([664, 1254], [758, 1257], [795, 1311], [950, 1325]),
  ] },
  { id: 'theater-south', width: 38, points: [[432, 1580], [626, 1580], [970, 1568]] },
  { id: 'aejimon-access', width: 40, points: [
    ...curve([432, 1577], [386, 1560], [278, 1495], [215, 1493]),
    ...curve([215, 1493], [180, 1490], [162, 1521], [172, 1570]),
    ...curve([172, 1570], [185, 1659], [210, 1747], [235, 1776]), [275, 1757],
  ] },
  { id: 'museum-east', width: 38, points: [
    [622, 1580], ...curve([622, 1580], [600, 1580], [606, 1610], [606, 1630]), [606, 1814],
    ...curve([606, 1814], [606, 1841], [583, 1856], [566, 1880]), [546, 1930],
  ] },
  { id: 'parking-south', width: 40, points: [[577, 1871], [974, 1871]] },
  { id: 'engineering-east', width: 44, points: [
    ...curve([810, 690], [832, 756], [788, 817], [811, 865]),
    ...curve([811, 865], [843, 925], [890, 971], [922, 1018]),
    ...curve([922, 1018], [944, 1059], [846, 1106], [843, 1159]),
    ...curve([843, 1159], [838, 1205], [844, 1253], [856, 1307]),
  ] },
];
export const THREE_ROADS = roads.map((road) => ({ ...road, width: road.width * scale, points: projectThreePoints(road.points) }));

const buildings: {
  id: string; name: string; number: string; points: MapPoint[];
  label: MapPoint; lines: string[]; small?: boolean;
}[] = [
  { id: 'social-sciences', name: '사회과학관', number: '504동', points: [[60, 756], [161, 756], [163, 897], [62, 897]], label: [113, 796], lines: ['사회', '과학관'], small: true },
  { id: 'engineering-1', name: '제1공학관', number: '212동', points: [[451, 898], [807, 978], [778, 1083], [491, 992]], label: [641, 973], lines: ['제1공학관'] },
  { id: 'main-hall', name: '본관', number: '102동', points: [[105, 1040], [285, 1040], [285, 1073], [316, 1073], [350, 1151], [61, 1151], [61, 1086], [105, 1086]], label: [210, 1090], lines: ['본관'] },
  { id: 'future-auto', name: '미래자동차 연구센터', number: '210동', points: [[445, 1060], [760, 1158], [760, 1226], [522, 1220], [479, 1153]], label: [616, 1138], lines: ['미래자동차', '연구센터'] },
  { id: 'history', name: '역사관', number: '101동', points: [[326, 1192], [389, 1192], [391, 1489], [326, 1489], [326, 1435], [346, 1435], [346, 1246], [326, 1246]], label: [349, 1334], lines: ['역사관'], small: true },
  { id: 'international', name: '국제관', number: '108동', points: [[301, 1672], [376, 1658], [393, 1878], [317, 1878]], label: [348, 1751], lines: ['국제관'] },
  { id: 'museum', name: '박물관', number: '109동', points: [[491, 1642], [569, 1642], [574, 1828], [493, 1828]], label: [534, 1724], lines: ['박물관'] },
];
export const THREE_BUILDINGS = buildings.map((building) => ({
  ...building, label: projectThree(building.label), points: softenCorners(projectThreePoints(building.points)),
}));

function theaterArc(rx: number, ry: number): MapPoint[] {
  return Array.from({ length: 49 }, (_, i) => {
    const angle = Math.PI + Math.PI * i / 48;
    return projectThree([695 + rx * Math.cos(angle), 1504 + ry * Math.sin(angle)]);
  });
}
export const THREE_THEATER_SEATING = [...theaterArc(215, 202), ...theaterArc(125, 128).reverse()];
export const THREE_THEATER_TIERS = Array.from({ length: 5 }, (_, i) => theaterArc(141 + i * 15, 142 + i * 12));
export const THREE_THEATER_STAGE = softenCorners(projectThreePoints([[617, 1465], [721, 1465], [755, 1502], [725, 1544], [605, 1544], [579, 1502]]));
export const THREE_THEATER_EAST_STAND = softenCorners(projectThreePoints([[928, 1425], [970, 1425], [970, 1490], [910, 1540], [798, 1540], [798, 1505]]));

// 동선 수정 위치: 첫 점은 사회과학관 아래의 수령처, 마지막 점은 역사관 남쪽의 최대 대기 지점.
// 역사관 동쪽 도로의 왼편에 붙입니다. 오른쪽은 추후 입장 대기줄을 위한 공간이므로 사용하지 않습니다.
// 건물을 피하려고 도로를 옮기지 말고, 아래 대기 동선만 수정하세요.
export const WRISTBAND_THREE_ROUTE: MapPoint[] = projectThreePoints([
  [132, 944], ...curve([132, 944], [172, 937], [233, 938], [274, 938]),
  ...curve([274, 938], [293, 938], [301, 963], [311, 978]),
  ...curve([311, 978], [347, 1027], [353, 1077], [374, 1118]),
  ...curve([374, 1118], [390, 1153], [418, 1184], [421, 1216]),
  ...curve([421, 1216], [425, 1254], [415, 1308], [416, 1355]),
  ...curve([416, 1355], [417, 1404], [410, 1467], [410, 1534]),
]);
export const THREE_BOOTH = WRISTBAND_THREE_ROUTE[0];

// 겹침 검사용 여유 공간의 중심선입니다. 확정된 입장 동선이 아니므로 화면에는 그리지 않습니다.
export const THREE_RIGHT_CLEARANCE = projectThreePoints([
  ...curve([461, 1216], [465, 1254], [455, 1308], [456, 1355]),
  ...curve([456, 1355], [457, 1404], [450, 1467], [450, 1534]),
]);
