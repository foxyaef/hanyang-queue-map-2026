'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

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

type QueueDraft = {
  queueValue: number;
  isClosed: boolean;
};

type Notice = {
  tone: 'success' | 'error';
  message: string;
} | null;

const apiBaseUrl = process.env.NEXT_PUBLIC_QUEUE_API_URL?.replace(/\/$/, '') ?? '';

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '확인 불가';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function formatSchedule(start: string | null, end: string | null) {
  if (!start || !end) return '운영시간 미설정';
  return `${formatTime(start)} — ${formatTime(end)}`;
}

function isQueueItem(value: unknown): value is QueueItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && (item.category === 'wristband' || item.category === 'entrance')
    && typeof item.name === 'string'
    && Number.isInteger(item.displayOrder)
    && Number.isInteger(item.queueValue)
    && Number(item.queueValue) >= 0
    && Number(item.queueValue) <= 1000
    && typeof item.isClosed === 'boolean'
    && typeof item.updatedAt === 'string';
}

export default function AdminPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QueueDraft>>({});
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const groupedQueues = useMemo(() => ({
    wristband: queues.filter((queue) => queue.category === 'wristband'),
    entrance: queues.filter((queue) => queue.category === 'entrance'),
  }), [queues]);

  function applyQueues(nextQueues: QueueItem[]) {
    const sorted = [...nextQueues].sort((a, b) => {
      if (a.category !== b.category) return a.category === 'wristband' ? -1 : 1;
      return a.displayOrder - b.displayOrder;
    });
    setQueues(sorted);
    setDrafts(Object.fromEntries(sorted.map((queue) => [queue.id, {
      queueValue: queue.queueValue,
      isClosed: queue.isClosed,
    }])));
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = tokenInput.trim();
    if (!candidate) {
      setNotice({ tone: 'error', message: '관리자 비밀번호를 입력해 주세요.' });
      return;
    }

    setIsSigningIn(true);
    setNotice(null);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/queues`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${candidate}`,
        },
      });
      if (response.status === 401) throw new Error('비밀번호가 올바르지 않습니다.');
      if (!response.ok) throw new Error('관리자 데이터를 불러오지 못했습니다.');

      const data = await response.json() as QueueApiResponse;
      if (!Array.isArray(data.queues) || data.queues.length !== 6 || !data.queues.every(isQueueItem)) {
        throw new Error('대기열 데이터 형식이 올바르지 않습니다.');
      }

      setAdminToken(candidate);
      setTokenInput('');
      applyQueues(data.queues);
      setNotice({ tone: 'success', message: '관리자 모드로 연결되었습니다.' });
    } catch (error) {
      setAdminToken('');
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : '로그인하지 못했습니다.' });
    } finally {
      setIsSigningIn(false);
    }
  }

  function changeDraft(id: string, changes: Partial<QueueDraft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...changes },
    }));
    setNotice(null);
  }

  function isChanged(queue: QueueItem) {
    const draft = drafts[queue.id];
    return Boolean(draft && (draft.queueValue !== queue.queueValue || draft.isClosed !== queue.isClosed));
  }

  async function saveQueue(queue: QueueItem) {
    const draft = drafts[queue.id];
    if (!draft || !adminToken || !isChanged(queue)) return;

    setSavingId(queue.id);
    setNotice(null);
    try {
      const body = queue.category === 'entrance'
        ? { queueValue: draft.queueValue, isClosed: draft.isClosed }
        : { queueValue: draft.queueValue };
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/queues/${encodeURIComponent(queue.id)}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        setAdminToken('');
        setQueues([]);
        setDrafts({});
        throw new Error('관리자 인증이 만료되었습니다. 다시 로그인해 주세요.');
      }
      if (!response.ok) throw new Error('변경사항을 저장하지 못했습니다.');

      const data = await response.json() as { queue: QueueItem | null };
      if (!data.queue || !isQueueItem(data.queue)) throw new Error('저장 결과를 확인하지 못했습니다.');

      setQueues((current) => current.map((item) => item.id === queue.id ? data.queue as QueueItem : item));
      setDrafts((current) => ({
        ...current,
        [queue.id]: { queueValue: data.queue!.queueValue, isClosed: data.queue!.isClosed },
      }));
      setNotice({ tone: 'success', message: `${queue.name}의 현황을 저장했습니다.` });
    } catch (error) {
      setNotice({ tone: 'error', message: error instanceof Error ? error.message : '저장하지 못했습니다.' });
    } finally {
      setSavingId(null);
    }
  }

  function signOut() {
    setAdminToken('');
    setQueues([]);
    setDrafts({});
    setNotice(null);
  }

  return (
    <main className="admin-stage">
      <section className="admin-shell">
        <header className="admin-hero">
          <div>
            <p>2026 애국한양응원제 · 오름</p>
            <h1>대기 현황 관리</h1>
          </div>
          {adminToken && <button type="button" onClick={signOut}>로그아웃</button>}
        </header>

        {!adminToken ? (
          <section className="admin-login" aria-labelledby="admin-login-title">
            <span>ADMIN ACCESS</span>
            <h2 id="admin-login-title">관리자 인증</h2>
            <p>운영팀에 전달된 관리자 비밀번호를 입력하세요. 비밀번호는 이 기기에 저장되지 않습니다.</p>
            <form onSubmit={signIn}>
              <label htmlFor="admin-token">관리자 비밀번호</label>
              <input
                id="admin-token"
                type="password"
                autoComplete="current-password"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="비밀번호 입력"
                disabled={isSigningIn}
              />
              <button type="submit" disabled={isSigningIn}>{isSigningIn ? '확인 중…' : '관리 시작'}</button>
            </form>
            {notice && <p className={`admin-notice ${notice.tone}`} role="status">{notice.message}</p>}
          </section>
        ) : (
          <div className="admin-content">
            <div className="admin-guide">
              <strong>슬라이더를 움직여 현재 줄 끝 지점을 지정하세요.</strong>
              <p>입구를 0, 전체 대기 동선의 끝을 1000으로 환산합니다. 변경 후 각 카드의 저장 버튼을 눌러야 반영됩니다.</p>
            </div>

            {notice && <p className={`admin-notice ${notice.tone}`} role="status">{notice.message}</p>}

            {(['wristband', 'entrance'] as const).map((category) => (
              <section className="admin-group" key={category}>
                <div className="admin-group-heading">
                  <div>
                    <span>{category === 'wristband' ? 'WRISTBAND' : 'ENTRANCE'}</span>
                    <h2>{category === 'wristband' ? '팔찌 수령' : '노천 입장'}</h2>
                  </div>
                  <b>{groupedQueues[category].length}</b>
                </div>

                <div className="admin-queue-list">
                  {groupedQueues[category].map((queue) => {
                    const draft = drafts[queue.id] ?? { queueValue: queue.queueValue, isClosed: queue.isClosed };
                    const changed = isChanged(queue);
                    return (
                      <article className={`admin-queue-card${draft.isClosed ? ' closed' : ''}`} key={queue.id}>
                        <div className="admin-card-heading">
                          <div>
                            <small>{String(queue.displayOrder).padStart(2, '0')}</small>
                            <h3>{queue.name}</h3>
                          </div>
                          <div className="admin-value" aria-live="polite">
                            <strong>{draft.queueValue}</strong>
                            <span>{Math.round(draft.queueValue / 10)}%</span>
                          </div>
                        </div>

                        {queue.category === 'entrance' && (
                          <div className="entrance-state" role="group" aria-label={`${queue.name} 입장 상태`}>
                            <button
                              type="button"
                              className={!draft.isClosed ? 'active' : ''}
                              aria-pressed={!draft.isClosed}
                              onClick={() => changeDraft(queue.id, { isClosed: false })}
                            >입장 시작</button>
                            <button
                              type="button"
                              className={draft.isClosed ? 'active closed' : ''}
                              aria-pressed={draft.isClosed}
                              onClick={() => changeDraft(queue.id, { isClosed: true })}
                            >입장 마감</button>
                          </div>
                        )}

                        <div className="admin-slider-wrap">
                          <div className="admin-slider-labels"><span>입구 · 0</span><span>줄 끝 · 1000</span></div>
                          <input
                            type="range"
                            min="0"
                            max="1000"
                            step="1"
                            value={draft.queueValue}
                            aria-label={`${queue.name} 대기열 길이`}
                            onChange={(event) => changeDraft(queue.id, { queueValue: Number(event.target.value) })}
                            style={{ '--queue-progress': `${draft.queueValue / 10}%` } as React.CSSProperties}
                          />
                        </div>

                        <div className="admin-card-footer">
                          <p>{queue.category === 'wristband'
                            ? formatSchedule(queue.operatingStart, queue.operatingEnd)
                            : draft.isClosed ? '현재 사용자 화면에 입장 마감으로 표시됩니다.' : '현재 입장 가능한 상태입니다.'}</p>
                          <button
                            type="button"
                            disabled={!changed || savingId === queue.id}
                            onClick={() => saveQueue(queue)}
                          >{savingId === queue.id ? '저장 중…' : changed ? '변경 저장' : '저장됨'}</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <Link className="admin-public-link" href="/">사용자 대기 지도 확인</Link>
          </div>
        )}
      </section>
    </main>
  );
}
