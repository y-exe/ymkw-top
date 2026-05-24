from fastapi import FastAPI, HTTPException, Response, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import aiohttp
import os
import sys
import asyncio
import json
import time
import diskcache
import tempfile
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
from datetime import datetime
import socket
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("ymkw-api")

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

load_dotenv()
raw_dsn = os.getenv("DB_DSN")
API_SECRET = os.getenv("API_SECRET", "default_insecure_secret_change_me")

if not raw_dsn:
    BASE_DIR = Path(__file__).resolve().parent
    ENV_PATH = BASE_DIR.parent / "Bot" / ".env"
    if not ENV_PATH.exists():
        ENV_PATH = BASE_DIR.parent / "bot" / ".env"
    load_dotenv(dotenv_path=ENV_PATH)
    raw_dsn = os.getenv("DB_DSN")
    API_SECRET = os.getenv("API_SECRET", "default_insecure_secret_change_me")

if not raw_dsn:
    sys.exit("ERROR: DB_DSN not found.")

def adjust_db_dsn(dsn: str) -> str:
    in_container = os.path.exists('/.dockerenv')
    if not in_container:
        return dsn.replace("localhost", "127.0.0.1") if "localhost" in dsn else dsn
    
    if "localhost" in dsn or "127.0.0.1" in dsn:
        try:
            socket.gethostbyname('host.docker.internal')
            new_dsn = dsn.replace("localhost", "host.docker.internal").replace("127.0.0.1", "host.docker.internal")
            logger.info("Detected container environment. Using 'host.docker.internal' for database connection.")
            return new_dsn
        except socket.gaierror:
            logger.warning("Running in container but 'host.docker.internal' is not resolvable. Keeping original DSN.")
            pass
    return dsn

DB_DSN = adjust_db_dsn(raw_dsn)

app = FastAPI()

ALLOWED_ORIGINS = [
    "https://ymkw.top",
    "https://www.ymkw.top",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
]

# ドメイン名のみのリスト
ALLOWED_DOMAINS = [
    "ymkw.top",
    "www.ymkw.top",
    "localhost",
    "127.0.0.1"
]

WHITELIST_CHANNEL_IDS = [
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

pool = None
cache_dir = os.path.join(tempfile.gettempdir(), "ymkw_api_diskcache_v10")
cache = diskcache.Cache(cache_dir)

def get_cache(key: str):
    return cache.get(key)

def set_cache(key: str, data: Any, ttl: int = 600):
    cache.set(key, data, expire=ttl)

def is_domain_allowed(domain: Optional[str]) -> bool:
    if not domain:
        return False
    return domain in ALLOWED_DOMAINS or domain.endswith(".ymkw.top") or domain.endswith(".pages.dev")

def get_cors_origin(request: Request) -> Optional[str]:
    origin = request.headers.get("origin")
    if not origin:
        referer = request.headers.get("referer")
        if referer:
            try:
                from urllib.parse import urlparse
                parsed = urlparse(referer)
                clean_ref = f"{parsed.scheme}://{parsed.hostname}"
                if parsed.port:
                    clean_ref += f":{parsed.port}"
                if clean_ref in ALLOWED_ORIGINS or is_domain_allowed(parsed.hostname):
                    return clean_ref
            except:
                pass
        return None
    
    clean_origin = origin.rstrip('/')
    if clean_origin in ALLOWED_ORIGINS:
        return origin
    
    try:
        from urllib.parse import urlparse
        parsed = urlparse(clean_origin)
        if is_domain_allowed(parsed.hostname):
            return origin
    except:
        pass
    return None

def cors_json_response(request: Request, status_code: int, content: dict, block_reason: Optional[str] = None):
    response = JSONResponse(status_code=status_code, content=content)
    origin = get_cors_origin(request)
    
    if not origin and (is_domain_allowed(request.headers.get("host")) or not request.headers.get("origin")):
        origin = "https://www.ymkw.top"

    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    response.headers["Vary"] = "Origin"
    if block_reason:
        response.headers["X-Debug-Block"] = block_reason
    return response

RATE_LIMIT_WINDOW = 10
MAX_REQUESTS = 150
BLOCK_DURATION = 600
LIVE_TOTAL_CACHE_TTL = 1800
TOTAL_CACHE_WARM_INTERVAL = 600

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    client_api_key = request.headers.get("X-API-KEY")
    is_bot = client_api_key == API_SECRET

    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    
    is_allowed_origin = bool(get_cors_origin(request))
    is_allowed_referer = False
    if referer:
        try:
            from urllib.parse import urlparse
            ref_domain = urlparse(referer).hostname
            if is_domain_allowed(ref_domain):
                is_allowed_referer = True
        except:
            pass
    
    is_website = is_allowed_origin or is_allowed_referer
    is_ssr_request = request.method == "GET" and not origin and not referer

    if not (is_bot or is_website or is_ssr_request):
        if request.url.path not in ["/", "/api", "/docs", "/openapi.json", "/favicon.ico"]:
            logger.warning(f"Access Denied: Origin={origin}, Referer={referer}, Path={request.url.path}")
            return cors_json_response(request, status_code=403, content={"detail": "Access Denied: Origin/Referer not allowed."}, block_reason="security-policy")

    client_ip = request.headers.get("CF-Connecting-IP") or request.client.host
    
    block_key = f"blocked:{client_ip}"
    if cache.get(block_key):
        return cors_json_response(request, status_code=429, content={"detail": "Too Many Requests. Blocked for 10 minutes."}, block_reason="rate-limit-active")

    count_key = f"rate_limit:{client_ip}"
    current_data = cache.get(count_key)
    now = time.time()
    
    if current_data:
        first_req_time, count = current_data
        if now - first_req_time < RATE_LIMIT_WINDOW:
            new_count = count + 1
            if new_count > MAX_REQUESTS:
                cache.set(block_key, True, expire=BLOCK_DURATION)
                return cors_json_response(request, status_code=429, content={"detail": "Too Many Requests. Blocked for 10 minutes."}, block_reason="rate-limit-exceeded")
            else:
                ttl = max(1, RATE_LIMIT_WINDOW - (now - first_req_time))
                cache.set(count_key, (first_req_time, new_count), expire=ttl)
        else:
            cache.set(count_key, (now, 1), expire=RATE_LIMIT_WINDOW)
    else:
        cache.set(count_key, (now, 1), expire=RATE_LIMIT_WINDOW)

    try:
        response = await call_next(request)
        response.headers["Vary"] = "Origin"
        return response
    except Exception as e:
        logger.error(f"Unhandled exception during request: {request.method} {request.url.path}", exc_info=True)
        return cors_json_response(request, status_code=500, content={"detail": "Internal Server Error", "error_type": type(e).__name__}, block_reason="internal-error")

@app.on_event("startup")
async def startup():
    async def heartbeat_loop():
        push_url = os.getenv("WATCHER_PUSH_URL")
        if not push_url:
            logger.warning("WATCHER_PUSH_URL not set. Heartbeat disabled.")
            return
        
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    async with session.get(push_url) as resp:
                        if resp.status == 200:
                            logger.info(f"Heartbeat sent successfully to {push_url}")
                        else:
                            logger.warning(f"Heartbeat failed with status {resp.status}")
                except Exception as e:
                    logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(60)

    asyncio.create_task(heartbeat_loop())

    global pool
    try:
        from urllib.parse import urlparse
        parsed = urlparse(DB_DSN)
        safe_dsn = f"{parsed.scheme}://{parsed.username}:****@{parsed.hostname}:{parsed.port}{parsed.path}"
        logger.info(f"Connecting to database at {safe_dsn}")
        
        pool = await asyncpg.create_pool(DB_DSN, min_size=10, max_size=50, ssl=False, command_timeout=60)
        logger.info("Database connection pool created (size: 10-50).")
        asyncio.create_task(warm_total_cache_loop())
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
        raise e

@app.on_event("shutdown")
async def shutdown():
    if pool: await pool.close()

class ChannelItem(BaseModel):
    id: str
    name: str
    category: str

class RankingItem(BaseModel):
    user_id: str
    display_name: str
    username: str
    avatar: Optional[str]
    count: int
    char_count: int

class SnapshotCreate(BaseModel):
    title: str
    data: Dict[str, Any]

class SnapshotItem(BaseModel):
    snapshot_id: int
    created_at: datetime
    title: str

def format_ranking_response(rows):
    return [{"user_id": str(r["user_id"]), "display_name": r["display_name"] or "Unknown", "username": r["username"] or "unknown", "avatar": r["avatar_url"], "count": r["c"], "char_count": r["chars"] or 0} for r in rows]

def get_month_bounds(year: int, month: int) -> Tuple[datetime, datetime]:
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="month must be between 1 and 12")
    start = datetime(year, month, 1)
    if month == 12:
        return start, datetime(year + 1, 1, 1)
    return start, datetime(year, month + 1, 1)

DELETED_USER_FILTER = "(u.user_id IS NOT NULL AND u.username NOT ILIKE 'deleted%user' AND u.display_name NOT ILIKE 'deleted%user')"

@app.get("/")
@app.get("/api")
async def root():
    return {"status": "ok", "message": "ymkw.top API is running. Use /api/channels etc."}

@app.get("/api/channels", response_model=List[ChannelItem])
async def get_channels(response: Response):
    ckey = "channels_list"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=3600"
    if cached: return cached
    
    rows = await pool.fetch("SELECT * FROM channels WHERE is_active = TRUE ORDER BY position ASC")
    
    res = [
        {"id": str(r["channel_id"]), "name": r["name"], "category": r["category_name"] if r["category_name"] else "未分類"} 
        for r in rows if r["channel_id"] in WHITELIST_CHANNEL_IDS
    ]
    
    set_cache(ckey, res, ttl=3600)
    return res

@app.get("/api/snapshots")
async def get_snapshots_list(response: Response):
    ckey = "snapshots_list"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    rows = await pool.fetch("SELECT snapshot_id, created_at, title FROM snapshots ORDER BY snapshot_id DESC")
    res = [{"snapshot_id": r['snapshot_id'], "created_at": r['created_at'], "title": r['title']} for r in rows]
    set_cache(ckey, res, ttl=600)
    return res

@app.post("/api/snapshots")
async def create_snapshot(snapshot: SnapshotCreate):
    try:
        data_str = json.dumps(snapshot.data)
        row = await pool.fetchrow("INSERT INTO snapshots (title, data) VALUES ($1, $2) RETURNING snapshot_id", snapshot.title, data_str)
        cache.delete("snapshots_list")
        return {"id": row['snapshot_id']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/snapshots/{snapshot_id}")
async def get_snapshot(snapshot_id: int, response: Response):
    response.headers["Cache-Control"] = "public, max-age=3600"
    row = await pool.fetchrow("SELECT snapshot_id, created_at, title, data FROM snapshots WHERE snapshot_id = $1", snapshot_id)
    if not row: raise HTTPException(status_code=404, detail="Snapshot not found")
    s_data = row['data']
    if isinstance(s_data, str): s_data = json.loads(s_data)
    return {"snapshot_id": row['snapshot_id'], "title": row['title'], "created_at": row['created_at'], "data": s_data}

@app.delete("/api/snapshots/{snapshot_id}")
async def delete_snapshot(snapshot_id: int):
    result = await pool.execute("DELETE FROM snapshots WHERE snapshot_id = $1", snapshot_id)
    if result == "DELETE 0": raise HTTPException(status_code=404, detail="Not found")
    cache.delete("snapshots_list")
    return {"status": "deleted"}

@app.get("/api/users/search")
async def search_users(q: str):
    search_query = q.strip()
    if not search_query: return []
    query = f"SELECT user_id, display_name, username, avatar_url FROM users u WHERE (display_name ILIKE $1 OR username ILIKE $1) AND {DELETED_USER_FILTER} LIMIT 10"
    rows = await pool.fetch(query, f"%{search_query}%")
    return [{"user_id": str(r['user_id']), "display_name": r['display_name'], "username": r['username'], "avatar": r['avatar_url']} for r in rows]

@app.get("/api/ranking/monthly/{year}/{month}", response_model=List[RankingItem])
async def get_monthly_ranking(year: int, month: int, response: Response, channel_id: Optional[int] = Query(None)):
    ckey = f"rank_m_{year}_{month}_{channel_id}"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    start_date, end_date = get_month_bounds(year, month)
    c_f = "AND m.channel_id = $3" if channel_id else ""
    query = f"SELECT m.user_id, count(*) as c, sum(m.char_count) as chars, u.display_name, u.username, u.avatar_url FROM messages m LEFT JOIN users u ON m.user_id = u.user_id WHERE m.created_at >= $1 AND m.created_at < $2 AND m.is_bot = FALSE AND {DELETED_USER_FILTER} {c_f} GROUP BY m.user_id, u.display_name, u.username, u.avatar_url ORDER BY c DESC LIMIT 100"
    rows = await pool.fetch(query, start_date, end_date, *([channel_id] if channel_id else []))
    res = format_ranking_response(rows)
    set_cache(ckey, res, ttl=600)
    return res

@app.get("/api/ranking/total", response_model=List[RankingItem])
async def get_total_ranking(response: Response, channel_id: Optional[int] = Query(None), end_date: Optional[datetime] = Query(None)):
    ckey = f"rank_t_{channel_id}_{end_date}"
    cached = get_cache(ckey)
    ttl = 86400 if end_date else LIVE_TOTAL_CACHE_TTL
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
    if cached: return cached
    p = []; f = ["m.is_bot = FALSE", DELETED_USER_FILTER]
    if channel_id: p.append(channel_id); f.append(f"m.channel_id = ${len(p)}")
    if end_date: p.append(end_date); f.append(f"m.created_at <= ${len(p)}")
    query = f"SELECT m.user_id, count(*) as c, sum(m.char_count) as chars, u.display_name, u.username, u.avatar_url FROM messages m LEFT JOIN users u ON m.user_id = u.user_id WHERE {' AND '.join(f)} GROUP BY m.user_id, u.display_name, u.username, u.avatar_url ORDER BY c DESC LIMIT 100"
    rows = await pool.fetch(query, *p)
    res = format_ranking_response(rows)
    set_cache(ckey, res, ttl=ttl)
    return res

@app.get("/api/stats/history/{year}/{month}")
async def get_daily_history(year: int, month: int, response: Response, channel_id: Optional[int] = Query(None), user_id: Optional[List[str]] = Query(None)):
    ckey = f"hist_m_{year}_{month}_{channel_id}_{user_id}"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    start_date, end_date = get_month_bounds(year, month)
    c_f = "AND channel_id = $3" if channel_id else ""
    params = [start_date, end_date]
    if channel_id: params.append(channel_id)
    t_rows = await pool.fetch(f"SELECT DATE(created_at) as d, count(*) as c FROM messages WHERE created_at >= $1 AND created_at < $2 AND is_bot = FALSE {c_f} GROUP BY DATE(created_at) ORDER BY d", *params)
    top_u_sql = f"SELECT m.user_id, count(*) as c FROM messages m LEFT JOIN users u ON m.user_id = u.user_id WHERE m.created_at >= $1 AND m.created_at < $2 AND m.is_bot = FALSE AND {DELETED_USER_FILTER} {c_f.replace('channel_id', 'm.channel_id')} GROUP BY m.user_id ORDER BY c DESC LIMIT 100"
    top_u = await pool.fetch(top_u_sql, *params)
    target_ids = [str(r['user_id']) for r in top_u]
    if user_id:
        for uid in user_id:
            if uid.isdigit() and uid not in target_ids: target_ids.append(uid)
    data_map = {r['d'].strftime("%Y-%m-%d"): {"date": r['d'].strftime("%Y-%m-%d"), "total": r['c']} for r in t_rows}
    u_details = {}
    if target_ids:
        ids_plist = [int(i) for i in target_ids]
        f_params = params + [ids_plist]
        p_idx = f"${len(f_params)}"
        rows = await pool.fetch(f"SELECT DATE(created_at) as d, user_id, count(*) as c FROM messages WHERE created_at >= $1 AND created_at < $2 AND is_bot = FALSE {c_f} AND user_id = ANY({p_idx}::bigint[]) GROUP BY DATE(created_at), user_id ORDER BY d", *f_params)
        for r in rows:
            d = r['d'].strftime("%Y-%m-%d")
            if d not in data_map: data_map[d] = {"date": d, "total": 0}
            data_map[d][str(r['user_id'])] = r['c']
        u_rows = await pool.fetch("SELECT user_id, display_name, username, avatar_url FROM users WHERE user_id = ANY($1::bigint[])", ids_plist)
        for r in u_rows: u_details[str(r['user_id'])] = {"name": r['display_name'], "username": r['username'], "avatar": r['avatar_url']}
    res = {"chart_data": sorted(list(data_map.values()), key=lambda x: x['date']), "users": u_details, "top_user_id": str(top_u[0]['user_id']) if top_u else None}
    set_cache(ckey, res, ttl=600)
    return res

@app.get("/api/stats/history/total")
async def get_total_history(response: Response, channel_id: Optional[int] = Query(None), user_id: Optional[List[str]] = Query(None), end_date: Optional[datetime] = Query(None)):
    ckey = f"hist_t_{channel_id}_{user_id}_{end_date}"
    cached = get_cache(ckey)
    ttl = 86400 if end_date else LIVE_TOTAL_CACHE_TTL
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
    if cached: return cached
    p = []; f = ["is_bot = FALSE"]
    if channel_id: p.append(channel_id); f.append(f"channel_id = ${len(p)}")
    if end_date: p.append(end_date); f.append(f"created_at <= ${len(p)}")
    t_rows = await pool.fetch(f"SELECT DATE(created_at) as d, count(*) as c FROM messages WHERE {' AND '.join(f)} GROUP BY DATE(created_at) ORDER BY d", *p)
    line_f = (" AND ".join(f)).replace('channel_id', 'm.channel_id').replace('created_at', 'm.created_at')
    top_u = await pool.fetch(f"SELECT m.user_id, count(*) as c FROM messages m LEFT JOIN users u ON m.user_id = u.user_id WHERE {line_f} AND {DELETED_USER_FILTER} GROUP BY m.user_id ORDER BY c DESC LIMIT 100", *p)
    target_ids = [str(r['user_id']) for r in top_u]
    if user_id:
        for uid in user_id:
            if uid.isdigit() and uid not in target_ids: target_ids.append(uid)
    data_map = {r['d'].strftime("%Y-%m-%d"): {"date": r['d'].strftime("%Y-%m-%d"), "total": r['c']} for r in t_rows}
    u_details = {}
    if target_ids:
        ids_plist = [int(i) for i in target_ids]
        up = p + [ids_plist]
        rows = await pool.fetch(f"SELECT DATE(created_at) as d, user_id, count(*) as c FROM messages WHERE {' AND '.join(f)} AND user_id = ANY(${len(up)}::bigint[]) GROUP BY DATE(created_at), user_id ORDER BY d", *up)
        for r in rows:
            d = r['d'].strftime("%Y-%m-%d")
            if d not in data_map: data_map[d] = {"date": d, "total": 0}
            data_map[d][str(r['user_id'])] = r['c']
        u_rows = await pool.fetch("SELECT user_id, display_name, username, avatar_url FROM users WHERE user_id = ANY($1::bigint[])", ids_plist)
        for r in u_rows: u_details[str(r['user_id'])] = {"name": r['display_name'], "username": r['username'], "avatar": r['avatar_url']}
    res = {"chart_data": sorted(list(data_map.values()), key=lambda x: x['date']), "users": u_details, "top_user_id": str(top_u[0]['user_id']) if top_u else None}
    set_cache(ckey, res, ttl=ttl)
    return res

@app.get("/api/stats/heatmap/{year}/{month}")
async def get_monthly_heatmap(year: int, month: int, response: Response, channel_id: Optional[int] = Query(None)):
    ckey = f"heat_m_{year}_{month}_{channel_id}"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    start_date, end_date = get_month_bounds(year, month)
    c_f = "AND channel_id = $3" if channel_id else ""
    rows = await pool.fetch(f"SELECT EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Tokyo') as dow, EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Tokyo') as hour, count(*) as count FROM messages WHERE created_at >= $1 AND created_at < $2 AND is_bot = FALSE {c_f} GROUP BY dow, hour ORDER BY dow, hour", start_date, end_date, *([channel_id] if channel_id else []))
    res = [{"dow": int(r['dow']), "hour": int(r['hour']), "count": r['count']} for r in rows]
    set_cache(ckey, res, ttl=600)
    return res

@app.get("/api/stats/heatmap/total")
async def get_total_heatmap(response: Response, channel_id: Optional[int] = Query(None), end_date: Optional[datetime] = Query(None)):
    ckey = f"heat_t_{channel_id}_{end_date}"
    cached = get_cache(ckey)
    ttl = 86400 if end_date else LIVE_TOTAL_CACHE_TTL
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
    if cached: return cached
    p = []; f = ["is_bot = FALSE"]
    if channel_id: p.append(channel_id); f.append(f"channel_id = ${len(p)}")
    if end_date: p.append(end_date); f.append(f"created_at <= ${len(p)}")
    rows = await pool.fetch(f"SELECT EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Tokyo') as dow, EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Tokyo') as hour, count(*) as count FROM messages WHERE {' AND '.join(f)} GROUP BY dow, hour ORDER BY dow, hour", *p)
    res = [{"dow": int(r['dow']), "hour": int(r['hour']), "count": r['count']} for r in rows]
    set_cache(ckey, res, ttl=ttl)
    return res

@app.get("/api/stats/channels_distribution/{year}/{month}")
async def get_monthly_channel_distribution(year: int, month: int, response: Response):
    ckey = f"pie_m_{year}_{month}"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    start_date, end_date = get_month_bounds(year, month)
    rows = await pool.fetch("SELECT c.name, count(*) as count FROM messages m JOIN channels c ON m.channel_id = c.channel_id WHERE m.created_at >= $1 AND m.created_at < $2 AND m.is_bot = FALSE GROUP BY c.name ORDER BY count DESC LIMIT 10", start_date, end_date)
    res = [{"name": r['name'], "value": r['count']} for r in rows]
    set_cache(ckey, res, ttl=600)
    return res

@app.get("/api/stats/channels_distribution/total")
async def get_total_channel_distribution(response: Response, end_date: Optional[datetime] = Query(None)):
    ckey = f"pie_t_{end_date}"
    cached = get_cache(ckey)
    ttl = 86400 if end_date else LIVE_TOTAL_CACHE_TTL
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
    if cached: return cached
    p = []; f = ["m.is_bot = FALSE"]
    if end_date: p.append(end_date); f.append(f"m.created_at <= ${len(p)}")
    rows = await pool.fetch(f"SELECT c.name, count(*) as count FROM messages m JOIN channels c ON m.channel_id = c.channel_id WHERE {' AND '.join(f)} GROUP BY c.name ORDER BY count DESC LIMIT 10", *p)
    res = [{"name": r['name'], "value": r['count']} for r in rows]
    set_cache(ckey, res, ttl=ttl)
    return res

@app.get("/api/stats/analysis/{year}/{month}")
async def get_monthly_analysis(year: int, month: int, response: Response, channel_id: Optional[int] = Query(None), user_id: Optional[str] = Query(None)):
    ckey = f"ana_m_{year}_{month}_{channel_id}_{user_id}"
    cached = get_cache(ckey)
    response.headers["Cache-Control"] = "public, max-age=600"
    if cached: return cached
    start_date, end_date = get_month_bounds(year, month)
    p = [start_date, end_date]; f = ["created_at >= $1", "created_at < $2", "is_bot = FALSE"]
    if channel_id: p.append(channel_id); f.append(f"channel_id = ${len(p)}")
    if user_id and user_id.isdigit(): p.append(int(user_id)); f.append(f"user_id = ${len(p)}")
    where = " AND ".join(f)
    count = await pool.fetchrow(f"SELECT count(*) as total FROM messages WHERE {where}", *p)
    if not count or count['total'] == 0: return {"total": 0}
    max_d = await pool.fetchrow(f"SELECT DATE(created_at AT TIME ZONE 'Asia/Tokyo') as d, count(*) as c FROM messages WHERE {where} GROUP BY d ORDER BY c DESC LIMIT 1", *p)
    max_w = await pool.fetchrow(f"SELECT EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Tokyo') as dow, count(*) as c FROM messages WHERE {where} GROUP BY dow ORDER BY c DESC LIMIT 1", *p)
    max_h = await pool.fetchrow(f"SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Tokyo') as h, count(*) as c FROM messages WHERE {where} GROUP BY h ORDER BY c DESC LIMIT 1", *p)
    res = {"total": count['total'], "max_date": {"date": max_d['d'].strftime("%Y-%m-%d"), "count": max_d['c']} if max_d else None, "max_dow": {"dow": int(max_w['dow']), "count": max_w['c']} if max_w else None, "max_hour": {"hour": int(max_h['h']), "count": max_h['c']} if max_h else None}
    set_cache(ckey, res, ttl=600)
    return res

@app.get("/api/stats/analysis/total")
async def get_total_analysis(response: Response, channel_id: Optional[int] = Query(None), user_id: Optional[str] = Query(None), end_date: Optional[datetime] = Query(None)):
    ckey = f"ana_t_{channel_id}_{user_id}_{end_date}"
    cached = get_cache(ckey)
    ttl = 86400 if end_date else LIVE_TOTAL_CACHE_TTL
    response.headers["Cache-Control"] = f"public, max-age={ttl}"
    if cached: return cached
    p = []; f = ["is_bot = FALSE"]
    if channel_id: p.append(channel_id); f.append(f"channel_id = ${len(p)}")
    if user_id and user_id.isdigit(): p.append(int(user_id)); f.append(f"user_id = ${len(p)}")
    if end_date: p.append(end_date); f.append(f"created_at <= ${len(p)}")
    where = " AND ".join(f)
    count = await pool.fetchrow(f"SELECT count(*) as total FROM messages WHERE {where}", *p)
    if not count or count['total'] == 0: return {"total": 0}
    max_d = await pool.fetchrow(f"SELECT DATE(created_at AT TIME ZONE 'Asia/Tokyo') as d, count(*) as c FROM messages WHERE {where} GROUP BY d ORDER BY c DESC LIMIT 1", *p)
    max_w = await pool.fetchrow(f"SELECT EXTRACT(DOW FROM created_at AT TIME ZONE 'Asia/Tokyo') as dow, count(*) as c FROM messages WHERE {where} GROUP BY dow ORDER BY c DESC LIMIT 1", *p)
    max_h = await pool.fetchrow(f"SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Tokyo') as h, count(*) as c FROM messages WHERE {where} GROUP BY h ORDER BY c DESC LIMIT 1", *p)
    res = {"total": count['total'], "max_date": {"date": max_d['d'].strftime("%Y-%m-%d"), "count": max_d['c']} if max_d else None, "max_dow": {"dow": int(max_w['dow']), "count": max_w['c']} if max_w else None, "max_hour": {"hour": int(max_h['h']), "count": max_h['c']} if max_h else None}
    set_cache(ckey, res, ttl=ttl)
    return res

async def warm_total_cache_once():
    if not pool:
        return

    warmers = [
        ("ranking_total", lambda: get_total_ranking(Response(), channel_id=None, end_date=None)),
        ("history_total", lambda: get_total_history(Response(), channel_id=None, user_id=None, end_date=None)),
        ("heatmap_total", lambda: get_total_heatmap(Response(), channel_id=None, end_date=None)),
        ("channels_total", lambda: get_total_channel_distribution(Response(), end_date=None)),
        ("analysis_total", lambda: get_total_analysis(Response(), channel_id=None, user_id=None, end_date=None)),
    ]

    for name, warmer in warmers:
        started = time.perf_counter()
        try:
            await warmer()
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            logger.info(f"Warmed cache: {name} ({elapsed_ms}ms)")
        except Exception:
            logger.warning(f"Failed to warm cache: {name}", exc_info=True)

async def warm_total_cache_loop():
    await asyncio.sleep(10)
    while True:
        await warm_total_cache_once()
        await asyncio.sleep(TOTAL_CACHE_WARM_INTERVAL)

@app.get("/api/debug/db")
async def debug_db():
    if not pool:
        return {"status": "error", "message": "Connection pool not initialized"}
    try:
        tables = ["channels", "users", "messages", "snapshots"]
        counts = {}
        for t in tables:
            try:
                r = await pool.fetchval(f"SELECT count(*) FROM {t}")
                counts[t] = r
            except Exception as te:
                counts[t] = f"Error: {str(te)}"
        
        from urllib.parse import urlparse
        parsed = urlparse(DB_DSN)
        
        return {
            "status": "ok",
            "host": parsed.hostname,
            "database": parsed.path.lstrip('/'),
            "counts": counts,
            "in_container": os.path.exists('/.dockerenv')
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/debug/clear-cache")
async def clear_app_cache():
    cache.clear()
    return {"status": "cache cleared"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.ymkw\.top|https://.*\.pages\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Debug-Block"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8070)
