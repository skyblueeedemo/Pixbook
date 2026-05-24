<template>
  <view class="page">
    <view class="card">
      <view class="icon">✅</view>
      <text class="title">预约成功！</text>

      <view class="info-list">
        <view class="info-row">
          <text class="label">订单号</text>
          <text class="value">{{ orderId }}</text>
        </view>
        <view class="info-row">
          <text class="label">预约日期</text>
          <text class="value">{{ date }}</text>
        </view>
        <view class="info-row">
          <text class="label">修图张数</text>
          <text class="value">{{ count }} 张</text>
        </view>
      </view>

      <view class="tip">📋 请截图保存此页面或复制订单号备查</view>

      <view class="actions">
        <button class="btn-copy" @tap="copyOrderId">复制订单号</button>
        <button class="btn-back" @tap="goHome">返回首页</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const orderId = ref('');
const date = ref('');
const count = ref(0);

onLoad((options) => {
  orderId.value = options?.orderId ?? '';
  date.value = options?.date ?? '';
  count.value = Number(options?.count ?? 0);
});

function copyOrderId() {
  uni.setClipboardData({
    data: orderId.value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  });
}

function goHome() {
  uni.navigateBack();
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
}
.icon { font-size: 48px; margin-bottom: 8px; }
.title { font-size: 20px; font-weight: 600; color: #2e7d32; }
.info-list { margin: 20px 0; }
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.label { color: #888; }
.value { font-weight: 500; }
.tip {
  font-size: 12px;
  color: #f57c00;
  margin: 12px 0;
  padding: 8px;
  background: #fff3e0;
  border-radius: 6px;
}
.actions { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.btn-copy { background: #409eff; color: #fff; border: none; border-radius: 8px; padding: 12px; }
.btn-back { background: #f5f5f5; color: #333; border: none; border-radius: 8px; padding: 12px; }
</style>
