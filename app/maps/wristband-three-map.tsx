import { type ReactNode } from 'react';
import { type RouteData, renderedSections, fillSections } from '../../shared/route';
import RouteLines from './route-lines';
import { filledRoute, pointsAttribute } from './wristband-one-layout';
import { ENTRANCE_ONE_BUILDINGS, ENTRANCE_ONE_GATE, ENTRANCE_ONE_NORTH_BUILDING, ENTRANCE_ONE_ROADS, ENTRANCE_ONE_ROUTE, ENTRANCE_ONE_VIEW } from './entrance-one-layout';
import {
  projectThree, projectThreePoints, THREE_BOOTH, THREE_BUILDINGS, THREE_MAP_SIZE, THREE_ROADS,
  THREE_THEATER_EAST_STAND, THREE_THEATER_SEATING, THREE_THEATER_STAGE, THREE_THEATER_TIERS, WRISTBAND_THREE_ROUTE,
} from './wristband-three-layout';

export default function WristbandThreeMap({ value, locationName, overlayText, entrance = false, route: customRoute, children }: {
  value: number; locationName: string; overlayText?: string; entrance?: boolean; route?: RouteData|null; children?: ReactNode;
}) {
  const route = entrance ? ENTRANCE_ONE_ROUTE : WRISTBAND_THREE_ROUTE;
  const roads = entrance ? ENTRANCE_ONE_ROADS : THREE_ROADS;
  const buildings = entrance ? ENTRANCE_ONE_BUILDINGS : THREE_BUILDINGS;
  const view = entrance ? ENTRANCE_ONE_VIEW : { ...THREE_MAP_SIZE, top: 0 };
  const sections = customRoute ? renderedSections(customRoute) : [route];
  const end = fillSections(sections,value).flat().at(-1) ?? route[0];
  const [boothX, boothY] = entrance ? ENTRANCE_ONE_GATE : THREE_BOOTH;
  const markerX = entrance ? boothX + 114 : boothX;
  const markerY = entrance ? boothY + 50 : boothY + 43;
  const [theaterX, theaterY] = projectThree([688, 1486]);
  const [stationX, stationY] = projectThree([98, 1455]);
  const [statueX, statueY] = projectThree([240, 1306]);
  const [parkingX, parkingY] = projectThree([785, 1722]);

  return (
    <div className={`map-canvas-wrap campus-map-wrap ${entrance ? 'campus-entrance' : 'campus-wristband'}`}>
      <svg className={`campus-map ${entrance ? 'campus-entrance' : 'campus-wristband'}`} viewBox={`0 ${view.top} ${view.width} ${view.height}`} role="img"
        aria-label={customRoute ? `${locationName} 대기 지도. 관리자가 설정한 동선을 따라 수령처 또는 게이트부터 현재 줄 끝까지 표시합니다.` : entrance
          ? `${locationName} 대기 지도. 노천극장과 미래자동차 연구센터 사이의 게이트에서 북쪽으로 올라가 제1공학관 아래를 따라 동쪽으로 돌고, 백남학술정보관 501동 옆을 지나 아워홈 푸드코트 방향까지 이어집니다. 팔찌 대기줄과 나란한 구간은 도로 오른쪽을 사용합니다.`
          : `${locationName} 대기 지도. 사회과학관 아래 수령처에서 본관 오른쪽으로 돌아 역사관 옆으로 이어집니다. 팔찌 줄은 역사관 쪽 도로 가장자리에 붙고, 오른쪽은 입장 대기 공간으로 남겨 둡니다.`}>
        <rect y={view.top} width={view.width} height={view.height} className="campus-ground" />
        <g className="campus-landscape" aria-hidden="true">
          <ellipse cx={statueX} cy={statueY + 20} rx="57" ry="61" />
          <polygon points={pointsAttribute(projectThreePoints([[299, 777], [677, 848], [703, 869], [378, 842]]))} />
          <polygon points={pointsAttribute(projectThreePoints([[87, 963], [211, 962], [208, 982], [78, 997]]))} />
          <polygon points={pointsAttribute(projectThreePoints([[494, 1853], [556, 1852], [498, 1930]]))} />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {roads.map((road) => <polyline key={`${road.id}-edge`} className="campus-road-edge" points={pointsAttribute(road.points)} strokeWidth={road.width + 6} />)}
          {roads.map((road) => <polyline key={road.id} className="campus-road" points={pointsAttribute(road.points)} strokeWidth={road.width} />)}
        </g>
        <g aria-hidden="true">
          <polygon className="campus-parking" points={pointsAttribute(projectThreePoints([[205, 1559], [263, 1587], [295, 1696], [282, 1751], [249, 1730]]))} />
          <polygon className="campus-parking" points={pointsAttribute(projectThreePoints([[643, 1610], [967, 1602], [967, 1834], [643, 1834]]))} />
          <circle cx={parkingX} cy={parkingY - 32} r="31" className="campus-parking-symbol" />
          <text x={parkingX} y={parkingY - 19} className="campus-parking-p">P</text>
          <text x={parkingX} y={parkingY + 42} className="campus-parking-label">주차장</text>
        </g>

        <g className="campus-building-shapes" aria-hidden="true">
          {buildings.map((building) => <polygon key={building.id} points={pointsAttribute(building.points)} />)}
          {entrance && <polygon points={pointsAttribute(ENTRANCE_ONE_NORTH_BUILDING)} />}
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
          {buildings.map((building) => <text key={building.id} x={building.label[0]} y={building.label[1]}
            className={building.small ? 'campus-building-label campus-small-label' : 'campus-building-label'}>
            {building.lines.map((line, i) => <tspan key={line} x={building.label[0]} dy={i === 0 ? 0 : 43}>{line}</tspan>)}
            <tspan x={building.label[0]} dy="42" className="campus-building-number">{building.number}</tspan>
          </text>)}
          <text x={theaterX} y={theaterY} className="campus-theater-label">노천극장<tspan x={theaterX} dy="47" className="campus-building-number">209동</tspan></text>
          {!entrance && <>
            <circle cx={statueX} cy={statueY} r="11" className="campus-landmark-dot" />
            <text x={statueX} y={statueY + 124} className="campus-landmark-label">백남 김연준<tspan x={statueX} dy="36">박사상</tspan></text>
          </>}
          <circle cx={stationX} cy={stationY} r="29" className="campus-station-marker" />
          <text x={stationX} y={stationY + 13} className="campus-station-number">2</text>
          <text x={stationX} y={stationY - 94} className="campus-building-label">한양대역<tspan x={stationX} dy="39" className="campus-landmark-label">2번 출구</tspan></text>
          <text x={stationX} y={stationY + 88} className="campus-landmark-label">애지문</text>
          {entrance && <text x={projectThree([655, 415])[0]} y={projectThree([655, 415])[1]} className="campus-landmark-label">아워홈 푸드코트</text>}
          {entrance && <text x={projectThree([510, 602])[0]} y={projectThree([510, 602])[1] - 9}
            transform={`rotate(29 ${projectThree([510, 602])[0]} ${projectThree([510, 602])[1]})`}
            className="campus-building-label campus-small-label">백남학술정보관
            <tspan x={projectThree([510, 602])[0]} dy="42" className="campus-building-number">501동</tspan>
          </text>}
        </g>

        <RouteLines sections={sections} value={value}/>
        <g aria-hidden="true">
          <circle cx={boothX} cy={boothY} r="28" className="campus-booth-halo" />
          <circle cx={boothX} cy={boothY} r="17" className="campus-booth-dot" />
          {entrance && <path d={`M${boothX + 19} ${boothY + 19}L${markerX - 55} ${markerY}`} className="campus-passage-pointer" />}
          <rect x={markerX - 79} y={markerY} width="158" height="62" rx="5" className="campus-booth-plate" />
          <text x={markerX} y={markerY + 42} className="campus-booth-label">{entrance ? '게이트' : '수령처'}</text>
          {value > 0 && <circle cx={end[0]} cy={end[1]} r="18" className="campus-queue-end" />}
        </g>
        {children}
      </svg>
      <div className="campus-map-key" aria-label="지도 범례">
        <span><i className="campus-key-active" />현재 대기줄</span>
        <span><i className="campus-key-planned" />대기 동선</span>
        <span><i className="campus-key-end" />줄 끝</span>
        <span><i className="campus-key-road" />도로</span>
      </div>
      <p className="campus-passage-note">{entrance ? '팔찌 대기줄과 나란한 구간에서는 도로 오른쪽으로 줄을 서 주세요.' : '팔찌 줄은 역사관 쪽으로, 오른쪽은 입장 대기 공간으로 비워 둡니다.'}</p>
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}
