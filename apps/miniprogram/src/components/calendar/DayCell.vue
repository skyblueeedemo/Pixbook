<template>
  <view class="day-cell" :class="cellClass" @tap="onTap">
    <view class="day-num">{{ dayNum }}</view>
    <view class="day-label">{{ label }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{ day: DayStatus; isSelected: boolean; isToday: boolean }>();
const emit = defineEmits<{ tap: [] }>();

const dayNum = computed(() => {
  try { return String(new Date(props.day.date).getDate()); }
  catch { return ''; }
});

const label = computed(() => {
  if (props.day.status === 'unavailable') return '休';
  if (props.day.status === 'full') return '满';
  return `余${props.day.availableSlots}`;
});

const cellClass = computed(() => {
  if (props.isSelected) return 'dc-sel';
  if (props.isToday) return 'dc-today';
  switch (props.day.status) {
    case 'available':   return 'dc-avail';
    case 'almost_full': return 'dc-hot';
    case 'full':        return 'dc-full';
    case 'unavailable': return 'dc-off';
    default:            return 'dc-off';
  }
});

function onTap() {
  const disabled = props.day.status === 'full' || props.day.status === 'unavailable' || props.isToday;
  if (!disabled) emit('tap');
}
</script>

<style>
.day-cell {
  width: 13.5%;
  height: 50px;
  display: inline-block;
  text-align: center;
  vertical-align: top;
  border-radius: 4px;
  margin: 1px 0.35%;
  padding-top: 8px;
}
.day-num {
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
}
.day-label {
  font-size: 10px;
  line-height: 16px;
  color: #666;
}

.dc-avail { background: #EAF3DE; }
.dc-avail .day-num { color: #27500A; }
.dc-avail .day-label { color: #5B8C2A; }

.dc-hot { background: #FAEEDA; border: 1px solid #EF9F27; }
.dc-hot .day-num { color: #633806; }
.dc-hot .day-label { color: #EF9F27; }

.dc-full { background: #FCEBEB; opacity: 0.5; }
.dc-full .day-num { color: #999; }
.dc-full .day-label { color: #C0392B; }

.dc-off { background: #F2F2F7; }
.dc-off .day-num { color: #AEAEB2; }
.dc-off .day-label { color: #C7C7CC; }

.dc-today { outline: 2px solid #378ADD; }
.dc-sel { outline: 3px solid #1D9E75; }
</style>
