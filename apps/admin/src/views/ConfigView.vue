<template>
  <AdminLayout>
    <div class="ct">
      <h3>系统配置</h3>

      <!-- Basic config -->
      <el-card v-loading="loading" style="margin-bottom:20px">
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

      <!-- Booking form fields config -->
      <el-card v-loading="loading">
        <template #header>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:600">预约表单字段</span>
            <el-button type="primary" size="small" @click="openFieldDialog()">添加字段</el-button>
          </div>
        </template>

        <el-table :data="formFields" style="width:100%" empty-text="暂无自定义字段，点击「添加字段」创建">
          <el-table-column prop="label" label="字段名" width="140" />
          <el-table-column prop="key" label="标识" width="140" />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">
              <el-tag size="small">{{ typeLabel(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="必填" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.required ? 'danger' : 'info'" size="small">{{ row.required ? '必填' : '选填' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="选项">
            <template #default="{ row }">
              <template v-if="row.type !== 'text'">
                <el-tag v-for="o in row.options" :key="o" size="small" style="margin:2px">{{ o }}</el-tag>
              </template>
              <span v-else style="color:#999;font-size:12px">自由输入</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row, $index }">
              <el-button size="small" @click="openFieldDialog(row, $index)">编辑</el-button>
              <el-button size="small" type="danger" @click="removeField($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top:16px">
          <el-button type="success" @click="handleSaveFields" :loading="savingFields">保存字段配置</el-button>
        </div>
      </el-card>

      <!-- Field edit dialog -->
      <el-dialog v-model="fieldDialog" :title="editingIndex >= 0 ? '编辑字段' : '添加字段'" width="520px">
        <el-form :model="fieldForm" label-width="80px">
          <el-form-item label="字段名称">
            <el-input v-model="fieldForm.label" placeholder="如：修图档位" maxlength="20" />
          </el-form-item>

          <el-form-item label="字段类型">
            <el-select v-model="fieldForm.type" style="width:100%">
              <el-option label="单选下拉" value="select" />
              <el-option label="多选" value="multi_select" />
              <el-option label="文本输入" value="text" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否必填">
            <el-switch v-model="fieldForm.required" />
          </el-form-item>
          <el-form-item v-if="fieldForm.type !== 'text'" label="选项列表">
            <div v-for="(_opt, oi) in fieldForm.options" :key="oi" style="display:flex;gap:8px;margin-bottom:6px">
              <el-input v-model="fieldForm.options[oi]" placeholder="选项值" size="small" />
              <el-button size="small" type="danger" @click="fieldForm.options.splice(oi,1)" :icon="'Delete'" circle />
            </div>
            <el-button size="small" @click="fieldForm.options.push('')">+ 添加选项</el-button>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="fieldDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmField">确定</el-button>
        </template>
      </el-dialog>

      <el-alert type="info" :closable="false" style="margin-top:16px" show-icon>
        保存后立即生效，无需重启服务。字段配置变更后，小程序端约30秒内同步更新。
      </el-alert>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import AdminLayout from '@/components/AdminLayout.vue';
import api from '@/api';

interface BookingFormField {
  key: string;
  label: string;
  type: 'select' | 'multi_select' | 'text';
  required: boolean;
  options: string[];
}

const loading = ref(false);
const saving = ref(false);
const savingFields = ref(false);

const daysOfWeek = [
  { value: '0', label: '周日' }, { value: '1', label: '周一' },
  { value: '2', label: '周二' }, { value: '3', label: '周三' },
  { value: '4', label: '周四' }, { value: '5', label: '周五' },
  { value: '6', label: '周六' },
];

const form = reactive({ default_max_slots: 5, booking_days: 30 });
const restDays = ref<string[]>([]);
const formFields = ref<BookingFormField[]>([]);

// Field dialog
const fieldDialog = ref(false);
const editingIndex = ref(-1);
const fieldForm = reactive<BookingFormField>({ key: '', label: '', type: 'select', required: false, options: [''] });

function typeLabel(t: string) { return { select: '单选', multi_select: '多选', text: '自由输入' }[t] ?? t; }

function openFieldDialog(field?: BookingFormField, idx?: number) {
  editingIndex.value = idx ?? -1;
  if (field) {
    fieldForm.key = field.key;
    fieldForm.label = field.label;
    fieldForm.type = field.type;
    fieldForm.required = field.required;
    fieldForm.options = [...field.options];
  } else {
    fieldForm.key = 'f_' + Math.random().toString(36).slice(2, 8);
    fieldForm.label = '';
    fieldForm.type = 'select';
    fieldForm.required = false;
    fieldForm.options = [''];
  }
  fieldDialog.value = true;
}

function confirmField() {
  if (!fieldForm.label) { ElMessage.warning('请填写字段名称'); return; }
  const options = fieldForm.type !== 'text' ? fieldForm.options.filter((o) => o.trim()) : [];
  const entry: BookingFormField = { ...fieldForm, options };
  if (editingIndex.value >= 0) {
    formFields.value[editingIndex.value] = entry;
  } else {
    // Prevent duplicate key
    if (formFields.value.some((f) => f.key === fieldForm.key)) { ElMessage.warning('字段标识已存在'); return; }
    formFields.value.push(entry);
  }
  fieldDialog.value = false;
}

function removeField(idx: number) {
  formFields.value.splice(idx, 1);
}

async function loadConfig() {
  loading.value = true;
  try {
    const res = await api.get('/admin/config');
    const data = res.data.data;
    form.default_max_slots = Number(data.defaultMaxSlots ?? 5);
    form.booking_days = Number(data.bookingDays ?? 30);
    restDays.value = (data.restDaysOfWeek ?? []).map(String);
    formFields.value = data.bookingFormFields ?? [];
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
      booking_form_fields: JSON.stringify(formFields.value),
    });
    ElMessage.success('配置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleSaveFields() {
  savingFields.value = true;
  try {
    await api.put('/admin/config', {
      default_max_slots: String(form.default_max_slots),
      booking_days: String(form.booking_days),
      rest_days_of_week: restDays.value.join(','),
      booking_form_fields: JSON.stringify(formFields.value),
    });
    ElMessage.success('字段配置已保存');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    savingFields.value = false;
  }
}

onMounted(() => loadConfig());
</script>

<style>
.ct h3 { margin-bottom: 16px; }
</style>
