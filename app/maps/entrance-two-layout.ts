import { MAP_BUILDINGS, MAP_ROADS, softenCorners, type MapPoint } from './wristband-one-layout';

// 게이트 2: 노천극장 위쪽 도로와 아래 주차장을 중심으로 잘라낸 보기입니다.
// 팔찌 수령처 1 지도와 같은 건물/도로 좌표를 사용합니다. 북쪽의 무관한 구역은 표시하지 않습니다.
export const ENTRANCE_TWO_VIEW = { left: -180, top: -65, width: 1260, height: 1110 };
export const ENTRANCE_TWO_BUILDINGS = [
  ...MAP_BUILDINGS.filter((building) => ['future-auto', 'engineering-2', 'museum', 'industrial-center'].includes(building.id)),
  { id: 'history', name: '역사관', number: '101동',
    points: softenCorners([[-153, 83], [-37, 83], [-29, 547], [-144, 547], [-144, 465], [-118, 465], [-118, 161], [-153, 161]]),
    label: [-92, 341] as MapPoint, lines: ['역사관'], small: true },
];

// 동선 수정 위치: 게이트에서 왼쪽 역사관 방향으로 진행합니다.
// 도로의 동일한 곡선을 역순으로 사용하므로 대기줄이 길어져도 도로 밖으로 벗어나지 않습니다.
// 첫 곡선의 8번째 점부터 두 번째 곡선의 23번째 점까지가 참고 이미지의 표시 구간입니다.
const northRoad = MAP_ROADS.find((road) => road.id === 'north-of-theater')!;
export const ENTRANCE_TWO_ROUTE: MapPoint[] = northRoad.points.slice(8, 57).reverse();
export const ENTRANCE_TWO_GATE = ENTRANCE_TWO_ROUTE[0];
