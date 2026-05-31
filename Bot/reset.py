import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DB_DSN = os.getenv("DB_DSN")

async def reset_db():
    print("Connecting to database...")
    try:
        conn = await asyncpg.connect(DB_DSN)
        
        print("初期化")
        await conn.execute("DROP TABLE IF EXISTS snapshots;")
        
        print("完了")
        
        await conn.close()
    except Exception as e:
        print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    if not DB_DSN:
        print("エラー")
    else:
        import sys
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            
        asyncio.run(reset_db())
