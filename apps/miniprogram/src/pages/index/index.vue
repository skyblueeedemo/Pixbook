<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <text class="title">🎨 修图预约</text>
    </view>

    <!-- Calendar -->
    <BookingCalendar
      :days="days"
      :loading="loading"
      :selected-date="selectedDate"
      @select="selectDate"
    />

    <!-- Selected date info -->
    <view v-if="selectedDate" class="selected-info">
      <text>已选择：{{ selectedDate.date }} · 剩余 {{ selectedDate.availableSlots }} 单</text>
    </view>

    <!-- Booking Form -->
    <BookingForm
      v-if="selectedDate"
      :date="selectedDate"
      @success="onSuccess"
    />
  </view>
</template>

<script setup lang="ts">
import { onMounted } from '@dcloudio/uni-app';
import { useCalendar } from '@/composables/useCalendar';
import BookingCalendar from '@/components/calendar/BookingCalendar.vue';
import BookingForm from '@/components/booking/BookingForm.vue';

const { days, loading, selectedDate, fetchCalendar, selectDate } = useCalendar();

onMounted(() => {
  fetchCalendar();
});

function onSuccess(orderId: string) {
  uni.navigateTo({ url: `/pages/success/index?orderId=${orderId}` });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  padding: 16px;
  text-align: center;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
.selected-info {
  margin: 12px 16px;
  padding: 10px 14px;
  background: #e8f5e9;
  border-radius: 8px;
  font-size: 14px;
  color: #2e7d32;
}
</style>
