<template>
  <view class="cal">
    <!-- Month nav -->
    <view class="cal-nav">
      <view class="cal-arr" @tap="emit('prevMonth')">◀</view>
      <view class="cal-mo">{{ monthTitle }}</view>
      <view class="cal-arr" @tap="emit('nextMonth')">▶</view>
    </view>

    <!-- Weekday -->
    <view class="cal-week">
      <text class="wd">日</text><text class="wd">一</text><text class="wd">二</text>
      <text class="wd">三</text><text class="wd">四</text><text class="wd">五</text><text class="wd">六</text>
    </view>

    <view v-if="loading" class="cal-loading">加载中...</view>
    <view v-else class="cal-grid">
      <!-- Placeholder cells to align 1st day to correct weekday -->
      <view v-for="n in placeholderCount" :key="'ph'+n" class="day-cell" />
      <DayCell
        v-for="day in days" :key="day.date" :day="day"
        :is-selected="selectedDate?.date === day.date"
        :is-today="day.date === todayStr"
        @tap="onDayTap(day)"
      />
    </view>

    <CalendarLegend />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import dayjs from 'dayjs';
import DayCell from './DayCell.vue';
import CalendarLegend from './CalendarLegend.vue';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{ days: DayStatus[]; loading: boolean; selectedDate: DayStatus | null; monthTitle: string }>();
const emit = defineEmits<{ select: [day: DayStatus]; prevMonth: []; nextMonth: [] }>();

const todayStr = dayjs().format('YYYY-MM-DD');

const placeholderCount = computed(() => {
  if (props.days.length === 0) return 0;
  return dayjs(props.days[0].date).day(); // 0=Sun → N empty cells
});

function onDayTap(day: DayStatus) {
  if (day.status === 'full' || day.status === 'unavailable') return;
  if (day.date === todayStr) return;
  emit('select', day);
}
</script>

<style>
.cal { background: #fff; margin: 10px; border-radius: 10px; padding: 15px; }
.cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.cal-arr { font-size: 16px; padding: 5px 12px; color: #409eff; }
.cal-mo { font-size: 17px; font-weight: 600; text-align: center; flex: 1; }
.cal-week { text-align: center; margin-bottom: 4px; }
.wd { display: inline-block; width: 13.5%; margin: 0 0.35%; font-size: 12px; color: #999; text-align: center; }
.cal-grid { text-align: left; font-size: 0; }
.cal-grid .day-cell { display: inline-block; width: 13.5%; height: 50px; margin: 1px 0.35%; vertical-align: top; }
.cal-loading { text-align: center; padding: 30px; color: #999; font-size: 14px; }
</style>
