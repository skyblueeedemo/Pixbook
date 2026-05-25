<template>
  <view class="spg">
    <view class="scd">
      <view class="sic">
        <view class="sic-circle">✓</view>
      </view>
      <text class="stl">预约成功</text>
      <text class="sst">您的修图预约已提交，修图师将尽快确认</text>

      <view class="sif">
        <view class="sir">
          <text class="slb">订单号</text>
          <text class="svl">{{ orderId }}</text>
        </view>
        <view class="sir">
          <text class="slb">预约日期</text>
          <text class="svl">{{ date }}</text>
        </view>
        <view class="sir">
          <text class="slb">修图张数</text>
          <text class="svl">{{ count }} 张</text>
        </view>
      </view>

      <view class="stp">📋 请截图保存或复制订单号，方便后续查询</view>

      <button class="sbt sbt-cp" @tap="copyOrderId">📋 复制订单号</button>
      <button class="sbt sbt-bk" @tap="goHome">← 返回首页</button>
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
.spg { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); }
.scd { width: 100%; max-width: 360px; background: #fff; border-radius: 16px; padding: 36px 24px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.sic-circle { width: 64px; height: 64px; border-radius: 50%; background: #4caf50; color: #fff; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
.stl { display: block; font-size: 22px; font-weight: 700; color: #2e7d32; margin-top: 12px; }
.sst { display: block; font-size: 13px; color: #999; margin-top: 6px; }
.sif { margin: 20px 0; background: #fafafa; border-radius: 8px; padding: 4px 12px; }
.sir { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.sir:last-child { border-bottom: none; }
.slb { color: #888; }
.svl { font-weight: 600; color: #333; }
.stp { font-size: 12px; color: #e65100; margin: 8px 0 16px; padding: 8px 12px; background: #fff3e0; border-radius: 8px; border-left: 3px solid #ff9800; }
.sbt { width: 100%; border: none; border-radius: 8px; padding: 13px; margin-top: 10px; font-size: 15px; font-weight: 600; }
.sbt-cp { background: #409eff; color: #fff; }
.sbt-bk { background: #f0f0f0; color: #555; }
</style>
