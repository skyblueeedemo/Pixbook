<template>
  <AdminLayout>
    <div class="dt">
      <h3>数据总览</h3>

      <!-- Summary cards -->
      <el-row :gutter="12" style="margin-bottom:16px">
        <el-col :span="6" v-for="(c, i) in summaryCards" :key="c.label">
          <el-card
            shadow="hover"
            :class="['dsc', { 'dsc-sel': activeFilter === i }]"
            @click="filterSummary(i)"
          >
            <div class="dcv">{{ c.value }}</div>
            <div class="dcl">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Status cards -->
      <el-row :gutter="12" style="margin-bottom:20px">
        <el-col :span="4" v-for="c in statusCards" :key="c.label">
          <el-card
            shadow="hover"
            :class="['dsc', { 'dsc-sel': activeStatus === c.status }]"
            @click="filterBy(c.status)"
          >
            <div class="dcv dcv-s">{{ c.count }}</div>
            <div class="dcl">{{ c.label }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Recent orders -->
      <el-card v-loading="loading">
        <template #header>
          <span style="font-weight:600">
            {{ tableTitle }}
          </span>
          <el-button v-if="activeStatus !== null || activeFilter !== null" size="small" style="float:right" @click="clearAll">显示全部</el-button>
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
import { ref, reactive, computed, onMounted } from 'vue';
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
const activeFilter = ref<number | null>(null); // 0=today, 1=month, 2=pending, 3=total
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

const summaryCards = reactive([
  { label: '今日预约', value: '-' },
  { label: '本月订单', value: '-' },
  { label: '待处理', value: '-' },
  { label: '总订单', value: '-' },
]);

const stags: Record<number, string> = { 0: 'warning', 1: '', 2: 'primary', 3: '', 4: 'success', 5: 'info' };
function st(s: number) { return stags[s] ?? 'info'; }
function statusLabel(s: number) { return statusList.find((x) => x.status === s)?.label ?? ''; }
function fmt(d: string) { return (d ?? '').slice(0, 10); }

const tableTitle = computed(() => {
  if (activeFilter.value === 0) return `今日预约 · ${filteredTotal.value} 单`;
  if (activeFilter.value === 1) return `本月订单 · ${filteredTotal.value} 单`;
  if (activeFilter.value === 2) return `待处理 · ${filteredTotal.value} 单`;
  if (activeFilter.value === 3) return `全部订单 · ${filteredTotal.value} 单`;
  if (activeStatus.value !== null) return `${statusLabel(activeStatus.value)} · ${filteredTotal.value} 单`;
  return '最近订单';
});

async function loadAll() {
  loading.value = true;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    // Fetch all stats in parallel (individual error handling)
    const settled = await Promise.allSettled([
      api.get('/admin/orders', { params: { dateFrom: today, dateTo: today, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { dateFrom: `${thisMonth}-01`, dateTo: `${thisMonth}-31`, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 0, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 0, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 1, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 2, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 3, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 4, page: 1, pageSize: 1 } }),
      api.get('/admin/orders', { params: { status: 5, page: 1, pageSize: 1 } }),
    ]);

    const vals = settled.map((r) => (r.status === 'fulfilled' ? r.value.data.data.total : 0));

    summaryCards[0].value = String(vals[0]);  // 今日
    summaryCards[1].value = String(vals[1]);   // 本月
    summaryCards[2].value = String(vals[4] + vals[5] + vals[6]); // 待处理 = 待确认 + 已确认 + 修图中
    summaryCards[3].value = String(vals[3]);   // 总单

    for (let i = 0; i < 6; i++) {
      statusCards[i].count = String(vals[4 + i]);
    }
  } catch { /* silent */ }

  await fetchOrders();
  loading.value = false;
}

async function fetchOrders() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    // If summary filter active
    if (activeFilter.value === 0) {
      // Today
      const res = await api.get('/admin/orders', { params: { dateFrom: today, dateTo: today, page: 1, pageSize: 20 } });
      orders.value = res.data.data.list;
      filteredTotal.value = res.data.data.total;
      return;
    }
    if (activeFilter.value === 1) {
      // This month (full month)
      const res = await api.get('/admin/orders', { params: { dateFrom: `${thisMonth}-01`, dateTo: `${thisMonth}-31`, page: 1, pageSize: 20 } });
      orders.value = res.data.data.list;
      filteredTotal.value = res.data.data.total;
      return;
    }
    if (activeFilter.value === 2) {
      // Pending = 待确认 + 已确认 + 修图中
      const [r0, r1, r2] = await Promise.all([0, 1, 2].map((s) =>
        api.get('/admin/orders', { params: { status: s, page: 1, pageSize: 10 } }),
      ));
      orders.value = [...r0.data.data.list, ...r1.data.data.list, ...r2.data.data.list]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, 20);
      filteredTotal.value = r0.data.data.total + r1.data.data.total + r2.data.data.total;
      return;
    }
    if (activeFilter.value === 3) {
      // All
      const res = await api.get('/admin/orders', { params: { page: 1, pageSize: 20 } });
      orders.value = res.data.data.list;
      filteredTotal.value = res.data.data.total;
      return;
    }

    // Status filter
    const params: any = { page: 1, pageSize: 20 };
    if (activeStatus.value !== null) params.status = activeStatus.value;
    const res = await api.get('/admin/orders', { params });
    orders.value = res.data.data.list;
    filteredTotal.value = res.data.data.total;
  } catch { /* silent */ }
}

function filterSummary(index: number) {
  activeFilter.value = activeFilter.value === index ? null : index;
  activeStatus.value = null;
  loading.value = true;
  fetchOrders().then(() => { loading.value = false; });
}

function clearAll() {
  activeFilter.value = null;
  activeStatus.value = null;
  loading.value = true;
  fetchOrders().then(() => { loading.value = false; });
}

async function filterBy(status: number | null) {
  activeFilter.value = null;
  activeStatus.value = activeStatus.value === status ? null : status;
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
.dcv-s { font-size: 20px; }
.dcl { font-size: 12px; color: #999; margin-top: 4px; }
</style>
