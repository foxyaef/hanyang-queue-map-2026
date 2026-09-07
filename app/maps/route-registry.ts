import { MAP_BUILDINGS, MAP_ROADS, MAP_SIZE, THEATER_SEATING, THEATER_STAGE, THEATER_EAST_STAND, WRISTBAND_ONE_ROUTE } from './wristband-one-layout';
import { TWO_BUILDINGS, TWO_MAP_SIZE, TWO_ROADS, TWO_ROUTE_SECTIONS, TWO_THEATER_SEATING, TWO_THEATER_STAGE } from './wristband-two-layout';
import { THREE_BUILDINGS, THREE_MAP_SIZE, THREE_ROADS, THREE_THEATER_SEATING, THREE_THEATER_STAGE, THREE_THEATER_EAST_STAND, WRISTBAND_THREE_ROUTE } from './wristband-three-layout';
import { ENTRANCE_ONE_BUILDINGS, ENTRANCE_ONE_NORTH_BUILDING, ENTRANCE_ONE_ROADS, ENTRANCE_ONE_ROUTE, ENTRANCE_ONE_VIEW } from './entrance-one-layout';
import { ENTRANCE_TWO_BUILDINGS, ENTRANCE_TWO_ROUTE, ENTRANCE_TWO_VIEW } from './entrance-two-layout';
import { ENTRANCE_THREE_ROADS, ENTRANCE_THREE_ROUTE, ENTRANCE_THREE_VIEW } from './entrance-three-layout';
import { Point, RouteData, renderedSections, segmentDistance, simplify, distance } from '../../shared/route';
type MapSpec = { sections: readonly (readonly Point[])[]; view: {left?: number; top?: number; width: number; height: number}; roads: {width:number; points: readonly Point[]}[]; buildings: readonly (readonly Point[])[] };
const oneTheater = [THEATER_SEATING, THEATER_STAGE, THEATER_EAST_STAND];
const twoTheater = [TWO_THEATER_SEATING, TWO_THEATER_STAGE];
const threeTheater = [THREE_THEATER_SEATING, THREE_THEATER_STAGE, THREE_THEATER_EAST_STAND];
export const routeMaps: Record<string, MapSpec> = {
  'wristband-1': {sections:[WRISTBAND_ONE_ROUTE],view:MAP_SIZE,roads:MAP_ROADS,buildings:[...MAP_BUILDINGS.map(b=>b.points),...oneTheater]},
  'wristband-2': {sections:TWO_ROUTE_SECTIONS,view:TWO_MAP_SIZE,roads:TWO_ROADS,buildings:[...TWO_BUILDINGS.map(b=>b.points),...twoTheater]},
  'wristband-3': {sections:[WRISTBAND_THREE_ROUTE],view:THREE_MAP_SIZE,roads:THREE_ROADS,buildings:[...THREE_BUILDINGS.map(b=>b.points),...threeTheater]},
  'entrance-1': {sections:[ENTRANCE_ONE_ROUTE],view:ENTRANCE_ONE_VIEW,roads:ENTRANCE_ONE_ROADS,buildings:[...ENTRANCE_ONE_BUILDINGS.map(b=>b.points),ENTRANCE_ONE_NORTH_BUILDING,...threeTheater]},
  'entrance-2': {sections:[ENTRANCE_TWO_ROUTE],view:ENTRANCE_TWO_VIEW,roads:MAP_ROADS,buildings:[...ENTRANCE_TWO_BUILDINGS.map(b=>b.points),...oneTheater]},
  'entrance-3': {sections:[ENTRANCE_THREE_ROUTE],view:ENTRANCE_THREE_VIEW,roads:ENTRANCE_THREE_ROADS,buildings:[...TWO_BUILDINGS.map(b=>b.points),...twoTheater]},
};
export function editableDefault(id: string): RouteData { return {schemaVersion:1,rounding:0,sections:routeMaps[id].sections.map(s=>simplify(s))}; }
export function inside(p: Point, polygon: readonly Point[]) {
  let result = false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if ((a[1]>p[1]) !== (b[1]>p[1]) && p[0] < (b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]) result=!result;
  }
  return result;
}
export function routeWarnings(id: string, route: RouteData): string[] {
  const map=routeMaps[id]; let building=false, road=false;
  for (const section of renderedSections(route)) for(let i=1;i<section.length;i++) {
    const a=section[i-1],b=section[i],steps=Math.ceil(distance(a,b)/5);
    for(let k=0;k<=steps;k++) {
      const t=k/(steps||1),p:Point=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
      if(map.buildings.some(poly=>inside(p,poly)||poly.some((q,j)=>segmentDistance(p,q,poly[(j+1)%poly.length])<9))) building=true;
      if(!map.roads.some(r=>r.points.slice(1).some((q,j)=>segmentDistance(p,r.points[j],q)<=r.width/2-9))) road=true;
    }
  }
  return [...(building?['건물에 선이 닿거나 겹치는 구간이 있습니다.']:[]),...(road?['도로 밖 구간이 있습니다. 주차장·광장 등 실제 통행 가능한 곳인지 확인하세요.']:[])];
}
