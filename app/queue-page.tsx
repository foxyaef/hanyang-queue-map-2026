'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type CategoryId = 'wristband' | 'entrance';

type QueueItem = {
  id: string;
  category: CategoryId;
  name: string;
  displayOrder: number;
  queueValue: number;
  operatingStart: string | null;
  operatingEnd: string | null;
  isClosed: boolean;
  updatedAt: string;
};

type QueueApiResponse = {
  serverTime: string;
  queues: QueueItem[];
};

const categories: { id: CategoryId; label: string; caption: string }[] = [
  { id: 'wristband', label: '팔찌 수령', caption: 'WRISTBAND' },
  { id: 'entrance', label: '노천 입장', caption: 'ENTRANCE' },
];

const sampleQueues: QueueItem[] = [
  { id: 'wristband-1', category: 'wristband', name: '수령처 1', displayOrder: 1, queueValue: 640, operatingStart: '2026-09-02T10:00:00+09:00', operatingEnd: '2026-09-02T20:00:00+09:00', isClosed: false, updatedAt: '2026-09-02T09:32:00+09:00' },
  { id: 'wristband-2', category: 'wristband', name: '수령처 2', displayOrder: 2, queueValue: 360, operatingStart: '2026-09-02T10:00:00+09:00', operatingEnd: '2026-09-02T20:00:00+09:00', isClosed: false, updatedAt: '2026-09-02T09:28:00+09:00' },
  { id: 'wristband-3', category: 'wristband', name: '수령처 3', displayOrder: 3, queueValue: 170, operatingStart: '2026-09-02T10:00:00+09:00', operatingEnd: '2026-09-02T20:00:00+09:00', isClosed: false, updatedAt: '2026-09-02T09:30:00+09:00' },
  { id: 'entrance-1', category: 'entrance', name: '입장문 1', displayOrder: 1, queueValue: 780, operatingStart: null, operatingEnd: null, isClosed: false, updatedAt: '2026-09-02T09:31:00+09:00' },
  { id: 'entrance-2', category: 'entrance', name: '입장문 2', displayOrder: 2, queueValue: 470, operatingStart: null, operatingEnd: null, isClosed: false, updatedAt: '2026-09-02T09:27:00+09:00' },
  { id: 'entrance-3', category: 'entrance', name: '입장문 3', displayOrder: 3, queueValue: 90, operatingStart: null, operatingEnd: null, isClosed: false, updatedAt: '2026-09-02T09:29:00+09:00' },
];

const sampleServerTime = '2026-09-02T09:32:00+09:00';
const apiBaseUrl = process.env.NEXT_PUBLIC_QUEUE_API_URL?.replace(/\/$/, '') ?? '';

function queueStatus(queue: QueueItem, serverTime: string) {
  if (queue.category === 'entrance' && queue.isClosed) {
    return { label: '입장이 마감되었습니다', short: '입장 마감', tone: 'closed', showQueue: false };
  }

  if (queue.category === 'wristband') {
    if (!queue.operatingStart || !queue.operatingEnd) {
      return { label: '운영시간을 확인하고 있습니다', short: '시간 미설정', tone: 'schedule', showQueue: false };
    }

    const now = Date.parse(serverTime);
    const start = Date.parse(queue.operatingStart);
    const end = Date.parse(queue.operatingEnd);
    if (now < start) return { label: '아직 운영 전입니다', short: '운영 전', tone: 'pending', showQueue: false };
    if (now >= end) return { label: '오늘 운영이 종료되었습니다', short: '운영 종료', tone: 'closed', showQueue: false };
  }

  if (queue.queueValue >= 750) return { label: '대기 매우 많음', short: '매우 많음', tone: 'busy', showQueue: true };
  if (queue.queueValue >= 500) return { label: '대기 많음', short: '많음', tone: 'high', showQueue: true };
  if (queue.queueValue >= 250) return { label: '대기 보통', short: '보통', tone: 'medium', showQueue: true };
  return { label: '대기 원활', short: '원활', tone: 'low', showQueue: true };
}

function isQueueItem(value: unknown): value is QueueItem {
  if (!value || typeof value !== 'object') return false;
  const queue = value as Record<string, unknown>;
  return typeof queue.id === 'string'
    && (queue.category === 'wristband' || queue.category === 'entrance')
    && typeof queue.name === 'string'
    && Number.isInteger(queue.displayOrder)
    && Number.isInteger(queue.queueValue)
    && Number(queue.queueValue) >= 0
    && Number(queue.queueValue) <= 1000
    && (queue.operatingStart === null || typeof queue.operatingStart === 'string')
    && (queue.operatingEnd === null || typeof queue.operatingEnd === 'string')
    && typeof queue.isClosed === 'boolean'
    && typeof queue.updatedAt === 'string';
}

function formatUpdatedAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '업데이트 시각 확인 불가';

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
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

function QueueMap({ value, category, locationName, overlayText }: { value: number; category: CategoryId; locationName: string; overlayText?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentCanvas = canvas;

    function drawMap() {
      const ratio = window.devicePixelRatio || 1;
      const width = currentCanvas.clientWidth;
      const height = currentCanvas.clientHeight;
      currentCanvas.width = width * ratio;
      currentCanvas.height = height * ratio;

      const ctx = currentCanvas.getContext('2d');
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
    observer.observe(currentCanvas);
    return () => observer.disconnect();
  }, [category, value]);

  return (
    <div className="map-canvas-wrap" role="img" aria-label={`${locationName}의 현재 대기 동선, 전체 구간의 ${Math.round(value / 10)}퍼센트`}>
      <canvas ref={canvasRef} className="queue-map" />
      <span className="map-place-label">한양대학교 서울캠퍼스</span>
      {overlayText && <div className="map-status-overlay"><strong>{overlayText}</strong><span>현재 대기 동선 표시가 중지되었습니다.</span></div>}
    </div>
  );
}

type QueuePageProps = {
  adminMode?: boolean;
  adminToken?: string;
  onSignOut?: () => void;
};

export default function QueuePage({ adminMode = false, adminToken = '', onSignOut }: QueuePageProps) {
  const [category, setCategory] = useState<CategoryId>('wristband');
  const [selectedId, setSelectedId] = useState('wristband-1');
  const [queues, setQueues] = useState<QueueItem[]>(sampleQueues);
  const [savedQueues, setSavedQueues] = useState<QueueItem[]>(sampleQueues);
  const [serverTime, setServerTime] = useState(sampleServerTime);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadQueues() {
      try {
        const response = await fetch(`${apiBaseUrl}${adminMode ? '/api/v1/admin/queues' : '/api/v1/queues'}`, {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
            ...(adminMode ? { Authorization: `Bearer ${adminToken}` } : {}),
          },
          signal: controller.signal,
        });
        if (adminMode && response.status === 401) {
          onSignOut?.();
          throw new Error('admin authorization expired');
        }
        if (!response.ok) throw new Error('queue api unavailable');

        const data = await response.json() as QueueApiResponse;
        if (!Array.isArray(data.queues) || data.queues.length !== 6 || !data.queues.every(isQueueItem)) {
          throw new Error('invalid queue response');
        }
        if (Number.isNaN(Date.parse(data.serverTime))) throw new Error('invalid server time');

        const nextQueues = [...data.queues].sort((a, b) => a.displayOrder - b.displayOrder);
        setQueues(nextQueues);
        setSavedQueues(nextQueues);
        setServerTime(data.serverTime);
        setLoadError(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setLoadError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadQueues();
    return () => controller.abort();
  }, [adminMode, adminToken, onSignOut]);

  const locations = useMemo(() => queues.filter((queue) => queue.category === category), [category, queues]);
  const selected = queues.find((queue) => queue.id === selectedId) ?? locations[0] ?? sampleQueues[0];
  const savedSelected = savedQueues.find((queue) => queue.id === selected.id);
  const status = queueStatus(selected, serverTime);
  const hasChanges = adminMode && Boolean(savedSelected && (
    savedSelected.queueValue !== selected.queueValue || savedSelected.isClosed !== selected.isClosed
  ));

  function changeCategory(nextCategory: CategoryId) {
    setCategory(nextCategory);
    const first = queues.find((queue) => queue.category === nextCategory);
    if (first) setSelectedId(first.id);
  }

  function updateSelected(changes: Partial<Pick<QueueItem, 'queueValue' | 'isClosed'>>) {
    setQueues((current) => current.map((queue) => queue.id === selected.id ? { ...queue, ...changes } : queue));
    setSaveMessage('');
  }

  async function saveSelected() {
    if (!adminMode || !adminToken || !hasChanges) return;
    setIsSaving(true);
    setSaveMessage('');
    try {
      const body = selected.category === 'entrance'
        ? { queueValue: selected.queueValue, isClosed: selected.isClosed }
        : { queueValue: selected.queueValue };
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/queues/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        onSignOut?.();
        throw new Error('관리자 인증이 만료되었습니다.');
      }
      if (!response.ok) throw new Error('변경사항을 저장하지 못했습니다.');

      const data = await response.json() as { queue: QueueItem | null };
      if (!data.queue || !isQueueItem(data.queue)) throw new Error('저장 결과를 확인하지 못했습니다.');
      setQueues((current) => current.map((queue) => queue.id === data.queue!.id ? data.queue! : queue));
      setSavedQueues((current) => current.map((queue) => queue.id === data.queue!.id ? data.queue! : queue));
      setSaveMessage(`${selected.name}의 현황을 저장했습니다.`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="site-stage">
      <section className="mobile-shell">
        <header className="hero">
          <div className="hero-pattern" aria-hidden="true" />
          <div className="eyebrow-row">
            <p>2026 애국한양응원제 · 오름</p>
            <span>{adminMode ? 'ADMIN' : isLoading ? 'CONNECTING' : loadError ? 'OFFLINE PREVIEW' : 'LIVE'}</span>
          </div>
          {adminMode && <button type="button" className="admin-hero-signout" onClick={onSignOut}>로그아웃</button>}
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

            <QueueMap
              value={selected.queueValue}
              category={category}
              locationName={selected.name}
              overlayText={!adminMode && !isLoading && !status.showQueue ? status.short : undefined}
            />

            <div className={`queue-summary${adminMode ? ' admin-editing' : ''}`}>
              <div>
                <p>현재 줄 길이</p>
                <strong>{adminMode || status.showQueue ? Math.round(selected.queueValue / 10) : '--'}<span>{adminMode || status.showQueue ? '%' : ''}</span></strong>
              </div>
              {adminMode ? (
                <input
                  className="queue-meter-slider"
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={selected.queueValue}
                  aria-label={`${selected.name} 대기열 길이`}
                  onChange={(event) => updateSelected({ queueValue: Number(event.target.value) })}
                  style={{ '--queue-progress': `${selected.queueValue / 10}%` } as React.CSSProperties}
                />
              ) : (
                <div className="queue-meter" aria-hidden="true">
                  <span style={{ width: `${status.showQueue ? selected.queueValue / 10 : 0}%` }} />
                </div>
              )}
              <p className="queue-label">{status.label}</p>
            </div>

            {adminMode && (
              <div className="map-admin-controls">
                {selected.category === 'entrance' && (
                  <div className="map-entrance-state" role="group" aria-label={`${selected.name} 입장 상태`}>
                    <button type="button" className={!selected.isClosed ? 'active' : ''} aria-pressed={!selected.isClosed} onClick={() => updateSelected({ isClosed: false })}>입장 시작</button>
                    <button type="button" className={selected.isClosed ? 'active closed' : ''} aria-pressed={selected.isClosed} onClick={() => updateSelected({ isClosed: true })}>입장 마감</button>
                  </div>
                )}
                <div className="map-save-row">
                  <p>{saveMessage || (hasChanges ? '변경한 내용은 저장 전까지 사용자 화면에 반영되지 않습니다.' : '현재 DB에 저장된 상태입니다.')}</p>
                  <button type="button" disabled={!hasChanges || isSaving} onClick={saveSelected}>{isSaving ? '저장 중…' : hasChanges ? '변경 저장' : '저장됨'}</button>
                </div>
              </div>
            )}
          </article>

          <div className="update-row" role="status" aria-live="polite">
            <span className="update-icon" aria-hidden="true">↻</span>
            <div>
              <p>마지막 업데이트</p>
              <strong suppressHydrationWarning>{formatUpdatedAt(selected.updatedAt)}</strong>
            </div>
            <p>{adminMode ? <>저장 버튼을 누르면<br />사용자 화면에 반영됩니다.</> : <>페이지를 새로고침하면<br />최신 현황을 불러옵니다.</>}</p>
          </div>

          <aside className={`notice${loadError ? ' error' : ''}`}>
            <span aria-hidden="true">!</span>
            {loadError
              ? <p><strong>최신 대기 현황을 불러오지 못했습니다.</strong><br />잠시 후 페이지를 새로고침해 주세요. 현재 화면은 미리보기 데이터입니다.</p>
              : adminMode
                ? <p><strong>흰색 바를 움직이면 지도 속 대기 동선이 함께 바뀝니다.</strong><br />현장 줄 끝과 맞춘 뒤 반드시 변경 저장을 눌러주세요.</p>
                : <p><strong>현장 상황에 따라 실제 대기 길이와 차이가 있을 수 있어요.</strong><br />안전요원의 안내를 우선으로 따라주세요.</p>}
          </aside>

          <footer>
            <p>2026 애국한양응원제 축제기획단</p>
            <span>{adminMode ? 'QUEUE MAP · ADMIN' : 'QUEUE MAP · BETA'}</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
