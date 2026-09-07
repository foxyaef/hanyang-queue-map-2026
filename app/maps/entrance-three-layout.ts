import { curve, type MapPoint } from './wristband-one-layout';
import { projectPoints, projectTwo, TWO_ROADS } from './wristband-two-layout';

// 수령처 2와 같은 지도 좌표계. 노천극장~토건관에 집중한 보기입니다.
export const ENTRANCE_THREE_VIEW = { top: projectTwo([0, 560])[1], width: 1080, height: 1160 };

// 동선 수정 위치: 첫 점은 노천극장 서쪽 게이트, 마지막 점은 박물관 남서쪽입니다.
// 팔찌 수령처 2의 동선이나 그 통행로 구간과 연결하지 않는 하나의 연속 동선입니다.
export const ENTRANCE_THREE_ROUTE: MapPoint[] = projectPoints([
  [533, 884], ...curve([533, 884], [532, 917], [534, 950], [536, 977]),
  ...curve([536, 977], [538, 1004], [536, 1036], [538, 1060]),
  ...curve([538, 1060], [542, 1107], [547, 1162], [548, 1192]),
  ...curve([548, 1192], [550, 1230], [560, 1279], [561, 1312]),
  ...curve([561, 1312], [562, 1348], [557, 1396], [566, 1424]), [577, 1450],
]);
export const ENTRANCE_THREE_GATE = ENTRANCE_THREE_ROUTE[0];

// 참고 이미지에서 도로 오른쪽 가장자리를 따라 이어지는 보행 구간.
// 다른 지도와 공유하는 차도/건물은 그대로 두고 보행 구간만 덧붙입니다.
export const ENTRANCE_THREE_ROADS = [
  ...TWO_ROADS,
  { id: 'museum-west-passage', width: 28 * 1080 / 945, points: ENTRANCE_THREE_ROUTE },
];
