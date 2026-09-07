-- Additive migration: the previous Worker can still use queues unchanged.
CREATE TABLE queue_route_versions (
  queue_id TEXT NOT NULL REFERENCES queues(id),
  revision INTEGER NOT NULL CHECK(revision > 0),
  route_json TEXT,
  queue_value INTEGER NOT NULL CHECK(queue_value BETWEEN 0 AND 1000),
  expected_updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(queue_id, revision)
);
-- Both revision and queue state must still match at the exact write moment.
CREATE TRIGGER queue_route_version_guard BEFORE INSERT ON queue_route_versions
WHEN NEW.revision != COALESCE((SELECT MAX(revision) FROM queue_route_versions WHERE queue_id=NEW.queue_id),0)+1
  OR NEW.expected_updated_at != (SELECT updated_at FROM queues WHERE id=NEW.queue_id)
BEGIN
  SELECT RAISE(ABORT,'ROUTE_CONFLICT');
END;
-- Route publication and current length change are one atomic SQLite statement.
CREATE TRIGGER queue_route_version_publish AFTER INSERT ON queue_route_versions
BEGIN
  UPDATE queues SET queue_value=NEW.queue_value, updated_at=NEW.created_at WHERE id=NEW.queue_id;
  DELETE FROM queue_route_drafts WHERE queue_id=NEW.queue_id;
END;
CREATE TABLE queue_route_drafts (
  queue_id TEXT PRIMARY KEY REFERENCES queues(id),
  route_json TEXT,
  base_revision INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);
