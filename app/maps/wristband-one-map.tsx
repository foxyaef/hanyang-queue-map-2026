import {
  filledRoute, MAP_BUILDINGS, MAP_ROADS, MAP_SIZE, pointsAttribute,
  THEATER_EAST_STAND, THEATER_SEATING, THEATER_STAGE, THEATER_TIERS, WRISTBAND_ONE_ROUTE,
} from './wristband-one-layout';

export default function WristbandOneMap({ value, locationName, overlayText }: {
  value: number; locationName: string; overlayText?: string;
}) {
  const active = filledRoute(WRISTBAND_ONE_ROUTE, value);
  const [endX, endY] = active[active.length - 1];

  return (
    <div className="map-canvas-wrap campus-map-wrap">
      <svg className="campus-map" viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`} role="img"
        aria-label={`${locationName} 대기 지도. 노천극장 아래 주차장 안쪽의 팔찌 부스에서 오른쪽으로 이동한 후, 주차장 동쪽과 남쪽을 따라 신소재공학관 서쪽까지 이어지는 대기 동선.`}>
        <rect width="1080" height="1620" className="campus-ground" />

        <g className="campus-landscape" aria-hidden="true">
          <path d="M88 994 Q145 980 210 983 Q221 1002 194 1035 L109 1168 Q91 1181 87 1154Z" />
          <path d="M523 1364 Q646 1338 758 1351 Q801 1359 758 1393 L602 1492 Q581 1496 566 1461Z" />
          <path d="M704 520 L860 472 Q891 463 882 487 L774 560Z" />
        </g>

        {/* 도로의 외곽을 먼저 그리고 내부를 합쳐 교차로에 중복 경계선이 남지 않게 합니다. */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {MAP_ROADS.map((road) => <polyline key={`${road.id}-edge`} className="campus-road-edge" points={pointsAttribute(road.points)} strokeWidth={road.width + 6} />)}
          {MAP_ROADS.map((road) => <polyline key={road.id} className="campus-road" points={pointsAttribute(road.points)} strokeWidth={road.width} />)}
        </g>

        <g aria-hidden="true">
          <path className="campus-parking" d="M316 628 H746 Q764 628 768 651 L779 944 Q780 980 748 980 H316 Q293 980 293 956 V652 Q293 628 316 628Z" />
          <polyline points="599,661 768,661 790,669" className="campus-parking-aisle" />
          <circle cx="498" cy="811" r="31" className="campus-parking-symbol" />
          <text x="498" y="824" className="campus-parking-p">P</text>
          <text x="498" y="884" className="campus-parking-label">주차장</text>
        </g>

        <g className="campus-building-shapes" aria-hidden="true">
          {MAP_BUILDINGS.map((building) => <polygon key={building.id} points={pointsAttribute(building.points)} />)}
          <polygon points={pointsAttribute(THEATER_SEATING)} />
          <polygon points={pointsAttribute(THEATER_EAST_STAND)} />
          <polygon points={pointsAttribute(THEATER_STAGE)} />
        </g>
        <g className="campus-theater-tiers" fill="none" aria-hidden="true">
          {THEATER_TIERS.map((tier, i) => <polyline key={i} points={pointsAttribute(tier)} />)}
          <path d="M353 188V306 M163 276L246 359 M543 275L463 359 M523 521L736 441 M514 538L721 469" />
        </g>
        <g className="campus-labels" textAnchor="middle" aria-hidden="true">
          {MAP_BUILDINGS.map((building) => <text key={building.id} x={building.label[0]} y={building.label[1]}
            className={building.small ? 'campus-building-label campus-small-label' : 'campus-building-label'}>
            {building.lines.map((line, index) => <tspan key={line} x={building.label[0]} dy={index === 0 ? 0 : 43}>{line}</tspan>)}
            <tspan x={building.label[0]} dy="42" className="campus-building-number">{building.number}</tspan>
          </text>)}
          <text x="353" y="470" className="campus-theater-label">노천극장<tspan x="353" dy="47" className="campus-building-number">209동</tspan></text>
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline className="campus-route-base" points={pointsAttribute(WRISTBAND_ONE_ROUTE)} />
          <polyline className="campus-route-planned" points={pointsAttribute(WRISTBAND_ONE_ROUTE)} />
          {value > 0 && <polyline className="campus-route-active" points={pointsAttribute(active)} />}
        </g>
        <g aria-hidden="true">
          <circle cx="599" cy="661" r="28" className="campus-booth-halo" />
          <circle cx="599" cy="661" r="17" className="campus-booth-dot" />
          <rect x="520" y="707" width="158" height="62" rx="5" className="campus-booth-plate" />
          <text x="599" y="749" className="campus-booth-label">수령처</text>
          {value > 0 && <>
            <circle cx={endX} cy={endY} r="18" className="campus-queue-end" />
          </>}
        </g>
      </svg>
      <div className="campus-map-key" aria-label="지도 범례">
        <span><i className="campus-key-active" />현재 대기줄</span>
        <span><i className="campus-key-planned" />대기 동선</span>
        <span><i className="campus-key-end" />줄 끝</span>
        <span><i className="campus-key-road" />도로</span>
      </div>
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}
