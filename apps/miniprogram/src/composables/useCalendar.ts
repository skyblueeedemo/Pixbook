import { ref } from 'vue';
import dayjs from 'dayjs';
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
  const currentMonth = ref(dayjs()); // today's month, can switch

  async function fetchCalendar(forceRefresh = false, month?: dayjs.Dayjs) {
    const m = month ?? currentMonth.value;
    const cacheKey = `cal_${m.format('YYYY-MM')}`;

    if (!forceRefresh) {
      const cached = uni.getStorageSync(cacheKey);
      const cacheTime = uni.getStorageSync(cacheKey + '_t');
      if (cached && Date.now() - cacheTime < 60_000) {
        days.value = cached;
        return;
      }
    }

    loading.value = true;
    try {
      const startOfMonth = m.startOf('month');
      const daysInMonth = m.daysInMonth();
      const start = startOfMonth.format('YYYY-MM-DD');

      const res = await api.get<{ code: number; data: DayStatus[] }>(
        `/schedule/calendar?startDate=${start}&days=${daysInMonth}`
      );
      const data = res.data;

      // Mark days before tomorrow as unavailable (T+1 rule)
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
      const result = data.map((d) => {
        if (d.date < tomorrow) {
          return { ...d, status: 'unavailable' as const, availableSlots: 0, maxSlots: 0 };
        }
        return d;
      });

      uni.setStorageSync(cacheKey, result);
      uni.setStorageSync(cacheKey + '_t', Date.now());
      days.value = result;
    } finally {
      loading.value = false;
    }
  }

  function prevMonth() {
    currentMonth.value = currentMonth.value.subtract(1, 'month');
    fetchCalendar(true, currentMonth.value);
    selectedDate.value = null;
  }

  function nextMonth() {
    currentMonth.value = currentMonth.value.add(1, 'month');
    fetchCalendar(true, currentMonth.value);
    selectedDate.value = null;
  }

  function goToday() {
    currentMonth.value = dayjs();
    fetchCalendar(true, currentMonth.value);
    selectedDate.value = null;
  }

  async function refresh() {
    await fetchCalendar(true);
    // Re-sync selected date with fresh data
    if (selectedDate.value) {
      const fresh = days.value.find((d) => d.date === selectedDate.value!.date);
      if (fresh && fresh.status !== 'full' && fresh.status !== 'unavailable') {
        selectedDate.value = fresh;
      } else {
        selectedDate.value = null; // date became full — deselect
      }
    }
  }

  function selectDate(day: DayStatus) {
    if (day.status === 'full' || day.status === 'unavailable') return;
    selectedDate.value = day;
  }

  return { days, loading, selectedDate, currentMonth, fetchCalendar, refresh, selectDate, prevMonth, nextMonth, goToday };
}
