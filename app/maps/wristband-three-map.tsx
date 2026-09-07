import { filledRoute, pointsAttribute } from './wristband-one-layout';
import {
  projectThree, projectThreePoints, THREE_BOOTH, THREE_BUILDINGS, THREE_MAP_SIZE, THREE_ROADS,
  THREE_THEATER_EAST_STAND, THREE_THEATER_SEATING, THREE_THEATER_STAGE, THREE_THEATER_TIERS, WRISTBAND_THREE_ROUTE,
} from './wristband-three-layout';

export default function WristbandThreeMap({ value, locationName, overlayText }: {
  value: number; locationName: string; overlayText?: string;
}) {
  const active = filledRoute(WRISTBAND_THREE_ROUTE, value);
  const end = active.at(-1)!;
  const [boothX, boothY] = THREE_BOOTH;
  const [theaterX, theaterY] = projectThree([688, 1486]);
  const [stationX, stationY] = projectThree([98, 1455]);
  const [statueX, statueY] = projectThree([240, 1306]);
  const [parkingX, parkingY] = projectThree([785, 1722]);

  return (
    <div className="map-canvas-wrap campus-map-wrap">
      <svg className="campus-map" viewBox={`0 0 ${THREE_MAP_SIZE.width} ${THREE_MAP_SIZE.height}`} role="img"
        aria-label={`${locationName} 대기 지도. 사회과학관 아래 수령처에서 본관 오른쪽으로 돌아 역사관 옆으로 이어집니다. 팔찌 줄은 역사관 쪽 도로 가장자리에 붙고, 오른쪽은 입장 대기 공간으로 남겨 둡니다.`}>
        <rect width={THREE_MAP_SIZE.width} height={THREE_MAP_SIZE.height} className="campus-ground" />
        <g className="campus-landscape" aria-hidden="true">
          <ellipse cx={statueX} cy={statueY + 20} rx="57" ry="61" />
          <polygon points={pointsAttribute(projectThreePoints([[299, 777], [677, 848], [703, 869], [378, 842]]))} />
          <polygon points={pointsAttribute(projectThreePoints([[87, 963], [211, 962], [208, 982], [78, 997]]))} />
          <polygon points={pointsAttribute(projectThreePoints([[494, 1853], [556, 1852], [498, 1930]]))} />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {THREE_ROADS.map((road) => <polyline key={`${road.id}-edge`} className="campus-road-edge" points={pointsAttribute(road.points)} strokeWidth={road.width + 6} />)}
          {THREE_ROADS.map((road) => <polyline key={road.id} className="campus-road" points={pointsAttribute(road.points)} strokeWidth={road.width} />)}
        </g>
        <g aria-hidden="true">
          <polygon className="campus-parking" points={pointsAttribute(projectThreePoints([[205, 1559], [263, 1587], [295, 1696], [282, 1751], [249, 1730]]))} />
          <polygon className="campus-parking" points={pointsAttribute(projectThreePoints([[643, 1610], [967, 1602], [967, 1834], [643, 1834]]))} />
          <circle cx={parkingX} cy={parkingY - 32} r="31" className="campus-parking-symbol" />
          <text x={parkingX} y={parkingY - 19} className="campus-parking-p">P</text>
          <text x={parkingX} y={parkingY + 42} className="campus-parking-label">주차장</text>
        </g>

        <g className="campus-building-shapes" aria-hidden="true">
          {THREE_BUILDINGS.map((building) => <polygon key={building.id} points={pointsAttribute(building.points)} />)}
          <polygon points={pointsAttribute(THREE_THEATER_SEATING)} />
          <polygon points={pointsAttribute(THREE_THEATER_EAST_STAND)} />
          <polygon points={pointsAttribute(THREE_THEATER_STAGE)} />
        </g>
        <g className="campus-theater-tiers" fill="none" aria-hidden="true">
          {THREE_THEATER_TIERS.map((tier, i) => <polyline key={i} points={pointsAttribute(tier)} />)}
          <polyline points={pointsAttribute(projectThreePoints([[695, 1302], [695, 1376]]))} />
          <polyline points={pointsAttribute(projectThreePoints([[543, 1361], [607, 1413]]))} />
          <polyline points={pointsAttribute(projectThreePoints([[847, 1361], [783, 1413]]))} />
        </g>
        <g className="campus-labels" textAnchor="middle" aria-hidden="true">
          {THREE_BUILDINGS.map((building) => <text key={building.id} x={building.label[0]} y={building.label[1]}
            className={building.small ? 'campus-building-label campus-small-label' : 'campus-building-label'}>
            {building.lines.map((line, i) => <tspan key={line} x={building.label[0]} dy={i === 0 ? 0 : 43}>{line}</tspan>)}
            <tspan x={building.label[0]} dy="42" className="campus-building-number">{building.number}</tspan>
          </text>)}
          <text x={theaterX} y={theaterY} className="campus-theater-label">노천극장<tspan x={theaterX} dy="47" className="campus-building-number">209동</tspan></text>
          <circle cx={statueX} cy={statueY} r="11" className="campus-landmark-dot" />
          <text x={statueX} y={statueY + 124} className="campus-landmark-label">백남 김연준<tspan x={statueX} dy="36">박사상</tspan></text>
          <circle cx={stationX} cy={stationY} r="29" className="campus-station-marker" />
          <text x={stationX} y={stationY + 13} className="campus-station-number">2</text>
          <text x={stationX} y={stationY - 94} className="campus-building-label">한양대역<tspan x={stationX} dy="39" className="campus-landmark-label">2번 출구</tspan></text>
          <text x={stationX} y={stationY + 88} className="campus-landmark-label">애지문</text>
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline className="campus-route-base" points={pointsAttribute(WRISTBAND_THREE_ROUTE)} />
          <polyline className="campus-route-planned" points={pointsAttribute(WRISTBAND_THREE_ROUTE)} />
          {value > 0 && <polyline className="campus-route-active" points={pointsAttribute(active)} />}
        </g>
        <g aria-hidden="true">
          <circle cx={boothX} cy={boothY} r="28" className="campus-booth-halo" />
          <circle cx={boothX} cy={boothY} r="17" className="campus-booth-dot" />
          <rect x={boothX - 79} y={boothY + 43} width="158" height="62" rx="5" className="campus-booth-plate" />
          <text x={boothX} y={boothY + 85} className="campus-booth-label">수령처</text>
          {value > 0 && <circle cx={end[0]} cy={end[1]} r="18" className="campus-queue-end" />}
        </g>
      </svg>
      <div className="campus-map-key" aria-label="지도 범례">
        <span><i className="campus-key-active" />현재 대기줄</span>
        <span><i className="campus-key-planned" />대기 동선</span>
        <span><i className="campus-key-end" />줄 끝</span>
        <span><i className="campus-key-road" />도로</span>
      </div>
      <p className="campus-passage-note">팔찌 줄은 역사관 쪽으로, 오른쪽은 입장 대기 공간으로 비워 둡니다.</p>
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}
