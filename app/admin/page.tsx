'use client';

import { FormEvent, useCallback, useState } from 'react';
import QueuePage from '../queue-page';

const apiBaseUrl = process.env.NEXT_PUBLIC_QUEUE_API_URL?.replace(/\/$/, '') ?? '';

export default function AdminPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const signOut = useCallback(() => {
    setAdminToken('');
    setTokenInput('');
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = tokenInput.trim();
    if (!candidate) {
      setErrorMessage('관리자 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSigningIn(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/queues`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${candidate}`,
        },
      });
      if (response.status === 401) throw new Error('비밀번호가 올바르지 않습니다.');
      if (!response.ok) throw new Error('관리자 페이지에 연결하지 못했습니다.');
      setAdminToken(candidate);
      setTokenInput('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '로그인하지 못했습니다.');
    } finally {
      setIsSigningIn(false);
    }
  }

  if (adminToken) {
    return <QueuePage adminMode adminToken={adminToken} onSignOut={signOut} />;
  }

  return (
    <main className="admin-stage">
      <section className="admin-shell">
        <header className="admin-hero">
          <div>
            <p>2026 애국한양응원제 · 오름</p>
            <h1>대기 현황 관리</h1>
          </div>
        </header>
        <section className="admin-login" aria-labelledby="admin-login-title">
          <span>ADMIN ACCESS</span>
          <h2 id="admin-login-title">관리자 인증</h2>
          <p>운영팀 관리자 비밀번호를 입력하면 사용자 화면과 같은 지도에서 대기열을 조절할 수 있습니다.</p>
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
          {errorMessage && <p className="admin-notice error" role="alert">{errorMessage}</p>}
        </section>
      </section>
    </main>
  );
}
