ALTER TABLE push_notifications
  ADD COLUMN moderation_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN moderation_content_hash TEXT;

COMMENT ON COLUMN push_notifications.moderation_approved IS 'Whether the notification content was approved by AI moderation';
COMMENT ON COLUMN push_notifications.moderation_content_hash IS 'SHA-256 hash of title|body at the time of moderation approval, used to detect content changes';
