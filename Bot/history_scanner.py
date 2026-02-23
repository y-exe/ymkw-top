import discord
import asyncio
import asyncpg
import datetime
import os
import config
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("history-backfill")

EXCLUDE_CHANNEL_IDS = [
]

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True

client = discord.Client(intents=intents)

async def backfill():
    logger.info("Starting history backfill process...")
    
    if not config.DB_DSN:
        logger.error("DB_DSN is not configured.")
        return

    pool = await asyncpg.create_pool(config.DB_DSN)
    
    after_date = discord.utils.utcnow() - datetime.timedelta(days=4)
    logger.info(f"Fetching messages after {after_date} (Last 4 days)")
    
    guild = client.get_guild(config.GUILD_ID)
    if not guild:
         logger.error(f"Guild not found (ID: {config.GUILD_ID}).")
         await pool.close()
         return

    total_messages = 0
    total_users = 0
    
    channels = [c for c in guild.text_channels if c.id not in EXCLUDE_CHANNEL_IDS]
    logger.info(f"Found {len(channels)} channels to scan.")

    for i, channel in enumerate(channels):
        perms = channel.permissions_for(guild.me)
        if not perms.read_message_history or not perms.read_messages:
            logger.warning(f"[{i+1}/{len(channels)}] Skipping {channel.name}: Missing permissions.")
            continue
            
        logger.info(f"[{i+1}/{len(channels)}] Scanning channel: {channel.name}...")
        
        batch_messages = []
        user_data = {}
        channel_count = 0
        
        try:
            async for msg in channel.history(limit=None, after=after_date, oldest_first=True):
                batch_messages.append((
                    msg.id,
                    msg.author.id,
                    msg.channel.id,
                    msg.guild.id,
                    msg.created_at,
                    msg.author.bot,
                    len(msg.content)
                ))
                
                if msg.author.id not in user_data:
                    avatar = str(msg.author.display_avatar.url) if msg.author.display_avatar else None
                    user_data[msg.author.id] = (
                        msg.author.id,
                        msg.author.display_name,
                        msg.author.name,
                        avatar
                    )
                
                if len(batch_messages) % 100 == 0:
                    await asyncio.sleep(0.8)

                if len(batch_messages) >= 500:
                    await save_to_db(pool, batch_messages, user_data)
                    channel_count += len(batch_messages)
                    batch_messages = []
                    user_data = {}
                    await asyncio.sleep(1.5)

            if batch_messages or user_data:
                await save_to_db(pool, batch_messages, user_data)
                channel_count += len(batch_messages)
            
            logger.info(f"Finished {channel.name}: Processed {channel_count} messages.")
            total_messages += channel_count
            
            await asyncio.sleep(2.0)
            
        except discord.Forbidden:
            logger.error(f"Forbidden error in {channel.name}. Skipping.")
        except Exception as e:
            logger.error(f"Error scanning {channel.name}: {e}")
            
    logger.info(f"==========\nBackfill complete! Total processed: {total_messages} messages.")
    await pool.close()

async def save_to_db(pool, messages, users):
    async with pool.acquire() as conn:
        async with conn.transaction():
            if users:
                await conn.executemany('''
                    INSERT INTO users (user_id, display_name, username, avatar_url)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO UPDATE SET
                        display_name = EXCLUDED.display_name,
                        username = EXCLUDED.username,
                        avatar_url = EXCLUDED.avatar_url
                ''', list(users.values()))
            
            if messages:
                await conn.executemany('''
                    INSERT INTO messages (message_id, user_id, channel_id, guild_id, created_at, is_bot, char_count)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (message_id) DO UPDATE SET
                        char_count = EXCLUDED.char_count
                ''', messages)

@client.event
async def on_ready():
    logger.info(f"Logged in as {client.user}")
    try:
        await backfill()
    finally:
        logger.info("Closing client...")
        await client.close()

if __name__ == "__main__":
    if not config.TOKEN:
        logger.error("DISCORD_TOKEN is missing in .env")
    else:
        try:
            client.run(config.TOKEN)
        except Exception as e:
            logger.error(f"Bot execution error: {e}")
