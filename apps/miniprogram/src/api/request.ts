/**
 * uni.request Promise wrapper — replaces Axios for WeChat Mini Program.
 *
 * Reference: uni-app network layer docs
 */
type RequestOptions = UniApp.RequestOptions;

/**
 * API base URL — switch between dev / production.
 *
 * Dev:   局域网 IP（电脑和手机同一 WiFi），或 localhost（模拟器）
 * Prod:  HTTPS 域名（如 https://api.your-domain.com）
 *
 * 上线前改为正式域名，并确保微信公众平台已配置合法域名。
 *
 * 方式 1（推荐）: 构建时通过环境变量 VITE_API_BASE 控制
 *   VITE_API_BASE=https://pixbook.top/api npm run build:mp-weixin
 *   开发时不需要设置，默认为局域网 IP。
 *
 * 方式 2: 直接修改下方的 DEV_URL / PROD_URL
 */
const DEV_URL = 'http://192.168.31.191:3000/api';
const PROD_URL = 'https://pixbook.top/api';

// 优先使用环境变量，否则根据构建模式判断
const API_BASE = typeof process !== 'undefined' && process.env?.VITE_API_BASE
  ? process.env.VITE_API_BASE
  : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    ? PROD_URL
    : DEV_URL);

const BASE_URL = API_BASE;

// Log on startup — helps diagnose connection issues
console.log('[Pixbook] API base:', BASE_URL);

function request<T = unknown>(options: RequestOptions): Promise<T> {
  const sessionKey = uni.getStorageSync('session_key');

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      timeout: 15000, // 15s timeout — avoid indefinite hanging
      header: {
        'Content-Type': 'application/json',
        ...(sessionKey ? { 'X-Session-Key': sessionKey } : {}),
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          console.warn('[Pixbook] HTTP', res.statusCode, options.url);
          reject(res);
        }
      },
      fail: (err) => {
        console.error('[Pixbook] Network error:', options.url, JSON.stringify(err));
        reject(err);
      },
    });
  });
}

export const api = {
  get: <T = unknown>(url: string) =>
    request<T>({ url, method: 'GET' }),

  post: <T = unknown>(url: string, data: Record<string, unknown>, header?: Record<string, string>) =>
    request<T>({ url, method: 'POST', data, header }),
};
