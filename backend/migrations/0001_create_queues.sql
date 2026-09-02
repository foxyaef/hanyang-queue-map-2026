CREATE TABLE IF NOT EXISTS queues (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('wristband', 'entrance')),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order BETWEEN 1 AND 3),
  queue_value INTEGER NOT NULL DEFAULT 0 CHECK (queue_value BETWEEN 0 AND 1000),
  operating_start TEXT,
  operating_end TEXT,
  is_closed INTEGER NOT NULL DEFAULT 0 CHECK (is_closed IN (0, 1)),
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_queues_category_order
ON queues(category, display_order);

INSERT OR IGNORE INTO queues (
  id, category, name, display_order, queue_value,
  operating_start, operating_end, is_closed, updated_at
) VALUES
  ('wristband-1', 'wristband', '수령처 1', 1, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z'),
  ('wristband-2', 'wristband', '수령처 2', 2, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z'),
  ('wristband-3', 'wristband', '수령처 3', 3, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z'),
  ('entrance-1', 'entrance', '입장문 1', 1, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z'),
  ('entrance-2', 'entrance', '입장문 2', 2, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z'),
  ('entrance-3', 'entrance', '입장문 3', 3, 0, NULL, NULL, 0, '2026-09-02T00:00:00.000Z');

PRAGMA optimize;
