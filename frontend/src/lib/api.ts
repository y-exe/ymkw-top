const API_URL = "https://api.ymkw.top";

interface FetchAPIOptions extends Omit<RequestInit, 'signal'> {
    timeout?: number;
    retries?: number;
}

/**
 * リトライ・タイムアウト・SSR Refererヘッダー付きのfetchユーティリティ
 * - サーバーサイド（SSR）実行時は自動でRefererヘッダーを付与（403防止）
 * - 429/5xxエラー時は指数バックオフでリトライ
 * - AbortControllerでタイムアウト制御
 */
export async function fetchAPI(
    path: string,
    options: FetchAPIOptions = {}
): Promise<Response> {
    const { timeout = 8000, retries = 2, ...fetchOptions } = options;

    const url = path.startsWith("http") ? path : `${API_URL}${path}`;

    // SSR（サーバーサイド）ではOrigin/Refererが自動付与されないため手動で追加
    const isServer = typeof window === "undefined";
    const headers: Record<string, string> = {
        ...(isServer ? { Referer: "https://www.ymkw.top/" } : {}),
        ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const res = await fetch(url, {
                ...fetchOptions,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // 成功 or 404 はそのまま返す（リトライ不要）
            if (res.ok || res.status === 404) return res;

            // 429 or 5xx はリトライ対象
            if (res.status === 429 || res.status >= 500) {
                lastError = new Error(`HTTP ${res.status}`);
                if (attempt < retries) {
                    await delay(1000 * Math.pow(2, attempt));
                    continue;
                }
            }

            // その他のエラー（403等）はリトライせずそのまま返す
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            lastError = err as Error;
            if (attempt < retries) {
                await delay(1000 * Math.pow(2, attempt));
                continue;
            }
        }
    }

    throw lastError || new Error("Fetch failed after retries");
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export { API_URL };
