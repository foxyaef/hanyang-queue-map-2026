'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CategoryId = 'wristband' | 'entrance';

type QueueItem = {
  id: string;
  category: CategoryId;
  name: string;
  value: number;
  updatedAt: string;
};

type QueueApiResponse = {
  queues: QueueItem[];
};

const categories: { id: CategoryId; label: string; caption: string }[] = [
  { id: 'wristband', label: '팔찌 수령', caption: 'WRISTBAND' },
  { id: 'entrance', label: '노천 입장', caption: 'ENTRANCE' },
];

const sampleQueues: QueueItem[] = [
  { id: 'wristband-1', category: 'wristband', name: '수령처 1', value: 640, updatedAt: '2026-08-29T18:32:00+09:00' },
  { id: 'wristband-2', category: 'wristband', name: '수령처 2', value: 360, updatedAt: '2026-08-29T18:28:00+09:00' },
  { id: 'wristband-3', category: 'wristband', name: '수령처 3', value: 170, updatedAt: '2026-08-29T18:30:00+09:00' },
  { id: 'entrance-1', category: 'entrance', name: '입장문 1', value: 780, updatedAt: '2026-08-29T18:31:00+09:00' },
  { id: 'entrance-2', category: 'entrance', name: '입장문 2', value: 470, updatedAt: '2026-08-29T18:27:00+09:00' },
  { id: 'entrance-3', category: 'entrance', name: '입장문 3', value: 90, updatedAt: '2026-08-29T18:29:00+09:00' },
];

function queueStatus(value: number) {
  if (value >= 750) return { label: '대기 매우 많음', short: '매우 많음', tone: 'busy' };
  if (value >= 500) return { label: '대기 많음', short: '많음', tone: 'high' };
  if (value >= 250) return { label: '대기 보통', short: '보통', tone: 'medium' };
  return { label: '대기 원활', short: '원활', tone: 'low' };
}

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '업데이트 시각 확인 불가';

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function QueueMap({ value, category, locationName }: { value: number; category: CategoryId; locationName: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);

    const sx = width / 360;
    const sy = height / 430;
    ctx.save();
    ctx.scale(sx, sy);

    const background = ctx.createLinearGradient(0, 0, 360, 430);
    background.addColorStop(0, '#132b61');
    background.addColorStop(1, '#091a3a');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 360, 430);

    ctx.strokeStyle = 'rgba(115, 211, 226, .07)';
    ctx.lineWidth = 1;
    for (let i = -120; i < 480; i += 34) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 70, 90, i - 40, 200, i + 72, 430);
      ctx.stroke();
    }

    const buildings = [
      { x: 30, y: 46, w: 82, h: 57, label: '국제관' },
      { x: 126, y: 32, w: 105, h: 72, label: '노천극장' },
      { x: 250, y: 54, w: 79, h: 52, label: '공연센터' },
      { x: 31, y: 143, w: 69, h: 88, label: '박물관' },
      { x: 119, y: 139, w: 116, h: 72, label: '신소재공학관' },
      { x: 255, y: 138, w: 74, h: 92, label: '제2공학관' },
      { x: 32, y: 270, w: 94, h: 65, label: '토건관' },
      { x: 148, y: 262, w: 97, h: 83, label: '과학기술관' },
      { x: 267, y: 271, w: 63, h: 63, label: '본관' },
    ];

    buildings.forEach((building, index) => {
      ctx.fillStyle = index === 1 ? 'rgba(78, 122, 181, .62)' : 'rgba(76, 112, 166, .42)';
      ctx.strokeStyle = 'rgba(137, 177, 220, .25)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, building.x, building.y, building.w, building.h, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(224, 238, 255, .72)';
      ctx.textAlign = 'center';
      ctx.font = '500 10px Arial, sans-serif';
      ctx.fillText(building.label, building.x + building.w / 2, building.y + building.h / 2 + 3);
    });

    ctx.strokeStyle = 'rgba(172, 207, 232, .15)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(16, 120);
    ctx.bezierCurveTo(95, 120, 241, 117, 344, 124);
    ctx.moveTo(137, 0);
    ctx.bezierCurveTo(142, 120, 132, 294, 122, 430);
    ctx.moveTo(247, 0);
    ctx.bezierCurveTo(248, 112, 245, 301, 250, 430);
    ctx.stroke();

    const routes = category === 'wristband'
      ? [
          { x: 306, y: 389 }, { x: 270, y: 371 }, { x: 219, y: 376 }, { x: 164, y: 378 },
          { x: 109, y: 366 }, { x: 84, y: 337 }, { x: 82, y: 291 }, { x: 105, y: 257 },
          { x: 137, y: 237 }, { x: 151, y: 206 }, { x: 151, y: 174 }, { x: 167, y: 134 },
        ]
      : [
          { x: 43, y: 389 }, { x: 56, y: 348 }, { x: 79, y: 320 }, { x: 106, y: 286 },
          { x: 122, y: 247 }, { x: 150, y: 225 }, { x: 195, y: 224 }, { x: 232, y: 204 },
          { x: 247, y: 174 }, { x: 246, y: 134 }, { x: 224, y: 111 }, { x: 201, y: 107 },
        ];

    ctx.strokeStyle = 'rgba(255, 255, 255, .13)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([1, 16]);
    ctx.beginPath();
    ctx.moveTo(routes[0].x, routes[0].y);
    routes.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    const lengths: number[] = [];
    let total = 0;
    for (let i = 1; i < routes.length; i += 1) {
      const dx = routes[i].x - routes[i - 1].x;
      const dy = routes[i].y - routes[i - 1].y;
      const length = Math.hypot(dx, dy);
      lengths.push(length);
      total += length;
    }

    const activeLength = Math.max(16, total * Math.min(1000, Math.max(0, value)) / 1000);
    ctx.strokeStyle = category === 'wristband' ? '#b579ff' : '#58ead1';
    ctx.shadowColor = category === 'wristband' ? 'rgba(181, 121, 255, .75)' : 'rgba(88, 234, 209, .7)';
    ctx.shadowBlur = 9;
    ctx.lineWidth = 10;
    ctx.setLineDash([1, 16]);
    ctx.beginPath();
    ctx.moveTo(routes[0].x, routes[0].y);

    let walked = 0;
    for (let i = 1; i < routes.length; i += 1) {
      const segment = lengths[i - 1];
      if (walked + segment <= activeLength) {
        ctx.lineTo(routes[i].x, routes[i].y);
        walked += segment;
        continue;
      }

      const part = Math.max(0, (activeLength - walked) / segment);
      ctx.lineTo(
        routes[i - 1].x + (routes[i].x - routes[i - 1].x) * part,
        routes[i - 1].y + (routes[i].y - routes[i - 1].y) * part,
      );
      break;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    const start = routes[0];
    ctx.fillStyle = category === 'wristband' ? '#b579ff' : '#58ead1';
    ctx.beginPath();
    ctx.arc(start.x, start.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7fbff';
    ctx.font = '700 10px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('줄 끝', start.x + 12, start.y + 4);

    const end = routes[routes.length - 1];
    ctx.fillStyle = '#f7fbff';
    drawRoundedRect(ctx, end.x - 24, end.y - 14, 48, 28, 14);
    ctx.fill();
    ctx.fillStyle = '#0d244c';
    ctx.font = '700 10px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(category === 'wristband' ? '수령' : '입장', end.x, end.y + 4);

    ctx.restore();
  }, [category, value]);

  return (
    <div className="map-canvas-wrap" role="img" aria-label={`${locationName}의 현재 대기 동선, 전체 구간의 ${Math.round(value / 10)}퍼센트`}>
      <canvas ref={canvasRef} className="queue-map" />
      <div className="map-compass" aria-hidden="true"><span>N</span><i /></div>
      <span className="map-place-label">한양대학교 서울캠퍼스</span>
    </div>
  );
}

export default function Home() {
  const [category, setCategory] = useState<CategoryId>('wristband');
  const [selectedId, setSelectedId] = useState('wristband-1');
  const [queues, setQueues] = useState<QueueItem[]>(sampleQueues);
  const [isLoading, setIsLoading] = useState(true);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadQueues() {
      try {
        const response = await fetch('/api/queues', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('queue api unavailable');
        const data = await response.json() as QueueApiResponse;
        if (!Array.isArray(data.queues) || data.queues.length === 0) throw new Error('invalid queue data');
        setQueues(data.queues);
        setIsSample(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setQueues(sampleQueues);
          setIsSample(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadQueues();
    return () => controller.abort();
  }, []);

  const locations = useMemo(() => queues.filter((queue) => queue.category === category), [category, queues]);
  const selected = queues.find((queue) => queue.id === selectedId) ?? locations[0] ?? sampleQueues[0];
  const status = queueStatus(selected.value);

  function changeCategory(nextCategory: CategoryId) {
    setCategory(nextCategory);
    const first = queues.find((queue) => queue.category === nextCategory);
    if (first) setSelectedId(first.id);
  }

  return (
    <main className="site-stage">
      <section className="mobile-shell">
        <header className="hero">
          <div className="hero-pattern" aria-hidden="true" />
          <div className="eyebrow-row">
            <p>2026 애국한양응원제 · 오름</p>
            <span>{isSample ? 'DESIGN PREVIEW' : 'LIVE'}</span>
          </div>
          <h1>지금, <em>줄이 어디까지</em><br />왔을까요?</h1>
          <p className="hero-copy">팔찌 수령과 노천극장 입장 대기 현황을<br />지도에서 바로 확인하세요.</p>
        </header>

        <div className="content-card">
          <div className="primary-tabs" role="tablist" aria-label="대기 유형 선택">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? 'active' : ''}
                onClick={() => changeCategory(item.id)}
              >
                <small>{item.caption}</small>
                <strong>{item.label}</strong>
              </button>
            ))}
          </div>

          <div className="section-heading">
            <div>
              <span>SELECT PLACE</span>
              <h2>{category === 'wristband' ? '팔찌를 받을 곳' : '입장할 곳'}을 선택하세요</h2>
            </div>
            <b>{locations.length}</b>
          </div>

          <div className="place-tabs" role="tablist" aria-label="장소 선택">
            {locations.map((location, index) => (
              <button
                key={location.id}
                type="button"
                role="tab"
                aria-selected={selected.id === location.id}
                className={selected.id === location.id ? 'active' : ''}
                onClick={() => setSelectedId(location.id)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {location.name}
              </button>
            ))}
          </div>

          <article className="queue-card" aria-busy={isLoading}>
            <div className="queue-card-head">
              <div>
                <p>현재 대기 동선</p>
                <h2>{selected.name}</h2>
              </div>
              <div className={`status-pill ${status.tone}`}>
                <i aria-hidden="true" />
                {isLoading ? '불러오는 중' : status.short}
              </div>
            </div>

            <QueueMap value={selected.value} category={category} locationName={selected.name} />

            <div className="queue-summary">
              <div>
                <p>현재 줄 길이</p>
                <strong>{Math.round(selected.value / 10)}<span>%</span></strong>
              </div>
              <div className="queue-meter" aria-hidden="true">
                <span style={{ width: `${selected.value / 10}%` }} />
              </div>
              <p className="queue-label">{status.label}</p>
            </div>
          </article>

          <div className="update-row" role="status" aria-live="polite">
            <span className="update-icon" aria-hidden="true">↻</span>
            <div>
              <p>마지막 업데이트</p>
              <strong>{formatUpdatedAt(selected.updatedAt)}</strong>
            </div>
            <p>페이지를 새로고침하면<br />최신 현황을 불러옵니다.</p>
          </div>

          <aside className="notice">
            <span aria-hidden="true">!</span>
            <p><strong>현장 상황에 따라 실제 대기 길이와 차이가 있을 수 있어요.</strong><br />안전요원의 안내를 우선으로 따라주세요.</p>
          </aside>

          <footer>
            <p>2026 애국한양응원제 축제기획단</p>
            <span>QUEUE MAP · BETA</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
