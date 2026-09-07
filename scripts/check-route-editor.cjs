// Real SQLite schema/triggers + the actual Worker handler. Never touches production.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {DatabaseSync}=require('node:sqlite');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {validRoute,fillSections,length,renderedSections}=require('../shared/route.ts');
const {routeMaps,editableDefault}=require('../app/maps/route-registry.ts');
const worker=require('../backend/src/index.ts').default;
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
for(const [id,file] of Object.entries({'wristband-1':'wristband-one','wristband-2':'wristband-two','wristband-3':'wristband-three','entrance-1':'entrance-one','entrance-2':'entrance-two','entrance-3':'entrance-three'})) {
  const Map=require(`../app/maps/${file}-map.tsx`).default;
  const route=editableDefault(id);
  const html=renderToStaticMarkup(React.createElement(Map,{value:1000,locationName:id,route},React.createElement('g',{'data-editor-overlay':'yes'})));
  assert.equal((html.match(/class="campus-route-planned"/g)||[]).length,route.sections.length);
  assert.equal((html.match(/class="campus-route-active"/g)||[]).length,route.sections.length);
  assert(html.includes('data-editor-overlay="yes"'));
  assert(html.includes(id.startsWith('wristband')?'수령처':'게이트'));
  assert.equal((html.match(/class="campus-queue-end"/g)||[]).length,1);
}
const sql=new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
sql.exec(fs.readFileSync('backend/migrations/0001_create_queues.sql','utf8'));
const before=sql.prepare('SELECT * FROM queues ORDER BY id').all();
sql.exec(fs.readFileSync('backend/migrations/0002_route_editor.sql','utf8'));
assert.deepEqual(sql.prepare('SELECT * FROM queues ORDER BY id').all(),before);
const env={ADMIN_TOKEN:'local-route-test-only',FRONTEND_ORIGIN:'http://localhost:3000',DB:{prepare(text){const stmt=sql.prepare(text);let args=[];const wrapped={bind(...v){args=v;return wrapped},async first(){return stmt.get(...args)??null},async all(){return {results:stmt.all(...args)}},async run(){const r=stmt.run(...args);return {success:true,meta:{changes:Number(r.changes)}}}};return wrapped;}}};
async function call(path,body,auth=true) {const r=await worker.fetch(new Request(`http://unit.test${path}`,{method:body===undefined?'GET':'PATCH',headers:{...(auth?{Authorization:`Bearer ${env.ADMIN_TOKEN}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);return {status:r.status,body:await r.json()};}
(async()=>{
  assert.equal((await call('/api/v1/admin/queues/wristband-1/route',undefined,false)).status,401);
  assert.equal((await call('/api/v1/admin/queues/wristband-1/route',{action:'publish'},false)).status,401);
  assert.equal((await call('/api/v1/queues',undefined,false)).body.queues.length,6);
  for(const id of Object.keys(routeMaps)){
    const route=editableDefault(id),sections=renderedSections(route),total=sections.reduce((n,s)=>n+length(s),0);
    assert(validRoute(route),id);assert.deepEqual(sections[0][0],routeMaps[id].sections[0][0]);
    for(let v=0;v<=1000;v++){const f=fillSections(sections,v);assert(Math.abs(f.reduce((n,s)=>n+length(s),0)-total*v/1000)<1e-6);if(v>0)assert.deepEqual(f[0][0],sections[0][0]);}
    const path=`/api/v1/admin/queues/${id}/route`,initial=(await call(path)).body.queue;
    let result=await call(path,{action:'draft',route,expectedRevision:0,expectedDraftAt:null});assert.equal(result.status,200,id);
    assert.equal((await call('/api/v1/queues')).body.queues.find(q=>q.id===id).route,null,'draft leaked');
    assert.equal((await call(path,{action:'draft',route,expectedRevision:0,expectedDraftAt:null})).status,409);
    const body={action:'publish',route,expectedRevision:0,expectedUpdatedAt:initial.updatedAt,expectedDraftAt:result.body.draftAt,queueValue:321,acknowledgeWarnings:true};
    const newerDraft=await call(path,{action:'draft',route,expectedRevision:0,expectedDraftAt:body.expectedDraftAt});assert.equal(newerDraft.status,200);
    assert.equal((await call(path,body)).status,409,'publication must not discard another administrator draft');
    body.expectedDraftAt=newerDraft.body.draftAt;
    const invalid=structuredClone(route);invalid.sections[0][0]=[0,0];
    assert.equal((await call(path,{...body,route:invalid})).status,400);
    assert.equal((await call(path,{...body,queueValue:1001})).status,400);
    assert.equal((await call(path,{...body,route:{...route,rounding:-1}})).status,400);
    result=await call(path,body);assert.equal(result.status,200,id);assert.equal(result.body.queue.routeRevision,1);assert.equal(result.body.queue.queueValue,321);assert.deepEqual(result.body.queue.route,route);
    assert.equal((await call(path,body)).status,409);
    assert.equal((await call(`/api/v1/admin/queues/${id}`,{queueValue:555})).status,409,'old clients must not save lengths against changed geometry');
    assert.equal((await call(path)).body.draft,null);
    const published=result.body.queue;
    result=await call(`/api/v1/admin/queues/${id}`,{queueValue:500,expectedRouteRevision:1,expectedUpdatedAt:published.updatedAt});assert.equal(result.status,200);
    assert.equal((await call(path,{...body,expectedRevision:1,expectedUpdatedAt:published.updatedAt})).status,409,'stale status must not be overwritten');
    const fresh=result.body.queue;
    const restored=await call(path,{...body,route:null,queueValue:500,expectedRevision:1,expectedUpdatedAt:fresh.updatedAt,expectedDraftAt:null});assert.equal(restored.status,200);assert.equal(restored.body.queue.route,null);assert.equal(restored.body.queue.routeRevision,2);assert.equal(restored.body.queue.operatingStart,initial.operatingStart);assert.equal(restored.body.queue.isClosed,initial.isClosed);
    assert.equal((await call(path)).body.history.length,2);
  }
  // Concurrent writers: exactly one version commits, with its matching queue length.
  const path='/api/v1/admin/queues/entrance-3/route',q=(await call(path)).body.queue;
  const shared={action:'publish',route:null,expectedRevision:q.routeRevision,expectedUpdatedAt:q.updatedAt,acknowledgeWarnings:true};
  const race=await Promise.all([call(path,{...shared,queueValue:111}),call(path,{...shared,queueValue:222})]);
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
  const final=(await call(path)).body.queue;assert.equal(final.queueValue,race.find(r=>r.status===200).body.queue.queueValue);
  assert.equal((await call('/api/v1/admin/queues/wristband-1/route',null)).status,400);
  console.log('PASS: additive migration, all 6 routes × 1001 lengths, gaps, auth, validation, private drafts, atomic publication, stale/concurrent writes and restoration.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>sql.close());
