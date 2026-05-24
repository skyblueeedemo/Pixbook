<template>
  <AdminLayout>
    <div class="dt">
      <h3>数据总览</h3>

      <!-- Status cards -->
      <el-row :gutter="12" style="margin-bottom:20px">
        <el-col :span="4" v-for="c in statusCards" :key="c.label">
          <el-card
            shadow="hover"
            :class="['dsc', { 'dsc-sel': activeStatus === c.status }]"
            @click="filterBy(c.status)"
          >
            <div class="dcv">{{ c.count }}</div>
            <div class="dcl">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Recent orders -->
      <el-card v-loading="loading">
        <template #header>
          <span style="font-weight:600">
            {{ activeStatus === null ? '最近订单' : statusLabel(activeStatus) + ' · ' + filteredTotal + ' 单' }}
          </span>
          <el-button v-if="activeStatus !== null" size="small" style="float:right" @click="filterBy(null)">显示全部</el-button>
        </template>
        <el-table :data="orders" stripe size="small">
          <el-table-column prop="orderId" label="订单号" width="150" />
          <el-table-column prop="customerName" label="客户" width="80" />
          <el-table-column label="预约日期" width="110">
            <template #default="{ row }">{{ fmt(row.scheduleDate) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="st(row.status)">{{ row.statusLabel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="requirements" label="修图需求" min-width="200" show-overflow-tooltip />
        </el-table>
        <div v-if="orders.length === 0" style="text-align:center;color:#999;padding:20px">暂无数据</div>
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

const orders = ref<Order[]>([]);
const loading = ref(false);
const activeStatus = ref<number | null>(null);
const filteredTotal = ref(0);

const statusList = [
  { status: 0, label: '待确认', tag: 'warning' },
  { status: 1, label: '已确认', tag: '' },
  { status: 2, label: '修图中', tag: 'primary' },
  { status: 3, label: '待交付', tag: '' },
  { status: 4, label: '已完成', tag: 'success' },
  { status: 5, label: '已取消', tag: 'info' },
];

const statusCards = reactive(
  statusList.map((s) => ({ status: s.status, label: s.label, count: '-' })),
);

const stags: Record<number, string> = { 0: 'warning', 1: '', 2: 'primary', 3: '', 4: 'success', 5: 'info' };
function st(s: number) { return stags[s] ?? 'info'; }
function statusLabel(s: number) { return statusList.find((x) => x.status === s)?.label ?? ''; }
function fmt(d: string) { return (d ?? '').slice(0, 10); }

async function loadAll() {
  loading.value = true;
  try {
    // Fetch count for each status + total in parallel
    const counts = await Promise.all(
      statusList.map((s) =>
        api.get('/admin/orders', { params: { status: s.status, page: 1, pageSize: 1 } }).then((r) => r.data.data.total),
      ),
    );
    statusList.forEach((_, i) => {
      statusCards[i].count = String(counts[i]);
    });
  } catch { /* silent */ }

  await fetchOrders();
  loading.value = false;
}

async function fetchOrders() {
  try {
    const params: any = { page: 1, pageSize: 20 };
    if (activeStatus.value !== null) params.status = activeStatus.value;
    const res = await api.get('/admin/orders', { params });
    orders.value = res.data.data.list;
    filteredTotal.value = res.data.data.total;
  } catch { /* silent */ }
}

async function filterBy(status: number | null) {
  activeStatus.value = status;
  loading.value = true;
  await fetchOrders();
  loading.value = false;
}

onMounted(() => loadAll());
</script>

<style>
.dt h3 { margin-bottom: 16px; }
.dsc { cursor: pointer; transition: border-color 0.2s; }
.dsc:hover { border-color: #409eff; }
.dsc-sel { border-color: #409eff; background: #ecf5ff; }
.dcv { font-size: 24px; font-weight: 700; color: #409eff; }
.dcl { font-size: 12px; color: #999; margin-top: 4px; }
</style>
