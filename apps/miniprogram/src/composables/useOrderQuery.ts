import { ref } from 'vue';
import { api } from '@/api';

interface OrderInfo {
  orderId: string;
  scheduleDate: string;
  customerPhone?: string;
  contactMethod?: string;
  contactValue?: string;
  photoCount: number;
  status: number;
  statusLabel: string;
  createdAt: string;
}

interface QueryParams {
  name: string;
  phone?: string;
  contactValue?: string;
  orderId?: string;
}

export function useOrderQuery() {
  const order = ref<OrderInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function query(params: QueryParams) {
    loading.value = true;
    error.value = null;
    order.value = null;
    try {
      const parts = [`customerName=${encodeURIComponent(params.name)}`];
      if (params.phone) parts.push(`customerPhone=${params.phone}`);
      if (params.contactValue) parts.push(`contactValue=${encodeURIComponent(params.contactValue)}`);
      if (params.orderId) parts.push(`orderId=${encodeURIComponent(params.orderId)}`);
      const qs = parts.join('&');

      const res = await api.get<{ code: number; data: OrderInfo }>(`/order/query?${qs}`);
      order.value = res.data;
    } catch {
      error.value = '未找到订单，请检查填写信息';
    } finally {
      loading.value = false;
    }
  }

  return { order, loading, error, query };
}
