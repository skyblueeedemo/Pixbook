<template>
  <view class="qpg">
    <view class="qcd">
      <text class="qtl">订单查询</text>

      <view class="qfm">
        <view class="qib"><input v-model="nameInput" class="qip" placeholder="请输入预约姓名（必填）" maxlength="10" /></view>
        <view class="qib"><input v-model="contactInput" class="qip" placeholder="微信号/QQ号（可选）" /></view>
        <view class="qib"><input v-model="phoneInput" class="qip" type="number" maxlength="11" placeholder="手机号（可选）" /></view>
        <view class="qib"><input v-model="orderIdInput" class="qip" placeholder="订单号（可选）" /></view>
        <button class="qbt" :disabled="loading" @tap="handleQuery">
          {{ loading ? '查询中...' : '查询' }}
        </button>
      </view>

      <view v-if="error" class="qer">{{ error }}</view>

      <view v-if="order" class="qrs">
        <view class="qrw"><text class="qlb">订单号</text><text class="qvl">{{ order.orderId }}</text></view>
        <view class="qrw"><text class="qlb">联系方式</text><text class="qvl">{{ order.contactMethod }}：{{ order.contactValue }}</text></view>
        <view class="qrw" v-if="order.customerPhone"><text class="qlb">手机号</text><text class="qvl">{{ order.customerPhone }}</text></view>
        <view class="qrw"><text class="qlb">预约日期</text><text class="qvl">{{ fmtDate }}</text></view>
        <view class="qrw"><text class="qlb">修图张数</text><text class="qvl">{{ order.photoCount }} 张</text></view>
        <view class="qrw"><text class="qlb">状态</text><text class="qvl qst">{{ order.statusLabel }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useOrderQuery } from '@/composables/useOrderQuery';

const nameInput = ref('');
const contactInput = ref('');
const phoneInput = ref('');
const orderIdInput = ref('');
const { order, loading, error, query } = useOrderQuery();

const fmtDate = computed(() => {
  if (!order.value) return '';
  return (order.value.scheduleDate || '').slice(0, 10);
});

function handleQuery() {
  if (!nameInput.value) {
    error.value = '请填写姓名';
    return;
  }
  if (!contactInput.value && !phoneInput.value && !orderIdInput.value) {
    error.value = '请填写联系方式、手机号或订单号之一';
    return;
  }
  query({ name: nameInput.value, contactValue: contactInput.value || undefined, phone: phoneInput.value || undefined, orderId: orderIdInput.value || undefined });
}
</script>

<style>
.qpg { min-height: 100vh; padding: 24px; display: flex; justify-content: center; }
.qcd { width: 100%; max-width: 360px; background: #fff; border-radius: 12px; padding: 24px; }
.qtl { font-size: 18px; font-weight: 600; display: block; text-align: center; margin-bottom: 20px; }
.qfm { margin-bottom: 12px; }
.qib { border: 1px solid #ddd; border-radius: 6px; padding: 0 12px; margin-bottom: 12px; }
.qip { width: 100%; height: 44px; line-height: 44px; font-size: 14px; }
.qbt { width: 100%; background: #409eff; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 16px; }
.qbt[disabled] { opacity: 0.6; }
.qer { color: #e74c3c; font-size: 13px; margin: 10px 0; text-align: center; }
.qrs { margin-top: 20px; }
.qrw { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.qlb { color: #888; }
.qvl { font-weight: 500; }
.qst { color: #409eff; }
</style>
