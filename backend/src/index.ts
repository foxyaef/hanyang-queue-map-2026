import { validRoute, distance } from '../../shared/route';
import { routeMaps, routeWarnings } from '../../app/maps/route-registry';

interface Env {
  DB: D1Database;
  ASSETS?: Fetcher;
  ADMIN_TOKEN: string;
  FRONTEND_ORIGIN: string;
}

type Category = 'wristband' | 'entrance';

interface QueueRow {
  id: string;
  category: Category;
  name: string;
  display_order: number;
  queue_value: number;
  operating_start: string | null;
  operating_end: string | null;
  is_closed: number;
  updated_at: string;
  route_revision: number;
  route_json: string | null;
}

interface QueueUpdateBody {
  queueValue?: unknown;
  operatingStart?: unknown;
  operatingEnd?: unknown;
  isClosed?: unknown;
  expectedRouteRevision?: unknown;
  expectedUpdatedAt?: unknown;
}

const queueColumns = `
  id,
  category,
  name,
  display_order,
  queue_value,
  operating_start,
  operating_end,
  is_closed,
  updated_at,
  COALESCE((SELECT MAX(revision) FROM queue_route_versions WHERE queue_id=queues.id),0) AS route_revision,
  (SELECT route_json FROM queue_route_versions WHERE queue_id=queues.id ORDER BY revision DESC LIMIT 1) AS route_json
`;

const securityHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = new Set([
    env.FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
  ]);

  if (!origin || !allowedOrigins.has(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(
  request: Request,
  env: Env,
  data: unknown,
  status = 200,
): Response {
  return Response.json(data, {
    status,
    headers: {
      ...securityHeaders,
      ...getCorsHeaders(request, env),
    },
  });
}

function serializeQueue(row: QueueRow) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    displayOrder: row.display_order,
    queueValue: row.queue_value,
    operatingStart: row.operating_start,
    operatingEnd: row.operating_end,
    isClosed: Boolean(row.is_closed),
    updatedAt: row.updated_at,
    routeRevision: row.route_revision,
    route: row.route_json ? JSON.parse(row.route_json) : null,
  };
}

function isValidDateTime(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

async function sha256(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

async function tokensMatch(received: string, expected: string): Promise<boolean> {
  const [receivedHash, expectedHash] = await Promise.all([
    sha256(received),
    sha256(expected),
  ]);

  if (receivedHash.length !== expectedHash.length) return false;

  let difference = 0;
  for (let index = 0; index < receivedHash.length; index += 1) {
    difference |= receivedHash[index] ^ expectedHash[index];
  }
  return difference === 0;
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  const authorization = request.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ') || !env.ADMIN_TOKEN) return false;
  return tokensMatch(authorization.slice(7), env.ADMIN_TOKEN);
}

async function getQueue(env: Env, id: string): Promise<QueueRow | null> {
  return env.DB.prepare(`SELECT ${queueColumns} FROM queues WHERE id = ?1`)
    .bind(id)
    .first<QueueRow>();
}

async function listQueues(request: Request, env: Env): Promise<Response> {
  const result = await env.DB.prepare(`
    SELECT ${queueColumns}
    FROM queues
    ORDER BY CASE category WHEN 'wristband' THEN 0 ELSE 1 END, display_order
  `).all<QueueRow>();

  return json(request, env, {
    serverTime: new Date().toISOString(),
    queues: result.results.map(serializeQueue),
  });
}

async function listAdminQueues(request: Request, env: Env): Promise<Response> {
  if (!(await isAuthorized(request, env))) {
    return json(request, env, { error: 'UNAUTHORIZED' }, 401);
  }

  return listQueues(request, env);
}

async function updateQueue(
  request: Request,
  env: Env,
  queueId: string,
): Promise<Response> {
  if (!(await isAuthorized(request, env))) {
    return json(request, env, { error: 'UNAUTHORIZED' }, 401);
  }

  const current = await getQueue(env, queueId);
  if (!current) return json(request, env, { error: 'QUEUE_NOT_FOUND' }, 404);

  let body: QueueUpdateBody;
  try {
    body = await request.json<QueueUpdateBody>();
  } catch {
    return json(request, env, { error: 'INVALID_JSON' }, 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(request, env, { error: 'INVALID_JSON' }, 400);
  if ((body.expectedRouteRevision ?? 0) !== current.route_revision
      || (body.expectedUpdatedAt !== undefined && body.expectedUpdatedAt !== current.updated_at)) {
    return json(request, env, { error: 'CONFLICT_REFRESH_REQUIRED' }, 409);
  }

  const hasQueueValue = Object.hasOwn(body, 'queueValue');
  const hasOperatingStart = Object.hasOwn(body, 'operatingStart');
  const hasOperatingEnd = Object.hasOwn(body, 'operatingEnd');
  const hasClosed = Object.hasOwn(body, 'isClosed');

  if (!hasQueueValue && !hasOperatingStart && !hasOperatingEnd && !hasClosed) {
    return json(request, env, { error: 'NO_CHANGES' }, 400);
  }

  let queueValue = current.queue_value;
  let operatingStart = current.operating_start;
  let operatingEnd = current.operating_end;
  let isClosed = Boolean(current.is_closed);

  if (hasQueueValue) {
    if (!Number.isInteger(body.queueValue) || Number(body.queueValue) < 0 || Number(body.queueValue) > 1000) {
      return json(request, env, { error: 'QUEUE_VALUE_MUST_BE_INTEGER_0_TO_1000' }, 400);
    }
    queueValue = Number(body.queueValue);
  }

  if (current.category === 'wristband') {
    if (hasClosed) {
      return json(request, env, { error: 'IS_CLOSED_IS_ONLY_FOR_ENTRANCE' }, 400);
    }

    if (hasOperatingStart !== hasOperatingEnd) {
      return json(request, env, { error: 'OPERATING_START_AND_END_MUST_BE_SENT_TOGETHER' }, 400);
    }

    if (hasOperatingStart && hasOperatingEnd) {
      const clearingSchedule = body.operatingStart === null && body.operatingEnd === null;
      if (!clearingSchedule && (!isValidDateTime(body.operatingStart) || !isValidDateTime(body.operatingEnd))) {
        return json(request, env, { error: 'INVALID_OPERATING_TIME' }, 400);
      }

      operatingStart = clearingSchedule ? null : String(body.operatingStart);
      operatingEnd = clearingSchedule ? null : String(body.operatingEnd);

      if (operatingStart && operatingEnd && Date.parse(operatingStart) >= Date.parse(operatingEnd)) {
        return json(request, env, { error: 'OPERATING_END_MUST_BE_AFTER_START' }, 400);
      }
    }
  } else {
    if (hasOperatingStart || hasOperatingEnd) {
      return json(request, env, { error: 'OPERATING_TIME_IS_ONLY_FOR_WRISTBAND' }, 400);
    }
    if (hasClosed && typeof body.isClosed !== 'boolean') {
      return json(request, env, { error: 'IS_CLOSED_MUST_BE_BOOLEAN' }, 400);
    }
    if (hasClosed) isClosed = Boolean(body.isClosed);
  }

  const updatedAt = new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString();
  const changed = await env.DB.prepare(`
    UPDATE queues
    SET queue_value = ?1,
        operating_start = ?2,
        operating_end = ?3,
        is_closed = ?4,
        updated_at = ?5
    WHERE id = ?6 AND updated_at = ?7
      AND COALESCE((SELECT MAX(revision) FROM queue_route_versions WHERE queue_id=?6),0)=?8
  `).bind(
    queueValue,
    operatingStart,
    operatingEnd,
    isClosed ? 1 : 0,
    updatedAt,
    current.id,
    current.updated_at,
    current.route_revision,
  ).run();

  if (!changed.meta.changes) return json(request, env, { error: 'CONFLICT_REFRESH_REQUIRED' }, 409);

  const updated = await getQueue(env, current.id);
  return json(request, env, { queue: updated ? serializeQueue(updated) : null });
}

async function routes(request: Request, env: Env, id: string): Promise<Response> {
  if (!(await isAuthorized(request, env))) return json(request, env, {error:'UNAUTHORIZED'},401);
  const current=await getQueue(env,id);
  if(!current || !routeMaps[id]) return json(request,env,{error:'QUEUE_NOT_FOUND'},404);
  if(request.method==='GET') {
    const history=await env.DB.prepare('SELECT revision, route_json, created_at FROM queue_route_versions WHERE queue_id=? ORDER BY revision DESC LIMIT 50').bind(id).all<{revision:number;route_json:string|null;created_at:string}>();
    const draft=await env.DB.prepare('SELECT route_json,base_revision,updated_at FROM queue_route_drafts WHERE queue_id=?').bind(id).first<{route_json:string|null;base_revision:number;updated_at:string}>();
    return json(request,env,{queue:serializeQueue(current),history:history.results.map(r=>({revision:r.revision,route:r.route_json?JSON.parse(r.route_json):null,createdAt:r.created_at})),draft:draft?{route:draft.route_json?JSON.parse(draft.route_json):null,baseRevision:draft.base_revision,updatedAt:draft.updated_at}:null});
  }
  const raw=await request.text();
  if(raw.length>40000) return json(request,env,{error:'ROUTE_TOO_LARGE'},413);
  let body: Record<string,unknown>;
  try { body=JSON.parse(raw); } catch { return json(request,env,{error:'INVALID_JSON'},400); }
  if(!body || typeof body!=='object' || Array.isArray(body)) return json(request,env,{error:'INVALID_JSON'},400);
  if(body.action!=='draft' && body.action!=='publish') return json(request,env,{error:'INVALID_ACTION'},400);
  if(body.expectedRevision!==current.route_revision) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
  const route=body.route;
  if(route!==null) {
    if(!validRoute(route)) return json(request,env,{error:'INVALID_ROUTE'},400);
    const spec=routeMaps[id],v=spec.view;
    if(distance(route.sections[0][0],spec.sections[0][0])>0.1 || route.sections.flat().some(([x,y])=>x<(v.left??0)||x>(v.left??0)+v.width||y<(v.top??0)||y>(v.top??0)+v.height)) return json(request,env,{error:'INVALID_ROUTE_BOUNDS_OR_START'},400);
    if(body.action==='publish' && routeWarnings(id,route).length && body.acknowledgeWarnings!==true) return json(request,env,{error:'CHECK_ROUTE_WARNINGS'},400);
  }
  const routeJson=route===null?null:JSON.stringify(route);
  let now=new Date(Math.max(Date.now(),Date.parse(current.updated_at)+1)).toISOString();
  if(body.action==='draft') {
    // Compare-and-swap prevents another administrator's draft from being overwritten.
    const draft=await env.DB.prepare('SELECT updated_at FROM queue_route_drafts WHERE queue_id=?').bind(id).first<{updated_at:string}>();
    if(draft) now=new Date(Math.max(Date.parse(now),Date.parse(draft.updated_at)+1)).toISOString();
    if((body.expectedDraftAt??null)!==(draft?.updated_at??null)) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
    const result=await env.DB.prepare(`INSERT INTO queue_route_drafts(queue_id,route_json,base_revision,updated_at)
      SELECT ?1,?2,?3,?4 WHERE COALESCE((SELECT MAX(revision) FROM queue_route_versions WHERE queue_id=?1),0)=?3
      AND (SELECT updated_at FROM queue_route_drafts WHERE queue_id=?1) IS ?5
      ON CONFLICT(queue_id) DO UPDATE SET route_json=excluded.route_json,base_revision=excluded.base_revision,updated_at=excluded.updated_at`).bind(id,routeJson,current.route_revision,now,draft?.updated_at??null).run();
    if(!result.meta.changes) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
    return json(request,env,{draftAt:now});
  }
  if(!Number.isInteger(body.queueValue)||Number(body.queueValue)<0||Number(body.queueValue)>1000) return json(request,env,{error:'INVALID_QUEUE_VALUE'},400);
  if(body.expectedUpdatedAt!==current.updated_at) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
  try {
    const saved=await env.DB.prepare(`INSERT INTO queue_route_versions(queue_id,revision,route_json,queue_value,expected_updated_at,created_at)
      SELECT ?1,?2,?3,?4,?5,?6 WHERE (SELECT updated_at FROM queue_route_drafts WHERE queue_id=?1) IS ?7`)
      .bind(id,current.route_revision+1,routeJson,body.queueValue,current.updated_at,now,body.expectedDraftAt??null).run();
    if(!saved.meta.changes) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
  } catch(error) {
    if(/ROUTE_CONFLICT|UNIQUE constraint/.test(String(error))) return json(request,env,{error:'CONFLICT_REFRESH_REQUIRED'},409);
    throw error;
  }
  return json(request,env,{queue:serializeQueue((await getQueue(env,id))!)});
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request, env),
      });
    }

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        return json(request, env, { ok: true, service: 'hanyang-queue-api' });
      }

      if (request.method === 'GET' && url.pathname === '/api/v1/queues') {
        return listQueues(request, env);
      }

      if (request.method === 'GET' && url.pathname === '/api/v1/admin/queues') {
        return listAdminQueues(request, env);
      }

      const adminQueueMatch = url.pathname.match(/^\/api\/v1\/admin\/queues\/([^/]+)$/);
      const routeMatch=url.pathname.match(/^\/api\/v1\/admin\/queues\/([^/]+)\/route$/);
      if(routeMatch && (request.method==='GET'||request.method==='PATCH')) return routes(request,env,decodeURIComponent(routeMatch[1]));
      if (request.method === 'PATCH' && adminQueueMatch) {
        return updateQueue(request, env, decodeURIComponent(adminQueueMatch[1]));
      }

      if (url.pathname.startsWith('/api/') || url.pathname === '/health') {
        return json(request, env, { error: 'NOT_FOUND' }, 404);
      }

      if ((request.method === 'GET' || request.method === 'HEAD') && env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return json(request, env, { error: 'NOT_FOUND' }, 404);
    } catch (error) {
      console.error('Unhandled API error', error);
      return json(request, env, { error: 'INTERNAL_SERVER_ERROR' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
