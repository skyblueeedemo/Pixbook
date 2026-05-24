<template>
  <view class="form-wrap">
    <view class="section-title">填写修图需求</view>

    <!-- Customer Name -->
    <view class="field">
      <text class="field-label">客户姓名 *</text>
      <input
        v-model="form.customerName"
        class="field-input"
        placeholder="请输入真实姓名"
        maxlength="10"
      />
      <text v-if="errors.customerName" class="field-error">{{ errors.customerName }}</text>
    </view>

    <!-- Phone -->
    <view class="field">
      <text class="field-label">联系方式 *</text>
      <input
        v-model="form.customerPhone"
        class="field-input"
        type="number"
        maxlength="11"
        placeholder="请输入手机号"
      />
      <text class="field-hint">ℹ️ 用于预约确认，不会公开</text>
      <text v-if="errors.customerPhone" class="field-error">{{ errors.customerPhone }}</text>
    </view>

    <!-- Photo Count -->
    <view class="field">
      <text class="field-label">修图张数 *</text>
      <input
        v-model.number="form.photoCount"
        class="field-input"
        type="number"
        placeholder="1-50"
      />
      <text class="field-hint">最多 50 张</text>
      <text v-if="errors.photoCount" class="field-error">{{ errors.photoCount }}</text>
    </view>

    <!-- Requirements -->
    <view class="field">
      <text class="field-label">修图需求 *</text>
      <textarea
        v-model="form.requirements"
        class="field-textarea"
        placeholder="例：人像精修，保留自然感，磨皮适度..."
        maxlength="500"
      />
      <text class="field-hint">{{ form.requirements.length }}/500</text>
      <text v-if="errors.requirements" class="field-error">{{ errors.requirements }}</text>
    </view>

    <!-- Additional Notes -->
    <view class="field">
      <text class="field-label">附加说明（选填）</text>
      <textarea
        v-model="form.additionalNotes"
        class="field-textarea"
        placeholder="例：交付格式要求、参考图说明等"
        maxlength="500"
      />
    </view>

    <!-- Error banner -->
    <view v-if="submitError" class="error-banner">{{ submitError }}</view>

    <!-- Submit -->
    <button
      class="submit-btn"
      :disabled="submitting"
      :loading="submitting"
      @tap="handleSubmit"
    >
      {{ submitting ? '提交中...' : '提交预约' }}
    </button>

    <text class="disclaimer">提交即视为同意服务条款</text>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import { useBooking } from '@/composables/useBooking';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{ date: DayStatus }>();
const emit = defineEmits<{ success: [orderId: string] }>();

const { submitting, submit } = useBooking();
const submitError = ref<string | null>(null);

const form = reactive({
  customerName: '',
  customerPhone: '',
  photoCount: 10,
  requirements: '',
  additionalNotes: '',
});

const errors = reactive({
  customerName: '',
  customerPhone: '',
  photoCount: '',
  requirements: '',
});

function validate(): boolean {
  let valid = true;
  errors.customerName = '';
  errors.customerPhone = '';
  errors.photoCount = '';
  errors.requirements = '';

  if (!form.customerName || form.customerName.length < 2 || form.customerName.length > 10) {
    errors.customerName = '请输入 2–10 个字的姓名';
    valid = false;
  }
  if (!/^1\d{10}$/.test(form.customerPhone)) {
    errors.customerPhone = '请输入有效的手机号码';
    valid = false;
  }
  if (!form.photoCount || form.photoCount < 1 || form.photoCount > 50) {
    errors.photoCount = '张数需在 1–50 之间';
    valid = false;
  }
  if (!form.requirements || form.requirements.length < 10) {
    errors.requirements = '请至少填写 10 个字描述需求';
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  submitError.value = null;
  if (!validate()) return;

  try {
    const res = await submit({
      scheduleDate: props.date.date,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      photoCount: form.photoCount,
      requirements: form.requirements,
      additionalNotes: form.additionalNotes || undefined,
      expectedVersion: props.date.version,
    });

    if (res.code === 0 || res.code === 1005) {
      const orderId = res.data?.orderId ?? '';
      emit('success', orderId);
    }
  } catch (e: unknown) {
    const err = e as { data?: { code?: number; message?: string } };
    if (err.data?.code === 1001) {
      // Concurrency conflict — emit event to refresh calendar
      submitError.value = '该日期名额刚刚被约满，日历已刷新，请重新选择';
      // Parent should call useCalendar.refresh()
    } else if (err.data?.code === 1003) {
      submitError.value = '您已预约该日期，如需修改请联系修图师';
    } else {
      submitError.value = err.data?.message ?? '提交失败，请检查网络后重试';
    }
  }
}
</script>

<style scoped>
.form-wrap {
  margin: 12px 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
.field {
  margin-bottom: 16px;
}
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}
.field-input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
}
.field-textarea {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  min-height: 80px;
}
.field-hint {
  display: block;
  font-size: 11px;
  color: #aaa;
  margin-top: 4px;
}
.field-error {
  display: block;
  font-size: 12px;
  color: #e74c3c;
  margin-top: 4px;
}
.error-banner {
  background: #fff3e0;
  color: #e65100;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 12px;
  text-align: center;
}
.submit-btn {
  width: 100%;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
}
.submit-btn[disabled] {
  opacity: 0.6;
}
.disclaimer {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #bbb;
  margin-top: 10px;
}
</style>
