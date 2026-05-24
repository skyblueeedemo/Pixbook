<template>
  <AdminLayout>
    <div class="dt">
      <h3>数据总览</h3>
      <el-row :gutter="16">
        <el-col :span="6" v-for="c in cards" :key="c.label">
          <el-card shadow="hover">
            <div class="dcv">{{ c.value }}</div>
            <div class="dcl">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top:20px" v-loading="recentLoading">
        <h4 style="margin-bottom:12px">最近订单</h4>
        <el-table :data="recentOrders" stripe size="small">
          <el-table-column prop="orderId" label="订单号" width="150" />
          <el-table-column prop="customerName" label="客户" width="80" />
          <el-table-column label="预约日期" width="110">
            <template #default="{ row }">{{ fmt(row.scheduleDate) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="st(row.status)">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="requirements" label="修图需求" min-width="160" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import AdminLayout from '@/components/AdminLayout.vue';
import api from '@/api';

interface Order {
  orderId: string;
  scheduleDate: string;
  customerName: string;
  requirements: string;
  status: number;
  statusLabel: string;
}

const cards = reactive([
  { label: '今日预约', value: '-' },
  { label: '本月订单', value: '-' },
  { label: '待处理', value: '-' },
  { label: '总订单', value: '-' },
]);

const recentOrders = ref<Order[]>([]);
const recentLoading = ref(false);

const stags: Record<number, string> = { 0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'info' };
function st(s: number) { return stags[s] ?? 'info'; }
function fmt(d: string) { return (d ?? '').slice(0, 10); }

async function loadStats() {
  try {
    const res = await api.get('/admin/orders', { params: { page: 1, pageSize: 5 } });
    recentOrders.value = res.data.data.list;
    cards[3].value = String(res.data.data.total);

    // Count pending
    const pending = await api.get('/admin/orders', { params: { status: 0, page: 1, pageSize: 1 } });
    cards[2].value = String(pending.data.data.total);
  } catch { /* silent */ }
}

onMounted(() => loadStats());
</script>

<style>
.dt h3 { margin-bottom: 16px; }
.dcv { font-size: 28px; font-weight: 700; color: #409eff; }
.dcl { font-size: 13px; color: #999; margin-top: 4px; }
</style>
