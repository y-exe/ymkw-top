import discord
import asyncio
import os
from discord.ext import commands
import config
from monitoring import heartbeat_task

intents = discord.Intents.default()
intents.message_content = True 
intents.members = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f"ログイン {bot.user} (ID: {bot.user.id})")
    
    try:
        synced = await bot.tree.sync()
        print(f"スラッシュコマンドを同期しました: {len(synced)}個")
    except Exception as e:
        print(f"同期エラー: {e}")
    heartbeat_task.start()

async def load_extensions():
    """cogsフォルダにある .py ファイルを全て読み込む"""
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            try:
                await bot.load_extension(f"cogs.{filename[:-3]}")
                print(f"拡張機能をロードしました: {filename}")
            except Exception as e:
                print(f"拡張機能のロードに失敗しました ({filename}): {e}")

async def main():
    if not config.TOKEN:
        print("エラー: .envにトークンが設定されていません。")
        return

    async with bot:
        await load_extensions()
        try:
            await bot.start(config.TOKEN)
        except discord.LoginFailure:
            print("エラー: トークンが無効です。")
        except Exception as e:
            print(f"予期せぬエラーが発生しました: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Botを停止しました。")