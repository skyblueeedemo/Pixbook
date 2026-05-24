import { ref } from 'vue';
import { api } from '@/api';

export interface DayStatus {
  date: string;
  status: 'available' | 'almost_full' | 'full' | 'unavailable';
  availableSlots: number;
  maxSlots: number;
  version: number;
}

export function useCalendar() {
  const days = ref<DayStatus[]>([]);
  const loading = ref(false);
  const selectedDate = ref<DayStatus | null>(null);

  async function fetchCalendar(forceRefresh = false) {
    // Local 60s cache using wx storage (persists across page navigation)
    if (!forceRefresh) {
      const cached = uni.getStorageSync('calendar_cache');
      const cacheTime = uni.getStorageSync('calendar_cache_time');
      if (cached && Date.now() - cacheTime < 60_000) {
        days.value = cached;
        return;
      }
    }

    loading.value = true;
    try {
      const res = await api.get<{ code: number; data: DayStatus[] }>('/schedule/calendar');
      const data = res.data;
      uni.setStorageSync('calendar_cache', data);
      uni.setStorageSync('calendar_cache_time', Date.now());
      days.value = data;
    } finally {
      loading.value = false;
    }
  }

  /** Force refresh after concurrency conflict (PRD §3.4) */
  async function refresh() {
    return fetchCalendar(true);
  }

  function selectDate(day: DayStatus) {
    if (day.status === 'full' || day.status === 'unavailable') return;
    selectedDate.value = day;
  }

  return { days, loading, selectedDate, fetchCalendar, refresh, selectDate };
}
