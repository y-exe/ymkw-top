import discord
from discord.ext import commands, tasks
import asyncpg
import config
import asyncio

TARGET_CHANNEL_IDS = [
    1355425464729993367,
    1355073969199382530,
    1357298745506791574,
    1450890768255422595,
    1373320764945858740,
    1356324385983697098,
    1355497603910865046,
    1355552587394449589,
    1371391700131647491,
    1355546326657667150,
    1399071027925094617,
    1355810985356689547,
    1360622424579899524,
    1356237901645746348,
    1406033558757314752,
    1383029750166982656,
    1355570062378930317,
    1355546503048859840,
    1361713489990779172,
]

class SyncData(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.db_dsn = config.DB_DSN

    async def cog_load(self):
        pool = await asyncpg.create_pool(self.db_dsn)
        
        await pool.execute('''
            CREATE TABLE IF NOT EXISTS channels (
                channel_id BIGINT PRIMARY KEY,
                name TEXT NOT NULL,
                category_name TEXT,
                position INTEGER
            );
        ''')

        await pool.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id BIGINT PRIMARY KEY,
                display_name TEXT NOT NULL,
                username TEXT NOT NULL,
                avatar_url TEXT
            );
        ''')

        await pool.execute('''
            CREATE TABLE IF NOT EXISTS snapshots (
                snapshot_id SERIAL PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                title TEXT,
                data JSONB
            );
        ''')
        
        await pool.close()
        self.sync_loop.start()
        self.fetch_missing_users_loop.start()

    @tasks.loop(minutes=30)
    async def sync_loop(self):
        await self.bot.wait_until_ready()
        guild = self.bot.get_guild(config.GUILD_ID)
        if not guild: return

        pool = await asyncpg.create_pool(self.db_dsn)
        try:
            channel_data = []
            for channel in guild.text_channels:
                if channel.id not in TARGET_CHANNEL_IDS:
                    continue

                perms = channel.permissions_for(guild.me)
                if not perms.read_message_history or not perms.view_channel:
                    continue

                if channel.category:
                    cat_name = channel.category.name
                    cat_pos = channel.category.position
                else:
                    cat_name = "未分類"
                    cat_pos = 999

                sort_position = (cat_pos * 1000) + channel.position
                channel_data.append((channel.id, channel.name, cat_name, sort_position))

            if channel_data:
                await pool.executemany('''
                    INSERT INTO channels (channel_id, name, category_name, position)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (channel_id) DO UPDATE 
                    SET name = EXCLUDED.name, category_name = EXCLUDED.category_name, position = EXCLUDED.position
                ''', channel_data)

            if TARGET_CHANNEL_IDS:
                await pool.execute('DELETE FROM channels WHERE channel_id != ALL($1::bigint[])', TARGET_CHANNEL_IDS)

            member_data = []
            for member in guild.members:
                if not member.bot:
                    avatar = str(member.display_avatar.url) if member.display_avatar else None
                    member_data.append((member.id, member.display_name, member.name, avatar))

            await pool.executemany('''
                INSERT INTO users (user_id, display_name, username, avatar_url)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id) DO UPDATE 
                SET display_name = EXCLUDED.display_name, username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url
            ''', member_data)
            
            print(f"同期完了: チャンネル{len(channel_data)}件 / メンバー{len(member_data)}人")
            
        except Exception as e:
            print(f"同期エラー: {e}")
        finally:
            await pool.close()

    @tasks.loop(hours=12)
    async def fetch_missing_users_loop(self):
        await self.bot.wait_until_ready()
        
        pool = await asyncpg.create_pool(self.db_dsn)
        try:
            missing_ids = await pool.fetch('''
                SELECT DISTINCT m.user_id 
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.user_id
                WHERE u.user_id IS NULL AND m.is_bot = FALSE
            ''')
            
            if not missing_ids: return

            print(f"Unknownユーザー補完開始: 対象{len(missing_ids)}人")
            
            updates = []
            for row in missing_ids:
                user_id = row['user_id']
                try:
                    user = await self.bot.fetch_user(user_id)
                    avatar = str(user.display_avatar.url) if user.display_avatar else None
                    updates.append((user.id, user.display_name, user.name, avatar))
                    await asyncio.sleep(0.1)
                except discord.NotFound:
                    updates.append((user_id, "Deleted User", "deleted_user", None))
                except Exception as e:
                    print(f"User fetch error {user_id}: {e}")

            if updates:
                await pool.executemany('''
                    INSERT INTO users (user_id, display_name, username, avatar_url)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO NOTHING
                ''', updates)
                print(f"補完完了: {len(updates)}人")

        finally:
            await pool.close()

async def setup(bot):
    await bot.add_cog(SyncData(bot))