'use client';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type ComponentType, type PointerEvent, type ReactNode } from 'react';
import { type Point, type RouteData, validRoute, renderedSections, distance, length } from '../shared/route';
import { editableDefault, routeMaps, routeWarnings } from './maps/route-registry';
import type { QueueItem } from './queue-page';

export type RouteQueue = { id:string; name:string; queueValue:number; updatedAt:string; route?:RouteData|null; routeRevision?:number };
type History = {revision:number;route:RouteData|null;createdAt:string};
type Draft = {route:RouteData|null;baseRevision:number;updatedAt:string};
type EditorResponse = {queue:QueueItem;history:History[];draft:Draft|null;draftAt:string};
type MapProps = {value:number;locationName:string;route?:RouteData|null;children?:ReactNode};
export default function RouteEditor({queue,token,baseUrl,Map,onUpdated,onClose}:{queue:QueueItem;token:string;baseUrl:string;Map:ComponentType<MapProps>;onUpdated:(q:QueueItem)=>void;onClose:()=>void}) {
  const [current,setCurrent]=useState(queue),[route,setRoute]=useState<RouteData|null>(queue.route??null);
  const [value,setValue]=useState(queue.queueValue),[confirmed,setConfirmed]=useState(false),[ack,setAck]=useState(false);
  const [history,setHistory]=useState<History[]>([]),[draft,setDraft]=useState<Draft|null>(null);
  const [past,setPast]=useState<(RouteData|null)[]>([]),[future,setFuture]=useState<(RouteData|null)[]>([]);
  const [selection,setSelection]=useState<[number,number]>([0,0]);
  const [mode,setMode]=useState<'move'|'add'|'gap'|'end'>('move');
  const [busy,setBusy]=useState(true),[ready,setReady]=useState(false),[message,setMessage]=useState('동선 이력을 불러오는 중입니다.');
  const [dirty,setDirty]=useState(false);
  const drag=useRef<{section:number;point:number;original:RouteData|null}|null>(null);
  const updatedRef=useRef(onUpdated);
  useEffect(()=>{updatedRef.current=onUpdated;},[onUpdated]);
  const editable=useMemo(()=>route??editableDefault(queue.id),[route,queue.id]);
  const spec=routeMaps[queue.id],view=spec.view;
  const valid=validRoute(editable);
  const deferredRoute=useDeferredValue(editable);
  const checking=deferredRoute!==editable;
  const warnings=useMemo(()=>validRoute(deferredRoute)?routeWarnings(queue.id,deferredRoute):['각 구간에는 최소 2개의 점이 필요합니다. 전체 점은 240개까지 사용할 수 있습니다.'],[deferredRoute,queue.id]);
  const selectedSection=editable.sections[selection[0]]??editable.sections[0];
  const pointIndex=Math.min(selection[1],selectedSection.length-1);
  const locked=selection[0]===0&&pointIndex===0;

  const request=useCallback(async (body?:object) => {
    const r=await fetch(`${baseUrl}/api/v1/admin/queues/${encodeURIComponent(queue.id)}/route`,{method:body?'PATCH':'GET',cache:'no-store',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    if(r.status===409) throw new Error('다른 변경사항이 먼저 저장되었습니다. 임의로 덮어쓰지 않았습니다. 최신 상태 다시 불러오기를 눌러주세요.');
    if(r.status===401) throw new Error('인증이 만료되었습니다. 편집을 닫고 다시 로그인해 주세요.');
    if(!r.ok) throw new Error('저장 또는 조회에 실패했습니다. 연결 상태와 동선을 확인해 주세요.');
    return await r.json() as EditorResponse;
  },[baseUrl,queue.id,token]);
  const applyLoaded=useCallback((d:EditorResponse)=>{
    setCurrent(d.queue);setRoute(d.queue.route??null);setValue(d.queue.queueValue);setHistory(d.history);setDraft(d.draft);setPast([]);setFuture([]);setSelection([0,0]);setConfirmed(false);setAck(false);setDirty(false);setReady(true);updatedRef.current(d.queue);setMessage('점 이동 또는 점 추가를 선택하세요. 시작점은 고정되어 있습니다.');
  },[]);
  async function load() {
    setBusy(true);setReady(false);
    try { applyLoaded(await request()); }
    catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  useEffect(()=>{
    let active=true;
    request().then(d=>{if(active)applyLoaded(d);}).catch(e=>{if(active)setMessage((e as Error).message);}).finally(()=>{if(active)setBusy(false);});
    return()=>{active=false;};
  },[request,applyLoaded]); // One admin-only history request on editor entry.
  useEffect(()=>{if(!dirty)return;const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
  function change(next:RouteData|null) {setPast(p=>[...p.slice(-39),route]);setFuture([]);setRoute(next);setConfirmed(false);setAck(false);setDirty(true);}
  function movePoint(section:number,index:number,p:Point) {
    if(section===0&&index===0)return;
    setRoute(r=>{const source=r??editableDefault(queue.id);return {...source,sections:source.sections.map((s,i)=>i===section?s.map((q,j)=>j===index?p:q):s)};});
    setConfirmed(false);setAck(false);setDirty(true);
  }
  function point(e:PointerEvent<SVGElement>):Point|null {
    const svg=e.currentTarget.ownerSVGElement, matrix=svg?.getScreenCTM();if(!svg||!matrix)return null;
    const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
    return [Math.round(Math.max(view.left??0,Math.min((view.left??0)+view.width,p.x))*100)/100,Math.round(Math.max(view.top??0,Math.min((view.top??0)+view.height,p.y))*100)/100];
  }
  function setEnd(p:Point) {
    const sections=renderedSections(editable),total=sections.reduce((n,s)=>n+length(s),0);let traversed=0,best=Infinity,at=0;
    for(const s of sections)for(let i=1;i<s.length;i++) {const a=s[i-1],b=s[i],d=distance(a,b),dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(d*d||1)));const near:Point=[a[0]+dx*t,a[1]+dy*t],delta=distance(p,near);if(delta<best){best=delta;at=traversed+d*t;}traversed+=d;}
    setValue(Math.round(1000*at/(total||1)));setConfirmed(false);
  }
  function canvasDown(e:PointerEvent<SVGRectElement>) {
    if(busy||!ready)return;const p=point(e);if(!p)return;
    if(mode==='end'){setEnd(p);return;}
    if(mode==='gap'){
      if(editable.sections.length>=8)return;
      change({...editable,sections:[...editable.sections,[p]]});setSelection([editable.sections.length,0]);setMode('add');return;
    }
    if(mode==='add') {
      const si=selection[0];if(selectedSection.length>=120)return;
      change({...editable,sections:editable.sections.map((s,i)=>i===si?[...s.slice(0,pointIndex+1),p,...s.slice(pointIndex+1)]:s)});setSelection([si,pointIndex+1]);
    }
  }
  async function save(action:'draft'|'publish') {
    if(!ready||busy||!valid)return;
    if(action==='publish'&&(checking||!confirmed||(warnings.length>0&&!ack)))return;
    if(action==='publish'&&!window.confirm('이 동선과 현재 줄 끝을 사용자 화면에 공개 적용할까요? 이전 동선은 이력에서 복구할 수 있습니다.'))return;
    setBusy(true);
    try {
      const result=await request({action,route,expectedRevision:current.routeRevision??0,expectedUpdatedAt:current.updatedAt,expectedDraftAt:draft?.updatedAt??null,queueValue:value,acknowledgeWarnings:ack});
      setDirty(false);
      if(action==='draft'){setDraft({route,baseRevision:current.routeRevision??0,updatedAt:result.draftAt});setMessage('임시 저장했습니다. 사용자 화면에는 아직 반영되지 않습니다.');}
      else {updatedRef.current(result.queue);onClose();}
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  return <section className="route-editor" aria-label="대기 동선 편집기">
    <header className="route-editor-heading"><div><strong>동선 편집</strong><small>공개 버전 {current.routeRevision??0} · 적용 전까지 비공개</small></div><button type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm('임시 저장하지 않은 편집을 닫을까요?'))onClose();}}>편집 닫기</button></header>
    <fieldset disabled={busy||!ready} className="route-tools">
      <div className="route-tool-row">{([['move','점 이동'],['add','점 추가'],['gap','새 구간'],['end','줄 끝 지정']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}>{label}</button>)}</div>
      <p>{mode==='move'?'지도 위 점을 끌어서 옮기세요. 아래 점 선택과 방향키 버튼으로도 움직일 수 있습니다.':mode==='add'?'지도를 누르면 선택한 점 다음에 새 점을 추가합니다. 마지막 점을 선택하면 동선을 연장합니다.':mode==='gap'?'통행 공간 건너편의 새 시작점을 누른 후, 다음 점을 추가하세요. 구간 사이는 연결하지 않습니다.':'지도에서 실제 줄 끝에 가까운 곳을 누르세요. 가장 가까운 대기 동선 위치로 맞춰집니다.'}</p>
    </fieldset>
    <div className={`route-editor-map ${mode==='move'?'':'route-drawing'}`}>
      <Map value={value} locationName={queue.name} route={route}>
        <g className="route-editor-overlay" onPointerMove={e=>{if(!drag.current)return;const p=point(e);if(p)movePoint(drag.current.section,drag.current.point,p);}}
          onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{if(drag.current){setRoute(drag.current.original);drag.current=null;}}}>
          <rect x={view.left??0} y={view.top??0} width={view.width} height={view.height} fill="transparent" onPointerDown={canvasDown}/>
          {mode!=='end'&&editable.sections.map((s,si)=>s.map((p,pi)=><g key={`${si}-${pi}`}>
            <circle cx={p[0]} cy={p[1]} r="20" className={`route-control-point ${selection[0]===si&&pointIndex===pi?'selected':''} ${si===0&&pi===0?'fixed':''}`} role="button" tabIndex={busy||!ready?-1:0} aria-label={`${si+1}구간 ${pi+1}번 점${si===0&&pi===0?' 시작점 고정':''}`}
              onPointerDown={e=>{e.stopPropagation();if(busy||!ready)return;setSelection([si,pi]);if(mode!=='move'||(si===0&&pi===0))return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={section:si,point:pi,original:route};setPast(p=>[...p.slice(-39),route]);setFuture([]);}}
              onKeyDown={e=>{if(busy||!ready)return;if(e.key==='Enter'){setSelection([si,pi]);return;}const d:Record<string,Point>={ArrowUp:[0,-2],ArrowDown:[0,2],ArrowLeft:[-2,0],ArrowRight:[2,0]};if(d[e.key]&&!(si===0&&pi===0)){e.preventDefault();setPast(p=>[...p.slice(-39),route]);setFuture([]);movePoint(si,pi,clamp([p[0]+d[e.key][0],p[1]+d[e.key][1]]));}}}/>
            <text x={p[0]} y={p[1]+6} className="route-point-number" pointerEvents="none">{pi+1}</text>
          </g>))}
        </g>
      </Map>
    </div>
    <fieldset disabled={busy||!ready} className="route-tools">
      <div className="route-tool-row"><label>구간 <select value={selection[0]} onChange={e=>setSelection([Number(e.target.value),0])}>{editable.sections.map((_,i)=><option key={i} value={i}>{i+1}구간</option>)}</select></label><label>점 <select value={pointIndex} onChange={e=>setSelection([selection[0],Number(e.target.value)])}>{selectedSection.map((_,i)=><option key={i} value={i}>{i+1}번</option>)}</select></label></div>
      <div className="route-tool-row">{([['←',-2,0],['↑',0,-2],['↓',0,2],['→',2,0]] as const).map(([label,x,y])=><button key={label} type="button" aria-label={`선택한 점 ${label} 이동`} disabled={locked} onClick={()=>{setPast(p=>[...p.slice(-39),route]);setFuture([]);movePoint(selection[0],pointIndex,clamp([selectedSection[pointIndex][0]+x,selectedSection[pointIndex][1]+y]));}}>{label}</button>)}</div>
      <div className="route-tool-row"><button type="button" disabled={locked||selectedSection.length<=2} onClick={()=>{change({...editable,sections:editable.sections.map((s,i)=>i===selection[0]?s.filter((_,j)=>j!==pointIndex):s)});setSelection([selection[0],Math.max(0,pointIndex-1)]);}}>점 삭제</button>
        <button type="button" disabled={pointIndex<1||pointIndex>selectedSection.length-3||editable.sections.length>=8} onClick={()=>{const si=selection[0];change({...editable,sections:[...editable.sections.slice(0,si),selectedSection.slice(0,pointIndex+1),selectedSection.slice(pointIndex+1),...editable.sections.slice(si+1)]});}}>다음 점 사이 비우기</button>
        <button type="button" disabled={selection[0]===0} onClick={()=>{change({...editable,sections:editable.sections.filter((_,i)=>i!==selection[0])});setSelection([0,0]);}}>구간 삭제</button></div>
      <label className="route-range-label">모서리 보정 <input type="range" min="0" max="24" value={editable.rounding} onChange={e=>change({...editable,rounding:Number(e.target.value)})}/></label>
      <div className="route-tool-row"><button type="button" disabled={!past.length} onClick={()=>{setFuture(f=>[route,...f]);setRoute(past[past.length-1]);setPast(p=>p.slice(0,-1));setSelection([0,0]);setConfirmed(false);setAck(false);setDirty(true);}}>실행 취소</button><button type="button" disabled={!future.length} onClick={()=>{setPast(p=>[...p,route]);setRoute(future[0]);setFuture(f=>f.slice(1));setSelection([0,0]);setConfirmed(false);setAck(false);setDirty(true);}}>다시 실행</button></div>
      {!!warnings.length&&<aside className="route-warning">{warnings.map(w=><p key={w}>{w}</p>)}<p>자동 검사는 참고용입니다. 실제 현장 통행 가능 여부를 확인해 주세요.</p></aside>}
      <label className="route-range-label">현재 줄 끝 맞추기 <input className="queue-meter-slider" type="range" min="0" max="1000" value={value} onChange={e=>{setValue(Number(e.target.value));setConfirmed(false);}} style={{'--queue-progress':`${value/10}%`} as React.CSSProperties}/></label>
      <label className="route-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>새 동선에서 현재 줄 끝 위치를 확인했습니다.</label>
      {!!warnings.length&&<label className="route-check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>경고 구간이 실제로 대기 가능한 곳인지 확인했습니다.</label>}
      <div className="route-tool-row"><button type="button" disabled={!valid} onClick={()=>save('draft')}>임시 저장</button><button type="button" className="route-publish" disabled={checking||!valid||!confirmed||(!!warnings.length&&!ack)} onClick={()=>save('publish')}>공개 적용</button></div>
      <details className="route-history"><summary>저장된 동선 / 이전 버전 복구</summary>
        {draft&&<button type="button" disabled={draft.baseRevision!==(current.routeRevision??0)} onClick={()=>{change(draft.route);setSelection([0,0]);setMessage('임시 동선을 불러왔습니다. 줄 끝을 확인한 후 공개 적용하세요.');}}>임시 동선 불러오기{draft.baseRevision!==(current.routeRevision??0)?' (이전 공개 버전 기준)':''}</button>}
        <button type="button" onClick={()=>{change(null);setSelection([0,0]);}}>기본 지도 동선으로 되돌리기</button>
        {history.map(h=><button key={h.revision} type="button" onClick={()=>{change(h.route);setSelection([0,0]);setMessage(`${h.revision}번 동선을 미리 보고 있습니다. 줄 끝을 확인한 뒤 공개 적용해야 복구됩니다.`);}}>버전 {h.revision} · {new Date(h.createdAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</button>)}
        <p>복구도 새 버전으로 저장합니다. 이전 이력과 기존 운영시간·입장 상태는 유지합니다. 최근 50개 이력을 표시합니다.</p>
      </details>
    </fieldset>
    <p className="route-feedback" role="status" aria-live="polite">{busy?'처리 중…':message}</p>
    <button type="button" disabled={busy} onClick={()=>{if(!dirty||window.confirm('저장하지 않은 편집을 버리고 최신 상태를 불러올까요?'))void load();}}>최신 상태 다시 불러오기</button>
  </section>;
  function clamp(p:Point):Point {return [Math.max(view.left??0,Math.min((view.left??0)+view.width,p[0])),Math.max(view.top??0,Math.min((view.top??0)+view.height,p[1]))];}
}
