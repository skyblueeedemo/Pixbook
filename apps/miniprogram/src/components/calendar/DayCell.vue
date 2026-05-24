<template>
  <view
    class="day-cell"
    :class="cellClass"
    @tap="onTap"
  >
    <text class="day-num">{{ dayNum }}</text>
    <text class="day-label">{{ label }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{
  day: DayStatus;
  isSelected: boolean;
  isToday: boolean;
}>();

const emit = defineEmits<{ tap: [] }>();

const dayNum = computed(() => {
  try {
    return String(new Date(props.day.date).getDate());
  } catch {
    return '';
  }
});

const label = computed(() => {
  if (props.day.status === 'unavailable') return '休息日';
  if (props.day.status === 'full') return '已满';
  return `剩余${props.day.availableSlots}单`;
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

const isDisabled = computed(() => {
  return props.day.status === 'full' || props.day.status === 'unavailable' || props.isToday;
});

function onTap() {
  if (isDisabled.value) return;
  emit('tap');
}
</script>

<style scoped>
.day-cell {
  width: 14.28%;
  height: 110rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  box-sizing: border-box;
  margin: 2rpx 0;
  overflow: hidden;
}
.day-num {
  font-size: 28rpx;
  font-weight: 500;
  line-height: 1.2;
}
.day-label {
  font-size: 20rpx;
  margin-top: 4rpx;
  line-height: 1.2;
  white-space: nowrap;
}

/* ── Status colours (PRD §3.2) ───────────────────── */
.dc-avail { background: #EAF3DE; }
.dc-avail .day-num { color: #27500A; }
.dc-avail .day-label { color: #5B8C2A; }

.dc-hot { background: #FAEEDA; border: 1px solid #EF9F27; }
.dc-hot .day-num { color: #633806; }
.dc-hot .day-label { color: #EF9F27; }

.dc-full { background: #FCEBEB; opacity: 0.6; }
.dc-full .day-num { color: #791F1F; }
.dc-full .day-label { color: #C0392B; }

.dc-off { background: #F2F2F7; }
.dc-off .day-num { color: #AEAEB2; }
.dc-off .day-label { color: #C7C7CC; }

.dc-today { outline: 2px solid #378ADD; }

.dc-sel { outline: 3px solid #1D9E75; }
</style>
