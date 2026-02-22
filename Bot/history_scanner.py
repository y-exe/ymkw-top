import discord
import asyncio
import asyncpg
import datetime
import os
import config

TARGET_CHANNEL_IDS = [
    1355425464729993367, 1355073969199382530, 1357298745506791574,
    1450890768255422595, 1373320764945858740, 1356324385983697098,
    1355497603910865046, 1355552587394449589, 1371391700131647491,
    1355546326657667150, 1399071027925094617, 1355810985356689547,
    1360622424579899524, 1356237901645746348, 1406033558757314752,
    1383029750166982656, 1355570062378930317, 1355546503048859840,
    1361713489990779172,
]

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.guilds = True

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f"Logged in as {client.user}")
    
    pool = await asyncpg.create_pool(config.DB_DSN)
    
    after_date = discord.utils.utcnow() - datetime.timedelta(days=60)
    print(f"Fetching messages after {after_date}")
    
    guild = client.get_guild(config.GUILD_ID)
    if not guild:
         print("Error: Guild not found.")
         await client.close()
         return

    total_inserted = 0
    
    for channel_id in TARGET_CHANNEL_IDS:
        channel = guild.get_channel(channel_id)
        if not channel:
            print(f"Channel {channel_id} not found, skipping.")
            continue
            
        print(f"Scanning channel: {channel.name}...")
        
        messages_data = []
        user_data = {}
        
        try:
            async for msg in channel.history(limit=None, after=after_date):
                messages_data.append((
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
                    
            if not messages_data:
                continue
                
            if user_data:
                await pool.executemany('''
                    INSERT INTO users (user_id, display_name, username, avatar_url)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (user_id) DO NOTHING
                ''', list(user_data.values()))
            
            await pool.executemany('''
                INSERT INTO messages (message_id, user_id, channel_id, guild_id, created_at, is_bot, char_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (message_id) DO NOTHING
            ''', messages_data)
            
            print(f"Inserted/Verified {len(messages_data)} messages for {channel.name}.")
            total_inserted += len(messages_data)
            
        except Exception as e:
            print(f"Error scanning {channel.name}: {e}")
            
    print(f"==========\nDone! Scanned and processed {total_inserted} messages.")
    await pool.close()
    await client.close()

if __name__ == "__main__":
    if not config.TOKEN:
        print("Missing token!")
    else:
        client.run(config.TOKEN)
