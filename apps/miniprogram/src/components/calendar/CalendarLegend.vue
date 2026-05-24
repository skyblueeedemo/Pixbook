<template>
  <view class="legend">
    <view class="item">
      <view class="dot dc-avail"></view>
      <text>可预约</text>
    </view>
    <view class="item">
      <view class="dot dc-hot"></view>
      <text>即将约满</text>
    </view>
    <view class="item">
      <view class="dot dc-full"></view>
      <text>已满</text>
    </view>
    <view class="item">
      <view class="dot dc-off"></view>
      <text>不可预约</text>
    </view>
  </view>
</template>

<style scoped>
.legend {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #eee;
  font-size: 22rpx;
  color: #888;
}
.item {
  display: flex;
  align-items: center;
}
.item text {
  margin-left: 8rpx;
}
.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  flex-shrink: 0;
}
.dot.dc-avail { background: #EAF3DE; }
.dot.dc-hot { background: #FAEEDA; }
.dot.dc-full { background: #FCEBEB; }
.dot.dc-off { background: #F2F2F7; }
</style>
