import discord
from discord import ui, app_commands
from discord.ext import commands, tasks
import asyncpg
from datetime import datetime, timedelta, time
from dateutil.relativedelta import relativedelta
import config
import aiohttp
import os

# =========================================================
# 定数設定
# =========================================================
EMOJI_FIRST = "<:first:1452959005625417790>"
EMOJI_SECOND = "<:second:1452958981969543168>"
EMOJI_THIRD = "<:third:1452958880379306024>"
EXCLUDE_CHANNEL_ID = 1406033558757314752
KING_ROLE_ID = 1452968848998531245

API_SECRET = os.getenv("API_SECRET", "default_insecure_secret_change_me")
API_HEADERS = {"X-API-KEY": API_SECRET}

DELETED_USER_FILTER = "(u.user_id IS NOT NULL AND u.username NOT ILIKE 'deleted%user' AND u.display_name NOT ILIKE 'deleted%user')"

# =========================================================
# 古いボタン対策
# =========================================================
class DummyOldRankingView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(custom_id="view_ranking_details", style=discord.ButtonStyle.success, label="詳細を見る", emoji="📊")
    async def old_button_handler(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message(
            "このボタンは古いランキングのものです。\n新しいランキングメッセージをご利用ください！",
            ephemeral=True
        )

# =========================================================
# 月選択プルダウン
# =========================================================
class MonthSelect(discord.ui.Select):
    def __init__(self, bot):
        self.bot = bot
        options = []
        now = datetime.now()
        for i in range(12):
            date = now - relativedelta(months=i)
            label = date.strftime("%Y年 %m月")
            value = date.strftime("%Y-%m")
            options.append(discord.SelectOption(label=label, value=value))
            
        super().__init__(placeholder="集計したい月を選択してください...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        year_str, month_str = self.values[0].split("-")
        year, month = int(year_str), int(month_str)
        
        await interaction.response.send_message(f"<:2_:1453233982647959752> {year}年{month}月の集計を開始し、結果を送信します...", ephemeral=True)
        
        cog = self.bot.get_cog("Ranking")
        if cog:
            target_guild = self.bot.get_guild(config.GUILD_ID)
            await cog.run_ranking_logic(target_guild, year, month, channel=interaction.channel)

class MonthSelectView(discord.ui.View):
    def __init__(self, bot):
        super().__init__()
        self.add_item(MonthSelect(bot))

# =========================================================
# 削除用プルダウン (Snapshot Close)
# =========================================================
class SnapshotDeleteSelect(discord.ui.Select):
    def __init__(self, snapshots):
        options = []
        for s in snapshots[:25]:
            date_str = s['created_at'].split("T")[0]
            label = f"#{s['snapshot_id']} ({date_str})"
            desc = (s['title'][:95] + '...') if len(s['title']) > 95 else s['title']
            options.append(discord.SelectOption(label=label, description=desc, value=str(s['snapshot_id'])))

        if not options:
            options.append(discord.SelectOption(label="削除できるデータがありません", value="none"))

        super().__init__(placeholder="削除するスナップショットを選択...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        snapshot_id = self.values[0]
        if snapshot_id == "none":
            return await interaction.response.send_message("選択が無効です", ephemeral=True)

        async with aiohttp.ClientSession() as session:
            async with session.delete(f'https://api.ymkw.top/api/snapshots/{snapshot_id}', headers=API_HEADERS) as resp:
                if resp.status == 200:
                    await interaction.response.send_message(f"🗑️ スナップショット #{snapshot_id} を削除しました。", ephemeral=True)
                else:
                    await interaction.response.send_message(f"❌ 削除に失敗しました (Status: {resp.status})", ephemeral=True)

class SnapshotDeleteView(discord.ui.View):
    def __init__(self, snapshots):
        super().__init__()
        self.add_item(SnapshotDeleteSelect(snapshots))

# =========================================================
# Ranking Cog 本体
# =========================================================
class Ranking(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.monthly_task.start()

    async def get_db_pool(self):
        return await asyncpg.create_pool(config.DB_DSN)

    # -----------------------------------------------------
    # DiscordのメッセージUI作成 (Component v2)
    # -----------------------------------------------------
    def create_ranking_view(self, title: str, rows, year: int, month: int, show_role_reward: bool = True, custom_url: str = None):
        container = ui.Container(accent_color=0x00ddff)

        container.add_item(ui.TextDisplay(f"# {title}"))
        container.add_item(ui.TextDisplay(f"-# <#{EXCLUDE_CHANNEL_ID}>はランキングに含まれません"))

        top_user_id = None
        for i, row in enumerate(rows):
            user_id = row['user_id']
            count = row.get('count') or row.get('msg_count')
            user_name = row['display_name'] if row['display_name'] else f"<@{user_id}>"

            if i == 0:
                top_user_id = user_id
                rank_str = f"## {EMOJI_FIRST} **{user_name}** (<@{user_id}>) — **{count}回**"
            elif i == 1:
                rank_str = f"### {EMOJI_SECOND} **{user_name}** (<@{user_id}>) — **{count}回**"
            elif i == 2:
                rank_str = f"### {EMOJI_THIRD} **{user_name}** (<@{user_id}>) — **{count}回**"
            else:
                rank_str = f"**{i+1}位** **{user_name}** (<@{user_id}>) — **{count}回**"

            container.add_item(ui.TextDisplay(rank_str))

        container.add_item(ui.Separator())

        if show_role_reward and top_user_id:
            container.add_item(ui.TextDisplay(
                f"**<:4_:1453234089980334255> 1位の <@{top_user_id}> には <@&{KING_ROLE_ID}> ロールが付与されます**"
            ))
            container.add_item(ui.TextDisplay("-# 1か月ごとに切り替わります"))
            container.add_item(ui.Separator())

        container.add_item(ui.TextDisplay("### <:2_:1453233982647959752> Web上でさらに詳しく見ることができます"))
        container.add_item(ui.TextDisplay("-# **<:1_:1453233921310589059> 個人分析・グラフ・チャンネル比較など**"))

        action_row = ui.ActionRow()
        target_url = custom_url if custom_url else f"https://ymkw.top/month/{year}/{month}"
        
        action_row.add_item(
            ui.Button(
                label="WEBで詳しく見る",
                style=discord.ButtonStyle.url,
                url=target_url,
                emoji="<:3_:1453234036339245249>"
            )
        )
        container.add_item(action_row)

        view = ui.LayoutView()
        view.add_item(container)

        return view

    # -----------------------------------------------------
    # 月次タスク
    # -----------------------------------------------------
    @tasks.loop(time=[time(hour=0, minute=0)])
    async def monthly_task(self):
        now = datetime.now()
        if now.day != 1:
            return
        last_month = now - relativedelta(months=1)
        guild = self.bot.get_guild(config.GUILD_ID)
        await self.run_ranking_logic(guild, last_month.year, last_month.month, is_auto=True)

    # -----------------------------------------------------
    # コマンド: /month
    # -----------------------------------------------------
    @app_commands.command(name="month", description="【管理者用】指定した月のランキングを手動送信")
    async def open_month(self, interaction: discord.Interaction):
        if interaction.user.id != config.OWNER_ID:
            return await interaction.response.send_message("権限がありません", ephemeral=True)
        view = MonthSelectView(self.bot)
        await interaction.response.send_message("集計したい月を選択してください:", view=view, ephemeral=True)

    # -----------------------------------------------------
    # コマンド: /open (全期間・スナップショット作成)
    # -----------------------------------------------------
    @app_commands.command(name="open", description="【管理者用】全期間のランキングを表示しスナップショットを作成")
    async def open_total(self, interaction: discord.Interaction):
        if interaction.user.id != config.OWNER_ID:
            return await interaction.response.send_message("権限がありません", ephemeral=True)

        await interaction.response.defer()
        
        pool = await self.get_db_pool()
        try:
            rows = await pool.fetch(f"""
                SELECT
                    m.user_id,
                    count(*) as count,
                    u.display_name,
                    u.username,
                    u.avatar_url as avatar
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.user_id
                WHERE m.is_bot = FALSE AND m.guild_id = $1 AND m.channel_id != {EXCLUDE_CHANNEL_ID}
                  AND {DELETED_USER_FILTER}
                GROUP BY m.user_id, u.display_name, u.username, u.avatar_url
                ORDER BY count DESC
                LIMIT 100
            """, config.GUILD_ID)

            if not rows:
                await interaction.followup.send("データがありません")
                return

            snapshot_url = "https://ymkw.top/"
            try:
                snapshot_data = {
                    "title": f"Total Ranking - {datetime.now().strftime('%Y/%m/%d')}",
                    "rows": [dict(r) for r in rows],
                }
                
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        'https://api.ymkw.top/api/snapshots', 
                        json={"title": snapshot_data["title"], "data": snapshot_data},
                        headers=API_HEADERS
                    ) as resp:
                        if resp.status == 200:
                            res = await resp.json()
                            snapshot_url = f"https://ymkw.top/open/{res['id']}"
                            await interaction.followup.send(f"✅ スナップショットを作成しました！\nURL: {snapshot_url}")
                        else:
                            error_text = await resp.text()
                            print(f"Snapshot API Error: {resp.status} - {error_text}")
                            await interaction.followup.send(f"❌ スナップショットの作成に失敗しました (API Error: {resp.status})")
                            return
            except Exception as e:
                print(f"Snapshot Failed: {e}")
                await interaction.followup.send(f"❌ スナップショットの作成に失敗しました: {e}")
                return

            view = self.create_ranking_view(
                "🏆 全期間の発言ランキング", 
                rows[:10], 
                datetime.now().year, 
                datetime.now().month, 
                show_role_reward=False,
                custom_url=snapshot_url
            )
            await interaction.channel.send(view=view)

        finally:
            await pool.close()

    # -----------------------------------------------------
    # コマンド: /close (スナップショット削除)
    # -----------------------------------------------------
    @app_commands.command(name="close", description="【管理者用】作成したスナップショットを選択して削除")
    async def close_snapshot(self, interaction: discord.Interaction):
        if interaction.user.id != config.OWNER_ID:
            return await interaction.response.send_message("権限がありません", ephemeral=True)

        await interaction.response.defer(ephemeral=True)

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('https://api.ymkw.top/api/snapshots') as resp:
                    if resp.status != 200:
                        return await interaction.followup.send("APIエラー: スナップショット一覧を取得できませんでした。")
                    snapshots = await resp.json()

            if not snapshots:
                return await interaction.followup.send("削除可能なスナップショットがありません。")

            view = SnapshotDeleteView(snapshots)
            await interaction.followup.send("削除するスナップショットを選択してください:", view=view)

        except Exception as e:
            await interaction.followup.send(f"エラーが発生しました: {e}")

    # -----------------------------------------------------
    # 共通ロジック (ランキング集計)
    # -----------------------------------------------------
    async def run_ranking_logic(self, guild, year, month, channel=None, is_auto=False):
        pool = await self.get_db_pool()
        start_date = datetime(year, month, 1)
        end_date = (start_date + relativedelta(months=1)) - timedelta(seconds=1)

        try:
            # Deleted User を除外するフィルタを追加
            rows = await pool.fetch(f"""
                SELECT m.user_id, count(*) as count, u.display_name
                FROM messages m
                LEFT JOIN users u ON m.user_id = u.user_id
                WHERE m.created_at >= $1 AND m.created_at <= $2
                  AND m.is_bot = FALSE AND m.guild_id = $3 AND m.channel_id != {EXCLUDE_CHANNEL_ID}
                  AND {DELETED_USER_FILTER}
                GROUP BY m.user_id, u.display_name
                ORDER BY count DESC
                LIMIT 10
            """, start_date, end_date, config.GUILD_ID)

            if not rows:
                if channel:
                    await channel.send(f"{year}年{month}月のデータはありません。")
                return

            title = f"<:1_:1453233921310589059> {year}年{month}月の発言ランキング！"
            view = self.create_ranking_view(title, rows, year, month)

            target_channel = channel
            if is_auto and guild:
                target_channel = guild.get_channel(config.ANNOUNCE_CHANNEL_ID)
            elif is_auto and not guild:
                try:
                    target_channel = await self.bot.fetch_channel(config.ANNOUNCE_CHANNEL_ID)
                except:
                    print(f"Error: Announce channel {config.ANNOUNCE_CHANNEL_ID} not found.")

            if target_channel:
                await target_channel.send(view=view)

            if rows and guild:
                top_user_id = rows[0]['user_id']
                king_role = guild.get_role(KING_ROLE_ID)
                if king_role:
                    for m in king_role.members:
                        try:
                            await m.remove_roles(king_role)
                        except:
                            pass
                    
                    new_king = guild.get_member(top_user_id)
                    if new_king:
                        try:
                            await new_king.add_roles(king_role)
                        except:
                            pass

        except Exception as e:
            print(f"Ranking Error: {e}")
        finally:
            await pool.close()

async def setup(bot):
    await bot.add_cog(Ranking(bot))
    bot.add_view(DummyOldRankingView())