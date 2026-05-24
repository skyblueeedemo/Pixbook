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
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  font-size: 11px;
  color: #888;
}
.item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.dot.dc-avail { background: #EAF3DE; }
.dot.dc-hot { background: #FAEEDA; }
.dot.dc-full { background: #FCEBEB; }
.dot.dc-off { background: #F2F2F7; }
</style>
