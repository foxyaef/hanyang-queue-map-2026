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

    function drawMap() {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(width / 360, height / 470);

      const background = ctx.createLinearGradient(0, 0, 360, 470);
      background.addColorStop(0, '#0b1a33');
      background.addColorStop(1, '#020816');
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, 360, 470);

      ctx.strokeStyle = 'rgba(163, 185, 208, .045)';
      ctx.lineWidth = 1;
      for (let i = -160; i < 520; i += 28) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.bezierCurveTo(i + 90, 120, i - 45, 280, i + 88, 470);
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(205, 218, 233, .09)';
      ctx.lineWidth = 17;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 118);
      ctx.bezierCurveTo(98, 128, 232, 111, 360, 120);
      ctx.moveTo(88, 98);
      ctx.bezierCurveTo(81, 190, 83, 312, 112, 470);
      ctx.moveTo(151, 118);
      ctx.bezierCurveTo(149, 244, 145, 350, 132, 470);
      ctx.moveTo(342, 118);
      ctx.lineTo(342, 343);
      ctx.stroke();

      ctx.fillStyle = 'rgba(98, 126, 164, .18)';
      ctx.beginPath();
      ctx.ellipse(180, 61, 76, 49, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(205, 226, 241, .2)';
      ctx.lineWidth = 3;
      for (let ring = 0; ring < 4; ring += 1) {
        ctx.beginPath();
        ctx.ellipse(180, 61, 67 - ring * 8, 42 - ring * 5, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(225, 239, 250, .82)';
      ctx.textAlign = 'center';
      ctx.font = '700 12px Arial, sans-serif';
      ctx.fillText('노천극장', 180, 62);
      ctx.font = '500 9px Arial, sans-serif';
      ctx.fillText('209동', 180, 76);

      const buildings = [
        { x: 12, y: 25, w: 54, h: 72, label: '역사관', sub: '구본관' },
        { x: 8, y: 151, w: 60, h: 76, label: '국제관', sub: '108동' },
        { x: 101, y: 151, w: 37, h: 98, label: '박물관', sub: '109동' },
        { x: 14, y: 279, w: 55, h: 62, label: '토건관', sub: '' },
        { x: 164, y: 330, w: 165, h: 57, label: '신소재공학관', sub: '204동' },
        { x: 176, y: 412, w: 127, h: 46, label: '과학기술관', sub: '203동' },
      ];

      buildings.forEach((building) => {
        ctx.fillStyle = 'rgba(92, 119, 154, .24)';
        ctx.strokeStyle = 'rgba(186, 203, 222, .19)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, building.x, building.y, building.w, building.h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(230, 241, 250, .78)';
        ctx.textAlign = 'center';
        ctx.font = '600 9px Arial, sans-serif';
        ctx.fillText(building.label, building.x + building.w / 2, building.y + building.h / 2 - (building.sub ? 2 : -3));
        if (building.sub) {
          ctx.fillStyle = 'rgba(207, 225, 240, .52)';
          ctx.font = '500 8px Arial, sans-serif';
          ctx.fillText(building.sub, building.x + building.w / 2, building.y + building.h / 2 + 10);
        }
      });

      ctx.fillStyle = 'rgba(60, 87, 127, .24)';
      ctx.strokeStyle = 'rgba(177, 196, 218, .14)';
      drawRoundedRect(ctx, 164, 130, 165, 169, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(216, 231, 244, .34)';
      ctx.font = '700 9px Arial, sans-serif';
      ctx.fillText('주차장', 247, 218);

      const routes = category === 'wristband'
        ? [
            { x: 205, y: 128 }, { x: 205, y: 154 }, { x: 250, y: 154 }, { x: 250, y: 128 },
            { x: 330, y: 128 }, { x: 330, y: 292 }, { x: 160, y: 292 }, { x: 160, y: 202 },
          ]
        : [
            { x: 83, y: 116 }, { x: 67, y: 116 }, { x: 67, y: 132 }, { x: 78, y: 132 },
            { x: 78, y: 221 }, { x: 80, y: 288 }, { x: 91, y: 367 },
          ];

      const color = category === 'wristband' ? '#9b57e6' : '#27db80';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = category === 'wristband' ? 'rgba(155, 87, 230, .22)' : 'rgba(39, 219, 128, .2)';
      ctx.lineWidth = 5;
      ctx.setLineDash([2, 9]);
      ctx.beginPath();
      ctx.moveTo(routes[0].x, routes[0].y);
      routes.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
      ctx.setLineDash([]);

      const lengths: number[] = [];
      let total = 0;
      for (let i = 1; i < routes.length; i += 1) {
        const length = Math.hypot(routes[i].x - routes[i - 1].x, routes[i].y - routes[i - 1].y);
        lengths.push(length);
        total += length;
      }

      const activeLength = total * Math.min(1000, Math.max(0, value)) / 1000;
      let currentPoint = { ...routes[0] };

      if (activeLength > 0) {
        ctx.strokeStyle = color;
        ctx.shadowColor = category === 'wristband' ? 'rgba(155, 87, 230, .6)' : 'rgba(39, 219, 128, .55)';
        ctx.shadowBlur = 7;
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(routes[0].x, routes[0].y);

        let walked = 0;
        for (let i = 1; i < routes.length; i += 1) {
          const segment = lengths[i - 1];
          if (walked + segment <= activeLength) {
            ctx.lineTo(routes[i].x, routes[i].y);
            currentPoint = { ...routes[i] };
            walked += segment;
            continue;
          }

          const part = Math.max(0, (activeLength - walked) / segment);
          currentPoint = {
            x: routes[i - 1].x + (routes[i].x - routes[i - 1].x) * part,
            y: routes[i - 1].y + (routes[i].y - routes[i - 1].y) * part,
          };
          ctx.lineTo(currentPoint.x, currentPoint.y);
          break;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const entry = routes[0];
      ctx.fillStyle = '#f7fbff';
      drawRoundedRect(ctx, entry.x - 24, entry.y - 14, 48, 28, 14);
      ctx.fill();
      ctx.fillStyle = '#0d244c';
      ctx.font = '700 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(category === 'wristband' ? '수령' : '입장', entry.x, entry.y + 4);

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f7fbff';
      ctx.font = '700 10px Arial, sans-serif';
      ctx.textAlign = currentPoint.x > 285 ? 'right' : 'left';
      ctx.fillText('줄 끝', currentPoint.x > 285 ? currentPoint.x - 11 : currentPoint.x + 11, currentPoint.y + 4);

      ctx.restore();
    }

    drawMap();
    const observer = new ResizeObserver(drawMap);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [category, value]);

  return (
    <div className="map-canvas-wrap" role="img" aria-label={`${locationName}의 현재 대기 동선, 전체 구간의 ${Math.round(value / 10)}퍼센트`}>
      <canvas ref={canvasRef} className="queue-map" />
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
