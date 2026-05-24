<template>
  <AdminLayout>
    <div class="ct">
      <h3>系统配置</h3>

      <el-card v-loading="loading">
        <el-form :model="form" label-width="140px" @submit.prevent="handleSave">
          <el-form-item label="每日默认接单上限">
            <el-input-number v-model="form.default_max_slots" :min="1" :max="99" />
            <span style="margin-left:8px;color:#999;font-size:12px">新日期的默认名额数</span>
          </el-form-item>

          <el-form-item label="可预约天数范围">
            <el-input-number v-model="form.booking_days" :min="1" :max="365" />
            <span style="margin-left:8px;color:#999;font-size:12px">从今天起可预约的天数</span>
          </el-form-item>

          <el-form-item label="休息日">
            <el-checkbox-group v-model="restDays">
              <el-checkbox v-for="d in daysOfWeek" :key="d.value" :label="d.value">{{ d.label }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="saving">保存配置</el-button>
            <el-button @click="loadConfig" :disabled="saving">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <el-alert type="info" :closable="false" style="margin-top:16px" show-icon>
        保存后立即生效，无需重启服务。日历缓存会在下次预约时自动刷新。
      </el-alert>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import AdminLayout from '@/components/AdminLayout.vue';
import api from '@/api';

const loading = ref(false);
const saving = ref(false);

const daysOfWeek = [
  { value: '0', label: '周日' }, { value: '1', label: '周一' },
  { value: '2', label: '周二' }, { value: '3', label: '周三' },
  { value: '4', label: '周四' }, { value: '5', label: '周五' },
  { value: '6', label: '周六' },
];

const form = reactive({ default_max_slots: 5, booking_days: 30 });
const restDays = ref<string[]>([]);

async function loadConfig() {
  loading.value = true;
  try {
    const res = await api.get('/admin/config');
    const data = res.data.data;
    form.default_max_slots = Number(data.default_max_slots ?? 5);
    form.booking_days = Number(data.booking_days ?? 30);
    restDays.value = (data.rest_days_of_week ?? '').split(',').filter(Boolean);
  } catch {
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await api.put('/admin/config', {
      default_max_slots: String(form.default_max_slots),
      booking_days: String(form.booking_days),
      rest_days_of_week: restDays.value.join(','),
    });
    ElMessage.success('配置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(() => loadConfig());
</script>

<style>
.ct h3 { margin-bottom: 16px; }
</style>
