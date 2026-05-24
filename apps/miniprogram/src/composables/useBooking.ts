import { ref } from 'vue';
import { api } from '@/api';

interface BookingForm {
  scheduleDate: string;
  customerName: string;
  customerPhone: string;
  photoCount: number;
  requirements: string;
  additionalNotes?: string;
  expectedVersion: number;
}

interface BookingResult {
  code: number;
  message: string;
  data?: { orderId: string; scheduleDate: string; photoCount: number };
}

export function useBooking() {
  const submitting = ref(false);
  const error = ref<string | null>(null);

  function generateIdempotencyKey(): string {
    let key = uni.getStorageSync('pending_idempotency_key');
    if (!key) {
      key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      uni.setStorageSync('pending_idempotency_key', key);
    }
    return key;
  }

  function clearIdempotencyKey() {
    uni.removeStorageSync('pending_idempotency_key');
  }

  async function submit(form: BookingForm): Promise<BookingResult> {
    submitting.value = true;
    error.value = null;

    const idempotencyKey = generateIdempotencyKey();

    try {
      const res = await api.post<BookingResult>('/order/submit', {
        ...form,
        idempotencyKey,
      });

      if (res.code === 0 || res.code === 1005) {
        clearIdempotencyKey(); // success — clear key
      }

      return res;
    } catch (e: unknown) {
      const err = e as { data?: { code?: number; message?: string } };
      if (err.data?.code === 1001) {
        // Concurrency conflict — keep form, refresh calendar
        error.value = '该日期名额刚刚被约满，日历已刷新，请重新选择';
      } else {
        error.value = err.data?.message ?? '提交失败，请重试';
      }
      throw e;
    } finally {
      submitting.value = false;
    }
  }

  return { submitting, error, submit, generateIdempotencyKey, clearIdempotencyKey };
}
