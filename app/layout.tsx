import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '2026 애국한양응원제 대기 현황',
  description: '팔찌 수령과 노천극장 입장 대기 동선을 실시간으로 확인하세요.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
