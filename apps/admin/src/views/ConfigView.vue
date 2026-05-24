<template>
  <el-container>
    <el-header class="header">
      <span>⚙️ 系统配置</span>
      <el-button @click="logout">退出登录</el-button>
    </el-header>
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu :router="true" :default-active="route.path">
          <el-menu-item index="/">总览</el-menu-item>
          <el-menu-item index="/schedule">排期管理</el-menu-item>
          <el-menu-item index="/orders">订单管理</el-menu-item>
          <el-menu-item index="/config">系统配置</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <h3>全局配置</h3>
        <p>每日接单上限、预订范围、休息日规则等配置功能将在 Phase 3 实现。</p>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

function logout() {
  localStorage.removeItem('token');
  router.push('/login');
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #409eff;
  color: #fff;
  padding: 0 20px;
}
.aside {
  background: #fff;
  min-height: calc(100vh - 60px);
}
</style>
