/**
 * uni.request Promise wrapper — replaces Axios for WeChat Mini Program.
 *
 * Reference: uni-app network layer docs
 */
type RequestOptions = UniApp.RequestOptions;

// 真机预览需用电脑局域网 IP（手机和电脑连同一 WiFi）
const BASE_URL = 'http://192.168.31.191:3000/api';

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
