# 대기열 API

공개 사용자 화면, 관리자 화면, API를 하나의 Cloudflare Worker에서 운영합니다. 정적 프론트엔드는 Worker Static Assets로 제공하고 데이터는 Cloudflare D1에 저장합니다.

운영 주소는 하나의 축제 전용 도메인을 사용합니다.

- `/`: 사용자 대기 지도
- `/admin`: 관리자 화면(후속 구현)
- `/api/v1/queues`: 공개 조회 API
- `/api/v1/admin/*`: 관리자 전용 API

프론트와 API가 같은 도메인에 있으므로 운영 환경에서는 별도 CORS 설정이나 API 서브도메인이 필요하지 않습니다. 기존 GitHub Pages 주소는 전환 기간 동안 예비 주소로 유지할 수 있습니다.

## API

- `GET /health`: 서버 상태 확인
- `GET /api/v1/queues`: 6개 대기열 전체 조회
- `PATCH /api/v1/admin/queues/:id`: 관리자 전용 대기열 수정

관리자 API는 `Authorization: Bearer <ADMIN_TOKEN>` 헤더가 필요합니다. `updatedAt`은 클라이언트가 보내지 않고 서버가 저장 시점에 자동 기록합니다.

### 팔찌 수령처 수정

```json
{
  "queueValue": 640,
  "operatingStart": "2026-09-02T10:00:00+09:00",
  "operatingEnd": "2026-09-02T20:00:00+09:00"
}
```

### 입장문 수정

```json
{
  "queueValue": 780,
  "isClosed": true
}
```

## 최초 설정

1. Cloudflare 계정에 로그인합니다: `pnpm exec wrangler login`
2. D1 DB를 생성합니다: `pnpm exec wrangler d1 create hanyang-queue-db`
3. 출력된 `database_id`를 `backend/wrangler.jsonc`에 입력합니다.
4. DB 테이블과 초기 6개 장소를 생성합니다: `pnpm backend:db:remote`
5. 충분히 긴 관리자 토큰을 등록합니다: `pnpm exec wrangler secret put ADMIN_TOKEN --config backend/wrangler.jsonc`
6. 프론트 정적 파일을 생성합니다: `pnpm build`
7. 프론트와 API를 함께 배포합니다: `pnpm backend:deploy`

처음에는 Cloudflare가 제공하는 `*.workers.dev` 주소로 확인할 수 있습니다. 도메인을 구매한 다음 Worker의 **Settings → Domains & Routes → Add → Custom Domain**에서 `queue.보유도메인`을 연결합니다.

## 로컬 실행

`backend/.dev.vars.example`을 `backend/.dev.vars`로 복사해 로컬 관리자 토큰을 정한 뒤 아래 순서로 실행합니다.

```bash
pnpm backend:db:local
pnpm backend:dev
```

로컬 API 기본 주소는 `http://localhost:8787`입니다.
