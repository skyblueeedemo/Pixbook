<template>
  <view class="fm">
    <view class="fm-tt">填写修图需求</view>

    <!-- Name -->
    <view class="fd">
      <view class="fd-lb">客户姓名 *</view>
      <view class="fd-ib">
        <input v-model="form.customerName" class="fd-ip" placeholder="请输入真实姓名" maxlength="10" />
      </view>
      <view v-if="errors.customerName" class="fd-err">{{ errors.customerName }}</view>
    </view>

    <!-- Contact Method -->
    <view class="fd">
      <view class="fd-lb">联系方式 *</view>
      <picker :range="contactMethods" :value="contactMethodIndex" @change="onContactMethodChange">
        <view class="fd-pick">{{ form.contactMethod || '请选择' }}</view>
      </picker>
      <view v-if="errors.contactMethod" class="fd-err">{{ errors.contactMethod }}</view>
    </view>

    <!-- Contact Value -->
    <view class="fd">
      <view class="fd-lb">联系方式号码 *</view>
      <view class="fd-ib">
        <input v-model="form.contactValue" class="fd-ip" placeholder="微信号/QQ号" maxlength="64" />
      </view>
      <view v-if="errors.contactValue" class="fd-err">{{ errors.contactValue }}</view>
    </view>

    <!-- Phone (optional) -->
    <view class="fd">
      <view class="fd-lb">手机号（选填）</view>
      <view class="fd-ib">
        <input v-model="form.customerPhone" class="fd-ip" type="number" maxlength="11" placeholder="选填，用于短信提醒" />
      </view>
    </view>

    <!-- Photo Count -->
    <view class="fd">
      <view class="fd-lb">修图张数 *</view>
      <view class="fd-ib">
        <input v-model.number="form.photoCount" class="fd-ip" type="digit" placeholder="1-50" />
      </view>
      <view class="fd-hint">最多 50 张</view>
      <view v-if="errors.photoCount" class="fd-err">{{ errors.photoCount }}</view>
    </view>

    <!-- Requirements -->
    <view class="fd">
      <view class="fd-lb">修图需求 *</view>
      <view class="fd-ib">
        <textarea v-model="form.requirements" class="fd-ta" placeholder="例：人像精修，保留自然感，磨皮适度..." maxlength="500" />
      </view>
      <view class="fd-hint">{{ form.requirements.length }}/500</view>
      <view v-if="errors.requirements" class="fd-err">{{ errors.requirements }}</view>
    </view>

    <!-- Custom fields section -->
    <template v-if="customFields.length">
      <view class="fm-sec">修图偏好</view>
      <view class="fd" v-for="f in customFields" :key="f.key">
        <view class="fd-lb">{{ f.label }} <text v-if="f.required" style="color:#e74c3c">*</text></view>

        <!-- select -->
        <template v-if="f.type === 'select'">
          <picker :range="f.options" :value="selectIndex(f.key)" @change="(e: any) => onSelectChange(f.key, f.options[e.detail.value])">
            <view class="fd-pick">{{ customValues[f.key] || '请选择' + f.label }}</view>
          </picker>
        </template>

        <!-- multi_select -->
        <template v-if="f.type === 'multi_select'">
          <checkbox-group @change="(e: any) => onMultiChange(f.key, e.detail.value)">
            <label v-for="o in f.options" :key="o" class="fd-chk">
              <checkbox :value="o" :checked="multiChecked(f.key, o)" />{{ o }}
            </label>
          </checkbox-group>
        </template>

        <!-- text -->
        <template v-if="f.type === 'text'">
          <view class="fd-ib">
            <input v-model="customValues[f.key]" class="fd-ip" :placeholder="'请输入' + f.label" maxlength="100" />
          </view>
        </template>

        <view v-if="fieldErrors[f.key]" class="fd-err">{{ fieldErrors[f.key] }}</view>
      </view>
    </template>

    <view v-if="submitError" class="fd-ban">{{ submitError }}</view>

    <button class="fd-btn" :disabled="submitting" :loading="submitting" @tap="handleSubmit">
      {{ submitting ? '提交中...' : '提交预约' }}
    </button>
    <view class="fd-disc">提交即视为同意服务条款</view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { useBooking } from '@/composables/useBooking';
import type { DayStatus } from '@/composables/useCalendar';
import { api } from '@/api';

interface FieldDef {
  key: string;
  label: string;
  type: 'select' | 'multi_select' | 'text';
  required: boolean;
  options: string[];
}

const props = defineProps<{ date: DayStatus }>();
const emit = defineEmits<{ success: [result: { orderId: string; photoCount: number }] }>();
const { submitting, submit } = useBooking();
const submitError = ref<string | null>(null);

const contactMethods = ['微信', 'QQ'];
const form = reactive({ customerName: '', contactMethod: '', contactValue: '', customerPhone: '', photoCount: 10, requirements: '', additionalNotes: '' });
const errors = reactive({ customerName: '', contactMethod: '', contactValue: '', photoCount: '', requirements: '' });

const contactMethodIndex = computed(() => Math.max(0, contactMethods.indexOf(form.contactMethod)));
function onContactMethodChange(e: any) {
  form.contactMethod = contactMethods[e.detail.value];
}

const customFields = ref<FieldDef[]>([]);
const customValues = reactive<Record<string, unknown>>({});
const fieldErrors = reactive<Record<string, string>>({});

onMounted(async () => {
  try {
    const res = await api.get<{ code: number; data: FieldDef[] }>('/config/booking-form');
    customFields.value = res.data || [];
    customFields.value.forEach((f) => {
      if (f.type === 'multi_select') {
        customValues[f.key] = [];
      } else {
        customValues[f.key] = '';
      }
    });
  } catch { /* no custom fields configured */ }
});

function selectIndex(key: string) {
  const v = customValues[key] as string;
  const f = customFields.value.find((x) => x.key === key);
  if (!f) return 0;
  return Math.max(0, f.options.indexOf(v));
}

function onSelectChange(key: string, value: string) {
  customValues[key] = value;
}

function multiChecked(key: string, opt: string) {
  return ((customValues[key] as string[]) || []).includes(opt);
}

function onMultiChange(key: string, values: string[]) {
  customValues[key] = values;
}

function validate(): boolean {
  let ok = true;
  errors.customerName = errors.contactMethod = errors.contactValue = errors.photoCount = errors.requirements = '';
  if (!form.customerName || form.customerName.length < 2 || form.customerName.length > 10) { errors.customerName = '请输入2-10个字姓名'; ok = false; }
  if (!form.contactMethod) { errors.contactMethod = '请选择联系方式'; ok = false; }
  if (!form.contactValue || form.contactValue.length < 1) { errors.contactValue = '请填写微信号/QQ号'; ok = false; }
  if (form.customerPhone && !/^1\d{10}$/.test(form.customerPhone)) { errors.customerPhone = '手机号格式不正确'; ok = false; }
  if (!form.photoCount || form.photoCount < 1 || form.photoCount > 50) { errors.photoCount = '张数需在1-50之间'; ok = false; }
  if (!form.requirements || form.requirements.length < 10) { errors.requirements = '请至少填写10个字描述需求'; ok = false; }

  // Validate custom fields
  for (const f of customFields.value) {
    fieldErrors[f.key] = '';
    if (!f.required) continue;
    const v = customValues[f.key];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
      fieldErrors[f.key] = '请' + (f.type === 'select' ? '选择' : '填写') + f.label;
      ok = false;
    }
  }

  return ok;
}

async function handleSubmit() {
  submitError.value = null;
  if (!validate()) return;
  try {
    // Build customFields payload
    const cf: Record<string, unknown> = {};
    customFields.value.forEach((f) => {
      cf[f.key] = customValues[f.key];
    });

    const res = await submit({
      scheduleDate: props.date.date, customerName: form.customerName,
      customerPhone: form.customerPhone || undefined,
      contactMethod: form.contactMethod, contactValue: form.contactValue,
      photoCount: form.photoCount, requirements: form.requirements, additionalNotes: form.additionalNotes || undefined,
      customFields: cf,
      expectedVersion: props.date.version,
    });
    if (res.code === 0 || res.code === 1005) {
      emit('success', { orderId: res.data?.orderId ?? '', photoCount: form.photoCount });
    }
  } catch (e: any) {
    submitError.value = e.data?.message ?? '提交失败，请检查网络后重试';
  }
}
</script>

<style>
.fm { margin: 10px; background: #fff; border-radius: 10px; padding: 18px; }
.fm-tt { font-size: 16px; font-weight: 600; margin-bottom: 15px; }
.fd { margin-bottom: 15px; }
.fd-lb { font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
.fd-ib { border: 1px solid #ddd; border-radius: 6px; padding: 0 12px; }
.fd-ip { width: 100%; height: 44px; line-height: 44px; font-size: 14px; }
.fd-ta { width: 100%; min-height: 80px; font-size: 14px; padding: 10px 0; line-height: 1.5; }
.fd-hint { font-size: 11px; color: #aaa; margin-top: 4px; }
.fd-err { font-size: 12px; color: #e74c3c; margin-top: 4px; }
.fd-ban { background: #fff3e0; color: #e65100; font-size: 13px; padding: 10px; border-radius: 6px; margin-bottom: 12px; text-align: center; }
.fd-btn { width: 100%; background: #409eff; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 16px; font-weight: 600; }
.fd-btn[disabled] { opacity: 0.6; }
.fd-disc { text-align: center; font-size: 11px; color: #bbb; margin-top: 10px; }
.fd-pick { width: 100%; height: 44px; line-height: 44px; font-size: 14px; color: #333; border: 1px solid #ddd; border-radius: 6px; padding: 0 12px; box-sizing: border-box; background: #fff; }
.fd-chk { display: block; font-size: 14px; line-height: 36px; }
.fm-sec { font-size: 14px; font-weight: 600; color: #333; margin: 20px 0 10px; padding-left: 10px; border-left: 3px solid #409eff; }
</style>
