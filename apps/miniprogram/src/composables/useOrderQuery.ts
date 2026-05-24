import { ref } from 'vue';
import { api } from '@/api';

interface OrderInfo {
  orderId: string;
  scheduleDate: string;
  photoCount: number;
  status: number;
  statusLabel: string;
  createdAt: string;
}

export function useOrderQuery() {
  const order = ref<OrderInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function query(orderId: string, phone: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get<{ code: number; data: OrderInfo }>(
        `/order/query?orderId=${orderId}&customerPhone=${phone}`,
      );
      order.value = res.data;
    } catch {
      error.value = '未找到订单，请检查订单号和手机号';
    } finally {
      loading.value = false;
    }
  }

  return { order, loading, error, query };
}
