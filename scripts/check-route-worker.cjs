// Run only against the isolated local Wrangler configuration, never production.
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {editableDefault}=require('../app/maps/route-registry.ts');
const origin='http://127.0.0.1:8793';
async function call(path,body,auth=true){const r=await fetch(origin+path,{method:body?'PATCH':'GET',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer local-route-test-only'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};}
(async()=>{
  const path='/api/v1/admin/queues/wristband-2/route';
  assert.equal((await call(path,undefined,false)).status,401);
  const init=(await call(path)).body;assert(init.queue);
  const route=editableDefault('wristband-2');
  const payload={route,expectedRevision:init.queue.routeRevision,expectedUpdatedAt:init.queue.updatedAt};
  const draft=await call(path,{...payload,action:'draft',expectedDraftAt:init.draft?.updatedAt??null});assert.equal(draft.status,200);
  const publicDraft=(await call('/api/v1/queues',undefined,false)).body.queues.find(q=>q.id==='wristband-2');assert.equal(publicDraft.routeRevision,init.queue.routeRevision);
  const published=await call(path,{...payload,action:'publish',queueValue:640,expectedDraftAt:draft.body.draftAt,acknowledgeWarnings:true});assert.equal(published.status,200);
  assert.deepEqual(published.body.queue.route,route);
  assert.equal((await call(path,{...payload,action:'publish',queueValue:100,acknowledgeWarnings:true})).status,409);
  const visible=(await call('/api/v1/queues',undefined,false)).body.queues.find(q=>q.id==='wristband-2');assert.equal(visible.queueValue,640);assert.equal(visible.route.sections.length,2);
  const restored=await call(path,{action:'publish',route:null,expectedRevision:visible.routeRevision,expectedUpdatedAt:visible.updatedAt,queueValue:init.queue.queueValue});assert.equal(restored.status,200);assert.equal(restored.body.queue.route,null);
  const history=(await call(path)).body;assert.equal(history.draft,null);assert(history.history.length>=2);
  console.log('PASS: actual local Cloudflare Worker + D1 migration, authenticated draft/publish, public read, conflict rejection, history and default restore.');
})().catch(e=>{console.error(e);process.exitCode=1});
