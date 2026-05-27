CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_created_user
    ON messages (created_at, user_id)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_channel_created_user
    ON messages (channel_id, created_at, user_id)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_user_created
    ON messages (user_id, created_at)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_guild_channel_created_user
    ON messages (guild_id, channel_id, created_at, user_id)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_created_channel
    ON messages (created_at, channel_id)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_guild_created_user
    ON messages (guild_id, created_at, user_id)
    WHERE is_bot = FALSE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_human_channel_created
    ON messages (channel_id, created_at)
    WHERE is_bot = FALSE;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_display_name_trgm
    ON users USING gin (display_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_trgm
    ON users USING gin (username gin_trgm_ops);
