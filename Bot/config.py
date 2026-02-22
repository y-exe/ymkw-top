import os
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
raw_dsn = os.getenv("DB_DSN")
DB_DSN = raw_dsn.replace("127.0.0.1", "postgres-db").replace("localhost", "postgres-db") if raw_dsn else None

GUILD_ID = int(os.getenv("GUILD_ID", 0))
OWNER_ID = int(os.getenv("OWNER_ID", 0))
ADMIN_ROLE_ID = int(os.getenv("ADMIN_ROLE_ID", 0))

KING_ROLE_ID = int(os.getenv("KING_ROLE_ID", 0))
ANNOUNCE_CHANNEL_ID = int(os.getenv("ANNOUNCE_CHANNEL_ID", 0))