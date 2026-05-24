import { ref } from 'vue';
import { api } from '@/api';

export function useAuth() {
  const sessionKey = ref<string>('');

  /** Silent login on app launch — transparent to user */
  async function silentLogin() {
    const cached = uni.getStorageSync('session_key');
    if (cached) {
      sessionKey.value = cached;
      console.log('[auth] session_key cached:', cached.slice(0, 8) + '...');
      return;
    }

    try {
      const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({ success: resolve, fail: reject });
      });
      console.log('[auth] wx.login code:', loginRes.code?.slice(0, 8) + '...');

      const { data } = await api.post<{ sessionKey: string }>('/wechat/login', {
        code: loginRes.code,
      });

      console.log('[auth] login response:', JSON.stringify(data));

      if (data && (data as any).sessionKey) {
        const key = (data as any).sessionKey;
        uni.setStorageSync('session_key', key);
        sessionKey.value = key;
        console.log('[auth] session_key saved:', key.slice(0, 8) + '...');
      } else {
        console.warn('[auth] no sessionKey in response');
      }
    } catch (e: any) {
      console.error('[auth] login failed:', JSON.stringify(e));
      uni.setStorageSync('login_error', JSON.stringify(e));
    }
  }

  return { sessionKey, silentLogin };
}
