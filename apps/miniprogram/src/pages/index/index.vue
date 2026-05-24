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
import { onMounted } from 'vue';
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
  padding-bottom: 40rpx;
}
.header {
  padding: 30rpx;
  text-align: center;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}
.title {
  font-size: 36rpx;
  font-weight: 600;
}
.selected-info {
  margin: 24rpx;
  padding: 20rpx 28rpx;
  background: #e8f5e9;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #2e7d32;
  line-height: 1.5;
}
</style>
