import discord
import asyncio
import os
from discord.ext import commands
import config

# ---------------------------------------------------------
# Botの設定・Intents（権限）の有効化
# ---------------------------------------------------------
intents = discord.Intents.default()
intents.message_content = True 
intents.members = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

# ---------------------------------------------------------
# 起動時のイベント
# ---------------------------------------------------------
@bot.event
async def on_ready():
    print("------------------------------------------------------")
    print(f"ログイン成功: {bot.user} (ID: {bot.user.id})")
    print(f"参加サーバー数: {len(bot.guilds)}")
    print("------------------------------------------------------")
    
    # スラッシュコマンドをサーバーに同期
    try:
        synced = await bot.tree.sync()
        print(f"スラッシュコマンドを同期しました: {len(synced)}個")
    except Exception as e:
        print(f"同期エラー: {e}")

# ---------------------------------------------------------
# 拡張機能 (Cogs) の読み込み
# ---------------------------------------------------------
async def load_extensions():
    """cogsフォルダにある .py ファイルを全て読み込む"""
    for filename in os.listdir("./cogs"):
        if filename.endswith(".py"):
            try:
                await bot.load_extension(f"cogs.{filename[:-3]}")
                print(f"拡張機能をロードしました: {filename}")
            except Exception as e:
                print(f"拡張機能のロードに失敗しました ({filename}): {e}")

# ---------------------------------------------------------
# メイン実行処理
# ---------------------------------------------------------
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