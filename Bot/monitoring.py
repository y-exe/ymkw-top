import asyncio
import os
import aiohttp
from discord.ext import tasks
import logging

logger = logging.getLogger("heartbeat")

async def send_heartbeat():
    push_url = os.getenv("WATCHER_PUSH_URL")
    if not push_url:
        return

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(push_url) as response:
                if response.status == 200:
                    logger.info(f"Heartbeat sent to {push_url}")
                else:
                    logger.warning(f"Heartbeat failed with status {response.status}")
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")

@tasks.loop(seconds=60)
async def heartbeat_task():
    await send_heartbeat()
