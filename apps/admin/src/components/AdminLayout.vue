<template>
  <el-container style="height:100vh">
    <el-header class="ah">
      <span class="ah-t">修图约 · 管理后台</span>
      <el-button text @click="logout" style="color:#fff">退出登录</el-button>
    </el-header>
    <el-container>
      <el-aside width="200px" class="as">
        <el-menu :router="true" :default-active="route.path">
          <el-menu-item index="/">📊 总览</el-menu-item>
          <el-menu-item index="/orders">📋 订单管理</el-menu-item>
          <el-menu-item index="/schedule">📅 排期管理</el-menu-item>
          <el-menu-item index="/config">⚙️ 系统配置</el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="am">
        <slot />
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

<style>
.ah { display: flex; align-items: center; justify-content: space-between; background: #409eff; }
.ah-t { color: #fff; font-size: 18px; font-weight: 600; }
.as { background: #fff; border-right: 1px solid #eee; }
.am { background: #f0f2f5; padding: 20px; }
</style>
