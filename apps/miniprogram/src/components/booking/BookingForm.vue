<template>
  <view class="fm">
    <view class="fm-tt">填写修图需求</view>

    <view class="fd">
      <view class="fd-lb">客户姓名 *</view>
      <input v-model="form.customerName" class="fd-in" placeholder="请输入真实姓名" maxlength="10" />
      <view v-if="errors.customerName" class="fd-err">{{ errors.customerName }}</view>
    </view>

    <view class="fd">
      <view class="fd-lb">联系方式 *</view>
      <input v-model="form.customerPhone" class="fd-in" type="number" maxlength="11" placeholder="请输入手机号" />
      <view class="fd-hint">用于预约确认，不会公开</view>
      <view v-if="errors.customerPhone" class="fd-err">{{ errors.customerPhone }}</view>
    </view>

    <view class="fd">
      <view class="fd-lb">修图张数 *</view>
      <input v-model.number="form.photoCount" class="fd-in" type="number" placeholder="1-50" />
      <view class="fd-hint">最多 50 张</view>
      <view v-if="errors.photoCount" class="fd-err">{{ errors.photoCount }}</view>
    </view>

    <view class="fd">
      <view class="fd-lb">修图需求 *</view>
      <textarea v-model="form.requirements" class="fd-ta" placeholder="例：人像精修，保留自然感，磨皮适度..." maxlength="500" />
      <view class="fd-hint">{{ form.requirements.length }}/500</view>
      <view v-if="errors.requirements" class="fd-err">{{ errors.requirements }}</view>
    </view>

    <view class="fd">
      <view class="fd-lb">附加说明（选填）</view>
      <textarea v-model="form.additionalNotes" class="fd-ta" placeholder="例：交付格式要求、参考图说明等" maxlength="500" />
    </view>

    <view v-if="submitError" class="fd-ban">{{ submitError }}</view>

    <button class="fd-btn" :disabled="submitting" :loading="submitting" @tap="handleSubmit">
      {{ submitting ? '提交中...' : '提交预约' }}
    </button>
    <view class="fd-disc">提交即视为同意服务条款</view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useBooking } from '@/composables/useBooking';
import type { DayStatus } from '@/composables/useCalendar';

const props = defineProps<{ date: DayStatus }>();
const emit = defineEmits<{ success: [orderId: string] }>();
const { submitting, submit } = useBooking();
const submitError = ref<string | null>(null);

const form = reactive({ customerName: '', customerPhone: '', photoCount: 10, requirements: '', additionalNotes: '' });
const errors = reactive({ customerName: '', customerPhone: '', photoCount: '', requirements: '' });

function validate(): boolean {
  let ok = true;
  errors.customerName = errors.customerPhone = errors.photoCount = errors.requirements = '';
  if (!form.customerName || form.customerName.length < 2 || form.customerName.length > 10) { errors.customerName = '请输入2-10个字姓名'; ok = false; }
  if (!/^1\d{10}$/.test(form.customerPhone)) { errors.customerPhone = '请输入有效手机号'; ok = false; }
  if (!form.photoCount || form.photoCount < 1 || form.photoCount > 50) { errors.photoCount = '张数需在1-50之间'; ok = false; }
  if (!form.requirements || form.requirements.length < 10) { errors.requirements = '请至少填写10个字描述需求'; ok = false; }
  return ok;
}

async function handleSubmit() {
  submitError.value = null;
  if (!validate()) return;
  try {
    const res = await submit({
      scheduleDate: props.date.date, customerName: form.customerName, customerPhone: form.customerPhone,
      photoCount: form.photoCount, requirements: form.requirements, additionalNotes: form.additionalNotes || undefined,
      expectedVersion: props.date.version,
    });
    if (res.code === 0 || res.code === 1005) emit('success', res.data?.orderId ?? '');
  } catch (e: any) {
    submitError.value = e.data?.message ?? '提交失败，请检查网络后重试';
  }
}
</script>

<style>
.fm { margin: 10px; background: #fff; border-radius: 10px; padding: 18px; }
.fm-tt { font-size: 16px; font-weight: 600; margin-bottom: 15px; }
.fd { margin-bottom: 15px; }
.fd-lb { font-size: 13px; font-weight: 500; color: #555; margin-bottom: 5px; }
.fd-in { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; font-size: 14px; width: 100%; box-sizing: border-box; }
.fd-ta { border: 1px solid #ddd; border-radius: 6px; padding: 10px 12px; font-size: 14px; width: 100%; box-sizing: border-box; min-height: 80px; }
.fd-hint { font-size: 11px; color: #aaa; margin-top: 3px; }
.fd-err { font-size: 12px; color: #e74c3c; margin-top: 3px; }
.fd-ban { background: #fff3e0; color: #e65100; font-size: 13px; padding: 10px; border-radius: 6px; margin-bottom: 12px; text-align: center; }
.fd-btn { width: 100%; background: #409eff; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 16px; font-weight: 600; }
.fd-btn[disabled] { opacity: 0.6; }
.fd-disc { text-align: center; font-size: 11px; color: #bbb; margin-top: 10px; }
</style>
