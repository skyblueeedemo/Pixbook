<template>
  <view class="legend">
    <view class="item"><view class="dot" style="background:#EAF3DE"></view>可约</view>
    <view class="item"><view class="dot" style="background:#FAEEDA"></view>将满</view>
    <view class="item"><view class="dot" style="background:#FCEBEB"></view>已满</view>
    <view class="item"><view class="dot" style="background:#F2F2F7"></view>休息</view>
  </view>
</template>

<style>
.legend {
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}
.item {
  display: inline-block;
  margin: 0 8px;
  font-size: 11px;
  color: #888;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 3px;
  vertical-align: middle;
}
</style>
