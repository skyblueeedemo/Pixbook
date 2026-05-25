<template>
  <view class="hp">
    <view class="hp-hero">
      <view class="hp-logo">🎡</view>
      <text class="hp-name">修图约-Pixbook</text>
      <text class="hp-tag">专业修图在线预约 · 时刻追踪订单状态</text>
    </view>

    <view class="hp-steps">
      <view class="hp-step">
        <view class="hp-step-num">1</view>
        <text class="hp-step-t">选择日期</text>
        <text class="hp-step-d">在日历中挑选合适的档期</text>
      </view>
      <view class="hp-step-ar">→</view>
      <view class="hp-step">
        <view class="hp-step-num">2</view>
        <text class="hp-step-t">填写需求</text>
        <text class="hp-step-d">描述修图要求与偏好</text>
      </view>
      <view class="hp-step-ar">→</view>
      <view class="hp-step">
        <view class="hp-step-num">3</view>
        <text class="hp-step-t">提交预约</text>
        <text class="hp-step-d">修图师确认后即可开始</text>
      </view>
    </view>

    <button class="hp-btn" @tap="goBook">开始预约</button>
    <view class="hp-query" @tap="goQuery">查看我的订单 →</view>
  </view>
</template>

<script setup lang="ts">
function goBook() {
  uni.switchTab({ url: '/pages/index/index' });
}
function goQuery() {
  uni.switchTab({ url: '/pages/query/index' });
}
</script>

<style>
.hp { min-height: 100vh; background: linear-gradient(180deg, #e8f4fd, #f5f5f5); padding: 40px 24px 30px; display: flex; flex-direction: column; align-items: center; }
.hp-hero { text-align: center; margin-bottom: 32px; }
.hp-logo { font-size: 64px; margin-bottom: 12px; }
.hp-name { display: block; font-size: 24px; font-weight: 700; color: #1a1a2e; margin-bottom: 6px; }
.hp-tag { display: block; font-size: 13px; color: #888; }

.hp-steps { display: flex; align-items: flex-start; justify-content: center; margin-bottom: 32px; gap: 8px; }
.hp-step { text-align: center; width: 90px; }
.hp-step-num { width: 32px; height: 32px; border-radius: 50%; background: #409eff; color: #fff; font-size: 15px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
.hp-step-t { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; }
.hp-step-d { display: block; font-size: 11px; color: #999; line-height: 1.4; }
.hp-step-ar { font-size: 18px; color: #ccc; padding-top: 6px; }

.hp-btn { width: 100%; max-width: 300px; background: #409eff; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 17px; font-weight: 600; margin-bottom: 16px; }
.hp-query { font-size: 13px; color: #409eff; padding: 8px 16px; }
</style>
