import { curve, type MapPoint } from './wristband-one-layout';
import { projectPoints, projectTwo, TWO_ROADS } from './wristband-two-layout';

// 수령처 2와 같은 지도 좌표계. 노천극장~토건관에 집중한 보기입니다.
export const ENTRANCE_THREE_VIEW = { top: projectTwo([0, 560])[1], width: 1080, height: 1160 };

// 동선 수정 위치: 첫 점은 노천극장 서쪽 게이트, 마지막 점은 박물관 남서쪽입니다.
// 팔찌 수령처 2의 동선이나 그 통행로 구간과 연결하지 않는 하나의 연속 동선입니다.
export const ENTRANCE_THREE_ROUTE: MapPoint[] = projectPoints([
  // 좁은 북쪽 도로에서는 안쪽에 붙이고, 접선이 이어지는 곡선으로 남쪽 도로를 따릅니다.
  ...curve([524, 884], [524, 914], [524, 943], [524, 976]),
  ...curve([524, 976], [524, 1009], [532.5, 1030], [533, 1060]).slice(1),
  ...curve([533, 1060], [535, 1180], [535, 1320], [535, 1450], 96).slice(1),
]);
export const ENTRANCE_THREE_GATE = ENTRANCE_THREE_ROUTE[0];

// 별도 보행로를 만들지 않습니다. 대기선 전체가 기존 도로 폭 안에 있어야 합니다.
export const ENTRANCE_THREE_ROADS = TWO_ROADS;
