<template>
  <AdminLayout>
    <div class="sv">
      <h3>排期管理</h3>

      <!-- Month nav -->
      <div class="sv-nav">
        <el-button @click="prevMonth" :icon="'ArrowLeft'" circle size="small" />
        <span class="sv-mo">{{ monthTitle }}</span>
        <el-button @click="nextMonth" :icon="'ArrowRight'" circle size="small" />
        <el-button @click="goToday" size="small" style="margin-left:12px">本月</el-button>
      </div>

      <!-- Calendar grid -->
      <div class="sv-cal" v-loading="loading">
        <div class="sv-week">
          <span v-for="w in '日一二三四五六'.split('')" :key="w" class="sv-wd">{{ w }}</span>
        </div>
        <div class="sv-grid">
          <span v-for="n in pad" :key="'p'+n" class="sv-cell sv-empty" />
          <div
            v-for="d in days"
            :key="d.date"
            class="sv-cell"
            :class="{ 'sv-rest': d.isRestDay, 'sv-today': d.date === today }"
            @click="openDialog(d)"
          >
            <div class="sv-dn">{{ dayNum(d.date) }}</div>
            <div class="sv-ds" v-if="!d.isRestDay">{{ d.bookedSlots }}/{{ d.maxSlots }}</div>
            <div class="sv-ds sv-dr" v-else>休</div>
            <div class="sv-do" v-if="d.orders.length">
              <span v-for="o in d.orders.slice(0,2)" :key="o.orderNo" class="sv-on">{{ o.customerName }}</span>
              <span v-if="d.orders.length > 2" class="sv-on">+{{ d.orders.length - 2 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit dialog -->
      <el-dialog v-model="dialog" :title="'编辑 ' + editDate" width="360px">
        <el-form label-width="80px">
          <el-form-item label="接单上限">
            <el-input-number v-model="editMaxSlots" :min="0" :max="99" />
            <span style="margin-left:8px;color:#999;font-size:12px">0 = 不接单</span>
          </el-form-item>
          <el-form-item label="设为休息日">
            <el-switch v-model="editRestDay" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialog = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import AdminLayout from '@/components/AdminLayout.vue';
import api from '@/api';

interface AdminDay {
  date: string;
  weekday: number;
  isRestDay: boolean;
  maxSlots: number;
  bookedSlots: number;
  version: number;
  orders: { orderNo: string; customerName: string; status: number; photoCount: number }[];
}

const days = ref<AdminDay[]>([]);
const loading = ref(false);
const currentMonth = ref(dayjs());

const dialog = ref(false);
const editDate = ref('');
const editMaxSlots = ref(5);
const editRestDay = ref(false);
const saving = ref(false);

const monthTitle = computed(() => currentMonth.value.format('YYYY年M月'));
const today = dayjs().format('YYYY-MM-DD');

const pad = computed(() => {
  if (days.value.length === 0) return 0;
  return dayjs(days.value[0].date).day();
});

function dayNum(d: string) { return String(new Date(d).getDate()); }

async function fetchMonth(m?: dayjs.Dayjs) {
  const month = m ?? currentMonth.value;
  loading.value = true;
  try {
    const res = await api.get('/admin/schedule/calendar', { params: { month: month.format('YYYY-MM') } });
    days.value = res.data.data;
  } catch {
    ElMessage.error('加载排期失败');
  } finally {
    loading.value = false;
  }
}

function prevMonth() { currentMonth.value = currentMonth.value.subtract(1, 'month'); fetchMonth(); }
function nextMonth() { currentMonth.value = currentMonth.value.add(1, 'month'); fetchMonth(); }
function goToday() { currentMonth.value = dayjs(); fetchMonth(); }

function openDialog(d: AdminDay) {
  editDate.value = d.date;
  editMaxSlots.value = d.maxSlots;
  editRestDay.value = d.isRestDay;
  dialog.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    await api.put(`/admin/schedule/${editDate.value}`, {
      maxSlots: editMaxSlots.value,
      isRestDay: editRestDay.value,
    });
    ElMessage.success('保存成功');
    dialog.value = false;
    fetchMonth();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => fetchMonth());
</script>

<style>
.sv h3 { margin-bottom: 16px; }
.sv-nav { display: flex; align-items: center; margin-bottom: 16px; }
.sv-mo { font-size: 18px; font-weight: 600; margin: 0 12px; }
.sv-cal { background: #fff; border-radius: 8px; padding: 16px; }
.sv-week { display: flex; margin-bottom: 8px; }
.sv-wd { width: 14.28%; text-align: center; font-size: 13px; color: #999; padding: 4px 0; }
.sv-grid { display: flex; flex-wrap: wrap; }
.sv-cell {
  width: 13.5%;
  margin: 2px 0.35%;
  min-height: 80px;
  background: #fafafa;
  border-radius: 6px;
  padding: 6px;
  box-sizing: border-box;
  cursor: pointer;
  border: 1px solid transparent;
}
.sv-cell:hover { border-color: #409eff; }
.sv-empty { background: transparent; cursor: default; border: none; }
.sv-rest { background: #fff0f0; }
.sv-today { border-color: #409eff; }
.sv-dn { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
.sv-ds { font-size: 11px; color: #67c23a; }
.sv-dr { color: #f56c6c; }
.sv-do { margin-top: 4px; }
.sv-on { display: block; font-size: 10px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
