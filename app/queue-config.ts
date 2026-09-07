/**
 * [축제 대기열 확정 후 이 파일만 수정]
 *
 * DB에는 대기 동선의 시작부터 끝까지를 0~1000 숫자로 저장합니다.
 * 아래 숫자는 사용자 화면에 표시할 혼잡도 문구의 시작 기준입니다.
 *
 * 예시: veryBusyFrom이 800이면 DB 값 800 이상부터 "매우 많음"입니다.
 * 세 값은 반드시 normalFrom < busyFrom < veryBusyFrom 순서로 설정하세요.
 */
export const QUEUE_STATUS_THRESHOLDS = {
  normalFrom: 250,   // 이 값 미만: 원활 / 이 값 이상: 보통
  busyFrom: 500,     // 이 값 이상: 많음
  veryBusyFrom: 750, // 이 값 이상: 매우 많음
} as const;
