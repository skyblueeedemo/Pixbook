<template>
  <view class="pg">
    <view class="hd"><text class="hd-t">修图预约</text></view>
    <BookingCalendar
      :days="days"
      :loading="loading"
      :selected-date="selectedDate"
      :month-title="monthTitle"
      @select="selectDate"
      @prev-month="prevMonth"
      @next-month="nextMonth"
    />
    <view v-if="selectedDate" class="info">
      已选 {{ selectedDate.date }} · 余 {{ selectedDate.availableSlots }} 单
    </view>
    <BookingForm v-if="selectedDate" :date="selectedDate" @success="onSuccess" />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCalendar } from '@/composables/useCalendar';
import BookingCalendar from '@/components/calendar/BookingCalendar.vue';
import BookingForm from '@/components/booking/BookingForm.vue';

const { days, loading, selectedDate, currentMonth, fetchCalendar, selectDate, prevMonth, nextMonth } = useCalendar();

const monthTitle = computed(() => currentMonth.value.format('YYYY年M月'));

onMounted(() => fetchCalendar());

function onSuccess(result: { orderId: string; photoCount: number }) {
  const d = selectedDate.value;
  uni.navigateTo({
    url: `/pages/success/index?orderId=${result.orderId}&date=${d?.date ?? ''}&count=${result.photoCount}`,
  });
}
</script>

<style>
.pg { min-height: 100vh; background: #f5f5f5; padding-bottom: 20px; }
.hd { padding: 15px; text-align: center; background: #fff; border-bottom: 1px solid #eee; }
.hd-t { font-size: 18px; font-weight: 600; }
.info { margin: 10px; padding: 10px 15px; background: #e8f5e9; border-radius: 8px; font-size: 14px; color: #2e7d32; }
</style>
