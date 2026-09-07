import { filledRoute, pointsAttribute } from './wristband-one-layout';
import { ENTRANCE_THREE_GATE, ENTRANCE_THREE_ROADS, ENTRANCE_THREE_ROUTE, ENTRANCE_THREE_VIEW } from './entrance-three-layout';
import {
  filledTwoSections, projectPoints, projectTwo, TWO_BOOTH, TWO_BUILDINGS, TWO_CLEAR_PASSAGE, TWO_MAP_SIZE,
  TWO_ROADS, TWO_ROUTE_SECTIONS, TWO_THEATER_SEATING, TWO_THEATER_STAGE, TWO_THEATER_TIERS,
} from './wristband-two-layout';

export default function WristbandTwoMap({ value, locationName, overlayText, entranceThree = false }: {
  value: number; locationName: string; overlayText?: string; entranceThree?: boolean;
}) {
  const sections = entranceThree ? [ENTRANCE_THREE_ROUTE] : TWO_ROUTE_SECTIONS;
  const active = entranceThree ? [value > 0 ? filledRoute(ENTRANCE_THREE_ROUTE, value) : []] : filledTwoSections(value);
  const view = entranceThree ? ENTRANCE_THREE_VIEW : { ...TWO_MAP_SIZE, top: 0 };
  const roads = entranceThree ? ENTRANCE_THREE_ROADS : TWO_ROADS;
  const buildings = entranceThree ? TWO_BUILDINGS.filter((b) => ['history', 'international', 'tokeon', 'museum', 'materials'].includes(b.id)) : TWO_BUILDINGS;
  const end = active.filter((section) => section.length > 0).at(-1)?.at(-1);
  const [boothX, boothY] = entranceThree ? ENTRANCE_THREE_GATE : TWO_BOOTH;
  const markerX = entranceThree ? boothX + 114 : boothX - 67;
  const markerY = entranceThree ? boothY + 28 : boothY + 47;
  const [theaterX, theaterY] = projectTwo([802, 881]);
  const [passageX, passageY] = projectTwo([463, 1011]);
  const [passageLabelX, passageLabelY] = projectTwo([625, 924]);
  const [stationX, stationY] = projectTwo([108, 827]);
  const [statueX, statueY] = projectTwo([295, 535]);

  return (
    <div className="map-canvas-wrap campus-map-wrap">
      <svg className="campus-map" viewBox={`0 ${view.top} ${view.width} ${view.height}`} role="img"
        aria-label={entranceThree
          ? `${locationName} 대기 지도. 노천극장 왼쪽 게이트에서 박물관 왼쪽을 따라 남쪽으로 내려가며, 토건관 건너편의 박물관 남서쪽까지 이어지는 연속 대기 동선입니다.`
          : `${locationName} 대기 지도. 국제관 옆 팔찌 부스에서 북쪽으로 올라갔다가 애지문 쪽에서 꺾입니다. 국제관 앞 통행 공간은 항상 비워 두며, 그 건너편에서 토건관 방향으로 줄이 이어집니다.`}>
        <rect y={view.top} width={view.width} height={view.height} className="campus-ground" />
        <g className="campus-landscape" aria-hidden="true">
          <ellipse cx={projectTwo([256, 665])[0]} cy={projectTwo([256, 665])[1]} rx="62" ry="66" />
          <polygon points={pointsAttribute(projectPoints([[586, 1312], [661, 1300], [613, 1378], [579, 1462]]))} />
          <polygon points={pointsAttribute(projectPoints([[262, 836], [334, 838], [377, 914], [299, 870]]))} />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {roads.map((road) => <polyline key={`${road.id}-edge`} className="campus-road-edge" points={pointsAttribute(road.points)} strokeWidth={road.width + 6} />)}
          {roads.map((road) => <polyline key={road.id} className="campus-road" points={pointsAttribute(road.points)} strokeWidth={road.width} />)}
        </g>
        <g aria-hidden="true">
          <polygon className="campus-parking" points={pointsAttribute(projectPoints([[224, 954], [297, 993], [322, 1081], [330, 1207], [286, 1220], [254, 1146]]))} />
          <polygon className="campus-parking" points={pointsAttribute(projectPoints([[763, 1007], [970, 1007], [970, 1294], [761, 1294]]))} />
          <text x={projectTwo([890, 1176])[0]} y={projectTwo([890, 1176])[1]} className="campus-parking-label">주차장</text>
        </g>

        <g className="campus-building-shapes" aria-hidden="true">
          {buildings.map((building) => <polygon key={building.id} points={pointsAttribute(building.points)} />)}
          <polygon points={pointsAttribute(TWO_THEATER_SEATING)} />
          <polygon points={pointsAttribute(TWO_THEATER_STAGE)} />
        </g>
        <g className="campus-theater-tiers" fill="none" aria-hidden="true">
          {TWO_THEATER_TIERS.map((tier, i) => <polyline key={i} points={pointsAttribute(tier)} />)}
          <polyline points={pointsAttribute(projectPoints([[805, 598], [805, 713]]))} />
          <polyline points={pointsAttribute(projectPoints([[630, 682], [709, 762]]))} />
        </g>
        <g className="campus-labels" textAnchor="middle" aria-hidden="true">
          {buildings.map((building) => <text key={building.id} x={building.label[0]} y={building.label[1]}
            className={building.small ? 'campus-building-label campus-small-label' : 'campus-building-label'}>
            {building.lines.map((line, i) => <tspan key={line} x={building.label[0]} dy={i === 0 ? 0 : 43}>{line}</tspan>)}
            {building.number && <tspan x={building.label[0]} dy="42" className="campus-building-number">{building.number}</tspan>}
          </text>)}
          <text x={theaterX} y={theaterY} className="campus-theater-label">노천극장<tspan x={theaterX} dy="47" className="campus-building-number">209동</tspan></text>
          {!entranceThree && <>
            <circle cx={statueX} cy={statueY - 57} r="11" className="campus-landmark-dot" />
            <text x={statueX} y={statueY} className="campus-landmark-label">백남 김연준<tspan x={statueX} dy="36">박사상</tspan></text>
          </>}
          <circle cx={stationX} cy={stationY} r="29" className="campus-station-marker" />
          <text x={stationX} y={stationY + 13} className="campus-station-number">2</text>
          <text x={stationX} y={stationY - 94} className="campus-building-label">한양대역<tspan x={stationX} dy="39" className="campus-landmark-label">2번 출구</tspan></text>
          <text x={stationX} y={stationY + 89} className="campus-landmark-label">애지문</text>
        </g>

        {/* 구간마다 별도 선을 그려 통행 공간을 가로지르는 선이 생기지 않습니다. */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {sections.map((section, i) => <g key={i}>
            <polyline className="campus-route-base" points={pointsAttribute(section)} />
            <polyline className="campus-route-planned" points={pointsAttribute(section)} />
            {active[i].length > 1 && <polyline className="campus-route-active" points={pointsAttribute(active[i])} />}
          </g>)}
        </g>
        <g aria-hidden="true">
          {/* 통행로 표시선은 대기 동선에 직각이며, 빈 공간을 연결하지 않습니다. */}
          {!entranceThree && <>
          {[TWO_CLEAR_PASSAGE.from, TWO_CLEAR_PASSAGE.to].map(([x, y], i) =>
            <path key={i} d={`M${x - 9} ${y + 17}L${x + 9} ${y - 17}`} className="campus-passage-boundary" />)}
          <path d={`M${passageX + 15} ${passageY - 8}L${passageLabelX - 84} ${passageLabelY + 12}`} className="campus-passage-pointer" />
          <rect x={passageLabelX - 82} y={passageLabelY - 25} width="164" height="54" rx="6" className="campus-passage-plate" />
          <text x={passageLabelX} y={passageLabelY + 13} className="campus-passage-label">통행로</text>
          </>}

          <circle cx={boothX} cy={boothY} r="28" className="campus-booth-halo" />
          <circle cx={boothX} cy={boothY} r="17" className="campus-booth-dot" />
          {entranceThree && <path d={`M${boothX + 20} ${boothY + 12}L${markerX - 60} ${markerY}`} className="campus-passage-pointer" />}
          <rect x={markerX - 79} y={markerY} width="158" height={entranceThree ? 54 : 62} rx="5" className="campus-booth-plate" />
          <text x={markerX} y={markerY + (entranceThree ? 37 : 42)} className="campus-booth-label">{entranceThree ? '게이트' : '수령처'}</text>
          {end && <circle cx={end[0]} cy={end[1]} r="18" className="campus-queue-end" />}
        </g>
      </svg>
      <div className="campus-map-key" aria-label="지도 범례">
        <span><i className="campus-key-active" />현재 대기줄</span>
        <span><i className="campus-key-planned" />대기 동선</span>
        <span><i className="campus-key-end" />줄 끝</span>
        <span><i className="campus-key-road" />도로</span>
      </div>
      {!entranceThree && <p className="campus-passage-note">국제관 앞 통행 공간은 비워 두고, 건너편 줄을 따라 대기해 주세요.</p>}
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}
