const demoQueues = [
  { id: 'wristband-1', category: 'wristband', name: '수령처 1', value: 640, updatedAt: '2026-08-29T18:32:00+09:00' },
  { id: 'wristband-2', category: 'wristband', name: '수령처 2', value: 360, updatedAt: '2026-08-29T18:28:00+09:00' },
  { id: 'wristband-3', category: 'wristband', name: '수령처 3', value: 170, updatedAt: '2026-08-29T18:30:00+09:00' },
  { id: 'entrance-1', category: 'entrance', name: '입장문 1', value: 780, updatedAt: '2026-08-29T18:31:00+09:00' },
  { id: 'entrance-2', category: 'entrance', name: '입장문 2', value: 470, updatedAt: '2026-08-29T18:27:00+09:00' },
  { id: 'entrance-3', category: 'entrance', name: '입장문 3', value: 90, updatedAt: '2026-08-29T18:29:00+09:00' },
];

export async function GET() {
  return Response.json(
    { queues: demoQueues },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=3, stale-while-revalidate=10',
      },
    },
  );
}
