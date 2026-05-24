<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>🔐 修图约 · 管理后台</h2>
      <el-form :model="form" label-width="0" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="账号" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" native-type="submit" style="width:100%">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/api';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function handleLogin() {
  loading.value = true;
  try {
    const res = await api.post('/admin/login', form);
    localStorage.setItem('token', res.data.data.token);
    ElMessage.success('登录成功');
    const redirect = (route.query.redirect as string) ?? '/';
    router.push(redirect);
  } catch {
    ElMessage.error('账号或密码错误');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #f0f2f5;
}
.login-card {
  width: 380px;
  padding: 20px;
}
.login-card h2 {
  text-align: center;
  margin-bottom: 24px;
}
</style>
