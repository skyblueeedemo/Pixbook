<template>
  <view class="cal">
    <view class="cal-header">{{ yearMonth }}</view>
    <view class="cal-today">今日 {{ todayStr }} · 不可预约</view>
    <view class="cal-week">
      <text class="wd">日</text><text class="wd">一</text><text class="wd">二</text>
      <text class="wd">三</text><text class="wd">四</text><text class="wd">五</text><text class="wd">六</text>
    </view>
    <view v-if="loading" class="cal-loading">加载中...</view>
    <view v-else class="cal-grid">
      <DayCell
        v-for="day in days" :key="day.date" :day="day"
        :is-selected="selectedDate?.date === day.date"
        :is-today="day.date === todayStr"
        @tap="onSelect(day)"
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

const props = defineProps<{ days: DayStatus[]; loading: boolean; selectedDate: DayStatus | null }>();
const emit = defineEmits<{ select: [day: DayStatus] }>();

const todayStr = dayjs().format('YYYY-MM-DD');
const yearMonth = computed(() => {
  if (props.days.length === 0) return '';
  return dayjs(props.days[0].date).format('YYYY年M月');
});

function onSelect(day: DayStatus) {
  if (day.status === 'full' || day.status === 'unavailable') return;
  if (day.date === todayStr) return;
  emit('select', day);
}
</script>

<style>
.cal {
  background: #fff;
  margin: 10px;
  border-radius: 10px;
  padding: 15px;
}
.cal-header {
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}
.cal-today {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
}
.cal-week {
  text-align: center;
  margin-bottom: 4px;
}
.wd {
  display: inline-block;
  width: 13.5%;
  margin: 0 0.35%;
  font-size: 12px;
  color: #999;
  text-align: center;
}
.cal-grid {
  text-align: left;
  font-size: 0;
}
.cal-loading {
  text-align: center;
  padding: 30px;
  color: #999;
  font-size: 14px;
}
</style>
