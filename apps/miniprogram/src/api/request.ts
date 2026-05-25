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
 */
const DEV_URL = 'http://192.168.31.191:3000/api';
const PROD_URL = 'http://118.31.50.87/api'; // ← 上线后换成 HTTPS 域名

const IS_PROD = false; // ← 上线前改为 true
const BASE_URL = IS_PROD ? PROD_URL : DEV_URL;

function request<T = unknown>(options: RequestOptions): Promise<T> {
  const sessionKey = uni.getStorageSync('session_key');

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header: {
        'Content-Type': 'application/json',
        ...(sessionKey ? { 'X-Session-Key': sessionKey } : {}),
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}

export const api = {
  get: <T = unknown>(url: string) =>
    request<T>({ url, method: 'GET' }),

  post: <T = unknown>(url: string, data: Record<string, unknown>, header?: Record<string, string>) =>
    request<T>({ url, method: 'POST', data, header }),
};
