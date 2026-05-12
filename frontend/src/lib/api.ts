const API_URL = "https://api.ymkw.top";

interface FetchAPIOptions extends Omit<RequestInit, 'signal'> {
    timeout?: number;
    retries?: number;
}

/**
 * APIエラー用のカスタムクラス
 * ステータスコードを保持できるようにする
 */
export class APIError extends Error {
    status: number;
    url: string;

    constructor(message: string, status: number, url: string) {
        super(message);
        this.name = "APIError";
        this.status = status;
        this.url = url;
    }
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
    const { retries = 2, ...fetchOptions } = options;

    const url = path.startsWith("http") ? path : `${API_URL}${path}`;

    // SSR（サーバーサイド）ではOrigin/Refererが自動付与されないため手動で追加
    const isServer = typeof window === "undefined";
    const headers: Record<string, string> = {
        ...(isServer ? { Referer: "https://www.ymkw.top/" } : {}),
        ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const res = await fetch(url, {
                ...fetchOptions,
                headers,
            });

            // 成功 or 404 はそのまま返す（リトライ不要）
            if (res.ok || res.status === 404) return res;

            // 全ての non-ok レスポンス（404除く）を APIError として扱う
            const apiError = new APIError(`HTTP ${res.status}`, res.status, url);
            lastError = apiError;

            // 429 or 5xx はリトライ対象
            if (res.status === 429 || res.status >= 500) {
                if (attempt < retries) {
                    await delay(1000 * Math.pow(2, attempt));
                    continue;
                }
            }

            // リトライ対象外（403等）またはリトライ上限到達
            throw apiError;
        } catch (err) {
            // APIErrorでない場合（ネットワークエラー等）はAPIErrorでラップしてURL情報を保持
            if (!(err instanceof APIError)) {
                lastError = new APIError(err instanceof Error ? err.message : "Network failure", 0, url);
                // ネットワークエラーの名前を保持（Dashboard側でNetworkError判定に使うため）
                if (err instanceof Error) {
                    lastError.name = err.name;
                }
            } else {
                lastError = err;
            }

            // リトライ可能な場合のみ続行
            if (attempt < retries) {
                await delay(1000 * Math.pow(2, attempt));
                continue;
            }
        }
    }

    if (lastError) throw lastError;
    throw new Error("Fetch failed after retries");
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export { API_URL };
