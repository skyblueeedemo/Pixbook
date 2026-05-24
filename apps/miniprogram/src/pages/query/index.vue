<template>
  <view class="page">
    <view class="card">
      <text class="title">📋 订单查询</text>

      <view class="form">
        <input
          v-model="orderIdInput"
          class="input"
          placeholder="请输入订单号"
        />
        <input
          v-model="phoneInput"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入预约手机号"
        />
        <button class="btn" :disabled="loading" @tap="handleQuery">
          {{ loading ? '查询中...' : '查询' }}
        </button>
      </view>

      <view v-if="error" class="error">{{ error }}</view>

      <view v-if="order" class="result">
        <view class="result-row">
          <text class="label">订单号</text>
          <text class="value">{{ order.orderId }}</text>
        </view>
        <view class="result-row">
          <text class="label">预约日期</text>
          <text class="value">{{ order.scheduleDate }}</text>
        </view>
        <view class="result-row">
          <text class="label">状态</text>
          <text class="value status">{{ order.statusLabel }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useOrderQuery } from '@/composables/useOrderQuery';

const orderIdInput = ref('');
const phoneInput = ref('');
const { order, loading, error, query } = useOrderQuery();

function handleQuery() {
  if (!orderIdInput.value || !phoneInput.value) {
    error.value = '请填写订单号和手机号';
    return;
  }
  query(orderIdInput.value, phoneInput.value);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px;
  display: flex;
  justify-content: center;
}
.card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
}
.title { font-size: 18px; font-weight: 600; display: block; text-align: center; margin-bottom: 20px; }
.form { display: flex; flex-direction: column; gap: 12px; }
.input {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
}
.btn {
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px;
}
.error { color: #e74c3c; font-size: 13px; margin-top: 10px; text-align: center; }
.result { margin-top: 20px; }
.result-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.label { color: #888; }
.value { font-weight: 500; }
.status { color: #409eff; }
</style>
