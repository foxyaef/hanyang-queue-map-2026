import { pointsAttribute } from './wristband-one-layout';
import {
  filledTwoSections, projectPoints, projectTwo, TWO_BOOTH, TWO_BUILDINGS, TWO_CLEAR_PASSAGE, TWO_MAP_SIZE,
  TWO_ROADS, TWO_ROUTE_SECTIONS, TWO_THEATER_SEATING, TWO_THEATER_STAGE, TWO_THEATER_TIERS,
} from './wristband-two-layout';

export default function WristbandTwoMap({ value, locationName, overlayText }: {
  value: number; locationName: string; overlayText?: string;
}) {
  const active = filledTwoSections(value);
  const end = active.filter((section) => section.length > 0).at(-1)?.at(-1);
  const [boothX, boothY] = TWO_BOOTH;
  const [theaterX, theaterY] = projectTwo([802, 881]);
  const [passageX, passageY] = projectTwo([463, 1011]);
  const [passageLabelX, passageLabelY] = projectTwo([625, 924]);
  const [stationX, stationY] = projectTwo([108, 827]);
  const [statueX, statueY] = projectTwo([295, 535]);

  return (
    <div className="map-canvas-wrap campus-map-wrap">
      <svg className="campus-map" viewBox={`0 0 ${TWO_MAP_SIZE.width} ${TWO_MAP_SIZE.height}`} role="img"
        aria-label={`${locationName} 대기 지도. 국제관 옆 팔찌 부스에서 북쪽으로 올라갔다가 애지문 쪽에서 꺾입니다. 국제관 앞 통행 공간은 항상 비워 두며, 그 건너편에서 토건관 방향으로 줄이 이어집니다.`}>
        <rect width={TWO_MAP_SIZE.width} height={TWO_MAP_SIZE.height} className="campus-ground" />
        <g className="campus-landscape" aria-hidden="true">
          <ellipse cx={projectTwo([256, 665])[0]} cy={projectTwo([256, 665])[1]} rx="62" ry="66" />
          <polygon points={pointsAttribute(projectPoints([[586, 1312], [661, 1300], [613, 1378], [579, 1462]]))} />
          <polygon points={pointsAttribute(projectPoints([[262, 836], [334, 838], [377, 914], [299, 870]]))} />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {TWO_ROADS.map((road) => <polyline key={`${road.id}-edge`} className="campus-road-edge" points={pointsAttribute(road.points)} strokeWidth={road.width + 6} />)}
          {TWO_ROADS.map((road) => <polyline key={road.id} className="campus-road" points={pointsAttribute(road.points)} strokeWidth={road.width} />)}
        </g>
        <g aria-hidden="true">
          <polygon className="campus-parking" points={pointsAttribute(projectPoints([[224, 954], [297, 993], [322, 1081], [330, 1207], [286, 1220], [254, 1146]]))} />
          <polygon className="campus-parking" points={pointsAttribute(projectPoints([[763, 1007], [970, 1007], [970, 1294], [761, 1294]]))} />
          <text x={projectTwo([890, 1176])[0]} y={projectTwo([890, 1176])[1]} className="campus-parking-label">주차장</text>
        </g>

        <g className="campus-building-shapes" aria-hidden="true">
          {TWO_BUILDINGS.map((building) => <polygon key={building.id} points={pointsAttribute(building.points)} />)}
          <polygon points={pointsAttribute(TWO_THEATER_SEATING)} />
          <polygon points={pointsAttribute(TWO_THEATER_STAGE)} />
        </g>
        <g className="campus-theater-tiers" fill="none" aria-hidden="true">
          {TWO_THEATER_TIERS.map((tier, i) => <polyline key={i} points={pointsAttribute(tier)} />)}
          <polyline points={pointsAttribute(projectPoints([[805, 598], [805, 713]]))} />
          <polyline points={pointsAttribute(projectPoints([[630, 682], [709, 762]]))} />
        </g>
        <g className="campus-labels" textAnchor="middle" aria-hidden="true">
          {TWO_BUILDINGS.map((building) => <text key={building.id} x={building.label[0]} y={building.label[1]}
            className={building.small ? 'campus-building-label campus-small-label' : 'campus-building-label'}>
            {building.lines.map((line, i) => <tspan key={line} x={building.label[0]} dy={i === 0 ? 0 : 43}>{line}</tspan>)}
            {building.number && <tspan x={building.label[0]} dy="42" className="campus-building-number">{building.number}</tspan>}
          </text>)}
          <text x={theaterX} y={theaterY} className="campus-theater-label">노천극장<tspan x={theaterX} dy="47" className="campus-building-number">209동</tspan></text>
          <circle cx={statueX} cy={statueY - 57} r="11" className="campus-landmark-dot" />
          <text x={statueX} y={statueY} className="campus-landmark-label">백남 김연준<tspan x={statueX} dy="36">박사상</tspan></text>
          <circle cx={stationX} cy={stationY} r="29" className="campus-station-marker" />
          <text x={stationX} y={stationY + 13} className="campus-station-number">2</text>
          <text x={stationX} y={stationY - 94} className="campus-building-label">한양대역<tspan x={stationX} dy="39" className="campus-landmark-label">2번 출구</tspan></text>
          <text x={stationX} y={stationY + 89} className="campus-landmark-label">애지문</text>
        </g>

        {/* 구간마다 별도 선을 그려 통행 공간을 가로지르는 선이 생기지 않습니다. */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {TWO_ROUTE_SECTIONS.map((section, i) => <g key={i}>
            <polyline className="campus-route-base" points={pointsAttribute(section)} />
            <polyline className="campus-route-planned" points={pointsAttribute(section)} />
            {active[i].length > 1 && <polyline className="campus-route-active" points={pointsAttribute(active[i])} />}
          </g>)}
        </g>
        <g aria-hidden="true">
          {/* 통행로 표시선은 대기 동선에 직각이며, 빈 공간을 연결하지 않습니다. */}
          {[TWO_CLEAR_PASSAGE.from, TWO_CLEAR_PASSAGE.to].map(([x, y], i) =>
            <path key={i} d={`M${x - 9} ${y + 17}L${x + 9} ${y - 17}`} className="campus-passage-boundary" />)}
          <path d={`M${passageX + 15} ${passageY - 8}L${passageLabelX - 84} ${passageLabelY + 12}`} className="campus-passage-pointer" />
          <rect x={passageLabelX - 82} y={passageLabelY - 25} width="164" height="54" rx="6" className="campus-passage-plate" />
          <text x={passageLabelX} y={passageLabelY + 13} className="campus-passage-label">통행로</text>

          <circle cx={boothX} cy={boothY} r="28" className="campus-booth-halo" />
          <circle cx={boothX} cy={boothY} r="17" className="campus-booth-dot" />
          <rect x={boothX - 270} y={boothY + 47} width="282" height="62" rx="5" className="campus-booth-plate" />
          <text x={boothX - 129} y={boothY + 89} className="campus-booth-label">팔찌 부스 2 · 시작</text>
          {end && <circle cx={end[0]} cy={end[1]} r="18" className="campus-queue-end" />}
        </g>
      </svg>
      <div className="campus-map-key" aria-label="지도 범례">
        <span><i className="campus-key-active" />현재 대기줄</span>
        <span><i className="campus-key-planned" />대기 동선</span>
        <span><i className="campus-key-end" />줄 끝</span>
        <span><i className="campus-key-road" />도로</span>
      </div>
      <p className="campus-passage-note">국제관 앞 통행 공간은 비워 두고, 건너편 줄을 따라 대기해 주세요.</p>
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}
