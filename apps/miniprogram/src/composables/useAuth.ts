import { ref } from 'vue';
import { api } from '@/api';

export function useAuth() {
  const sessionKey = ref<string>('');

  /** Silent login on app launch — transparent to user */
  async function silentLogin() {
    // Check if we already have a valid session
    const cached = uni.getStorageSync('session_key');
    if (cached) {
      sessionKey.value = cached;
      return;
    }

    try {
      const res = await new Promise<{ code: string }>((resolve, reject) => {
        uni.login({
          success: (loginRes) => resolve(loginRes),
          fail: reject,
        });
      });

      const { data } = await api.post<{ sessionKey: string }>('/wechat/login', {
        code: res.code,
      });

      if (data.sessionKey) {
        uni.setStorageSync('session_key', data.sessionKey);
        sessionKey.value = data.sessionKey;
      }
    } catch {
      console.warn('Silent login failed — retry on next cold start');
    }
  }

  return { sessionKey, silentLogin };
}
