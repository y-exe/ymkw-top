import discord
from discord.ext import commands
import asyncpg
import config

class Logger(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_dsn = config.DB_DSN
        self.pool = None

    async def cog_load(self):
        self.pool = await asyncpg.create_pool(self.db_dsn)
        await self.pool.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                message_id BIGINT PRIMARY KEY,
                user_id BIGINT NOT NULL,
                channel_id BIGINT NOT NULL,
                guild_id BIGINT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                is_bot BOOLEAN DEFAULT FALSE,
                char_count INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_messages_user ON messages (user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages (channel_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
        ''')

    async def cog_unload(self):
        if self.pool:
            await self.pool.close()

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author.bot or not message.guild:
            return

        try:
            await self.pool.execute("""
                INSERT INTO messages (message_id, user_id, channel_id, guild_id, created_at, is_bot, char_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (message_id) DO NOTHING
            """, 
            message.id, 
            message.author.id, 
            message.channel.id, 
            message.guild.id, 
            message.created_at, 
            message.author.bot, 
            len(message.content)
            )
        except Exception as e:
            print(f"Log Error: {e}")

    @commands.Cog.listener()
    async def on_raw_message_delete(self, payload):
        try:
            await self.pool.execute(
                "DELETE FROM messages WHERE message_id = $1", 
                payload.message_id
            )
        except Exception as e:
            print(f"Delete Error: {e}")

    @commands.Cog.listener()
    async def on_raw_bulk_message_delete(self, payload):
        if not payload.message_ids:
            return
        try:
            await self.pool.execute(
                "DELETE FROM messages WHERE message_id = ANY($1::bigint[])",
                list(payload.message_ids)
            )
        except Exception as e:
            print(f"Bulk Delete Error: {e}")

async def setup(bot):
    await bot.add_cog(Logger(bot))