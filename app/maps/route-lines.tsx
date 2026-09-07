import { Point, fillSections } from '../../shared/route';
import { pointsAttribute } from './wristband-one-layout';
export default function RouteLines({sections,value}:{sections:readonly (readonly Point[])[];value:number}) {
  const active=fillSections(sections,value);
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {sections.map((s,i)=><g key={i}>
      <polyline className="campus-route-base" points={pointsAttribute(s)} />
      <polyline className="campus-route-planned" points={pointsAttribute(s)} />
      {active[i].length>1&&<polyline className="campus-route-active" points={pointsAttribute(active[i])}/>}
    </g>)}
  </g>;
}
