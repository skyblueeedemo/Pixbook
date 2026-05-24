<template>
  <view class="spg">
    <view class="scd">
      <view class="sic">✅</view>
      <text class="stl">预约成功！</text>

      <view class="sif">
        <view class="sir"><text class="slb">订单号</text><text class="svl">{{ orderId }}</text></view>
        <view class="sir"><text class="slb">预约日期</text><text class="svl">{{ date }}</text></view>
        <view class="sir"><text class="slb">修图张数</text><text class="svl">{{ count }} 张</text></view>
      </view>

      <view class="stp">📋 请截图保存或复制订单号备查</view>

      <button class="sbt sbt-cp" @tap="copyOrderId">复制订单号</button>
      <button class="sbt sbt-bk" @tap="goHome">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const orderId = ref('');
const date = ref('');
const count = ref(0);

onLoad((options: any) => {
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

<style>
.spg { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
.scd { width: 100%; max-width: 360px; background: #fff; border-radius: 12px; padding: 32px 20px; text-align: center; }
.sic { font-size: 48px; margin-bottom: 8px; }
.stl { font-size: 20px; font-weight: 600; color: #2e7d32; }
.sif { margin: 20px 0; }
.sir { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.slb { color: #888; }
.svl { font-weight: 500; }
.stp { font-size: 12px; color: #f57c00; margin: 12px 0; padding: 8px; background: #fff3e0; border-radius: 6px; }
.sbt { width: 100%; border: none; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 16px; }
.sbt-cp { background: #409eff; color: #fff; }
.sbt-bk { background: #f5f5f5; color: #333; }
</style>
