import { curve, softenCorners, type MapPoint } from './wristband-one-layout';
import { projectThree, projectThreePoints, THREE_BUILDINGS, THREE_ROADS } from './wristband-three-layout';

// 수령처 3과 동일한 좌표계와 건물 배치를 사용하고 입장 동선에 필요한 북쪽 영역을 확장합니다.
export const ENTRANCE_ONE_VIEW = { top: projectThree([0, 330])[1], width: 1080, height: 1460 };
const engineeringFront = projectThreePoints([
  [366, 1014], ...curve([366, 1014], [395, 1008], [433, 1016], [476, 1030]), [759, 1118],
  ...curve([759, 1118], [798, 1132], [838, 1112], [883, 1092]), [917, 1062],
]);
export const ENTRANCE_ONE_ROADS = [
  ...THREE_ROADS,
  { id: 'engineering-front-passage', width: 34 * 1080 / 945, points: engineeringFront },
  { id: 'social-sciences-north', width: 48 * 1080 / 945, points: projectThreePoints([
    ...curve([277, 690], [246, 576], [309, 443], [360, 340]),
  ]) },
  { id: 'northern-east-road', width: 44 * 1080 / 945, points: projectThreePoints([
    [356, 353], ...curve([356, 353], [390, 371], [419, 410], [458, 433]),
    ...curve([458, 433], [516, 450], [645, 512], [725, 601]),
    ...curve([725, 601], [759, 631], [804, 668], [810, 690]),
  ]) },
];
export const ENTRANCE_ONE_BUILDINGS = THREE_BUILDINGS.map((building) => building.id === 'social-sciences'
  ? { ...building, points: softenCorners(projectThreePoints([[60, 573], [151, 617], [163, 897], [62, 897]])) }
  : building);
// 사용자 확인: 백남학술정보관 501동.
export const ENTRANCE_ONE_NORTH_BUILDING = softenCorners(projectThreePoints([
  [393, 490], [663, 637], [616, 715], [353, 574],
]));

// 입장 동선 1 수정 위치. 첫 점은 게이트, 마지막 점은 북쪽 최대 대기 지점입니다.
// 역사관 옆 구간은 팔찌 수령처 3보다 오른쪽을 사용하며 두 동선을 연결하지 않습니다.
export const ENTRANCE_ONE_ROUTE: MapPoint[] = projectThreePoints([
  [461, 1230], ...curve([461, 1230], [459, 1183], [437, 1149], [424, 1118]),
  ...curve([424, 1118], [406, 1084], [398, 1065], [392, 1054]),
  ...curve([392, 1054], [381, 1037], [370, 1020], [373, 1016]),
  ...curve([373, 1016], [402, 1009], [447, 1024], [476, 1030]), [759, 1118],
  ...curve([759, 1118], [798, 1132], [838, 1112], [883, 1092]),
  ...curve([883, 1092], [923, 1070], [920, 1028], [906, 1008]),
  ...curve([906, 1008], [866, 965], [827, 915], [806, 867]),
  ...curve([806, 867], [779, 810], [818, 756], [805, 699]),
  ...curve([805, 699], [804, 668], [759, 631], [725, 601]),
  ...curve([725, 601], [645, 512], [516, 450], [458, 433]), [409, 399],
]);
export const ENTRANCE_ONE_GATE = ENTRANCE_ONE_ROUTE[0];
