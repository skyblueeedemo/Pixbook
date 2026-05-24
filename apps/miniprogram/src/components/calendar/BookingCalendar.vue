<template>
  <view class="calendar-wrap">
    <!-- Month header -->
    <view class="month-header">
      <text class="month-title">{{ yearMonth }}</text>
    </view>

    <!-- Today marker -->
    <view class="today-marker">
      今日：{{ todayStr }}（不可预约）
    </view>

    <!-- Weekday header -->
    <view class="weekdays">
      <text v-for="wd in weekdays" :key="wd" class="wd">{{ wd }}</text>
    </view>

    <!-- Day grid -->
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else class="day-grid">
      <DayCell
        v-for="day in days"
        :key="day.date"
        :day="day"
        :is-selected="selectedDate?.date === day.date"
        :is-today="day.date === todayStr"
        @tap="onSelect(day)"
      />
    </view>

    <!-- Legend -->
    <CalendarLegend />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import DayCell from './DayCell.vue';
import CalendarLegend from './CalendarLegend.vue';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{
  days: DayStatus[];
  loading: boolean;
  selectedDate: DayStatus | null;
}>();

const emit = defineEmits<{ select: [day: DayStatus] }>();

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const todayStr = dayjs().format('YYYY-MM-DD');

const yearMonth = computed(() => {
  if (props.days.length === 0) return '';
  const d = dayjs(props.days[0].date);
  return d.format('YYYY年M月');
});

function onSelect(day: DayStatus) {
  if (day.status === 'full' || day.status === 'unavailable') return;
  if (day.date === todayStr) return; // T+1 rule
  emit('select', day);
}
</script>

<style scoped>
.calendar-wrap {
  background: #fff;
  margin: 24rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}
.month-header {
  text-align: center;
  margin-bottom: 16rpx;
}
.month-title {
  font-size: 34rpx;
  font-weight: 600;
}
.today-marker {
  text-align: center;
  font-size: 24rpx;
  color: #888;
  margin-bottom: 20rpx;
}
.weekdays {
  display: flex;
  margin-bottom: 12rpx;
}
.wd {
  width: 14.28%;
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 8rpx 0;
}
.day-grid {
  display: flex;
  flex-wrap: wrap;
}
.loading {
  text-align: center;
  padding: 48rpx;
  color: #888;
  font-size: 28rpx;
}
</style>
