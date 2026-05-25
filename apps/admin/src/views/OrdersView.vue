<template>
  <AdminLayout>
    <div class="ot">
      <h3>订单管理</h3>

      <!-- Filters -->
      <div class="of">
        <el-select v-model="filters.status" placeholder="全部状态" clearable style="width:140px" @change="fetchOrders">
          <el-option label="待确认" :value="0" />
          <el-option label="已确认" :value="1" />
          <el-option label="修图中" :value="2" />
          <el-option label="待交付" :value="3" />
          <el-option label="已完成" :value="4" />
          <el-option label="已取消" :value="5" />
        </el-select>

        <el-input v-model="filters.keyword" placeholder="搜索姓名/手机号/订单号" clearable style="width:240px" @clear="fetchOrders" @keyup.enter="fetchOrders" />

        <el-date-picker v-model="filters.date" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" @change="fetchOrders" />

        <el-button type="primary" @click="fetchOrders">查询</el-button>
      </div>

      <!-- Table -->
      <el-table :data="orders" stripe v-loading="loading" class="otb">
        <el-table-column prop="orderId" label="订单号" width="160" />
        <el-table-column prop="customerName" label="客户" width="80" />
        <el-table-column label="手机号" width="120">
          <template #default="{ row }">{{ maskPhone(row.customerPhone) }}</template>
        </el-table-column>
        <el-table-column label="预约日期" width="120">
          <template #default="{ row }">{{ fmt(row.scheduleDate) }}</template>
        </el-table-column>
        <el-table-column prop="photoCount" label="张数" width="60" align="center" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requirements" label="修图需求" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建时间" width="140">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="opg" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          :page-size="20"
          :total="total"
          layout="prev, pager, next, total"
          @current-change="fetchOrders"
        />
      </div>

      <!-- Detail drawer -->
      <el-drawer v-model="drawer" title="订单详情" size="400">
        <template v-if="detail">
          <el-descriptions :column="1" border label-width="100px">
            <el-descriptions-item label="订单号">{{ detail.orderId }}</el-descriptions-item>
            <el-descriptions-item label="客户姓名">{{ detail.customerName }}</el-descriptions-item>
            <el-descriptions-item label="联系方式">{{ detail.contactMethod }}：{{ detail.contactValue }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.customerPhone" label="手机号">{{ maskPhone(detail.customerPhone || '') }}</el-descriptions-item>
            <el-descriptions-item label="预约日期">{{ fmt(detail.scheduleDate) }}</el-descriptions-item>
            <el-descriptions-item label="修图张数">{{ detail.photoCount }}</el-descriptions-item>
            <el-descriptions-item label="修图需求">{{ detail.requirements }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.additionalNotes" label="附加说明">{{ detail.additionalNotes }}</el-descriptions-item>
            <template v-if="detail.customFields && Object.keys(detail.customFields).length">
              <el-descriptions-item v-for="(v, k) in detail.customFields" :key="k" :label="fieldLabel(String(k))">
                {{ Array.isArray(v) ? v.join('、') : String(v ?? '') }}
              </el-descriptions-item>
            </template>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTag(detail.status)">{{ detail.statusLabel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ fmt(detail.createdAt) }}</el-descriptions-item>
          </el-descriptions>

          <!-- Status actions -->
          <div class="oact" v-if="detail.status !== 4 && detail.status !== 5">
            <el-divider />
            <p style="margin-bottom:12px;font-weight:600">流转状态：</p>
            <el-button
              v-for="s in nextStatuses(detail.status)"
              :key="s.value"
              :type="s.type"
              @click="changeStatus(detail.orderId, s.value)"
              style="margin-right:8px;margin-bottom:8px"
            >
              {{ s.label }}
            </el-button>
          </div>
        </template>
      </el-drawer>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import AdminLayout from '@/components/AdminLayout.vue';
import api from '@/api';

interface Order {
  orderId: string;
  scheduleDate: string;
  customerName: string;
  customerPhone?: string;
  contactMethod?: string;
  contactValue?: string;
  photoCount: number;
  requirements: string;
  additionalNotes?: string;
  customFields?: Record<string, unknown>;
  status: number;
  statusLabel: string;
  createdAt: string;
}

const orders = ref<Order[]>([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const drawer = ref(false);
const detail = ref<Order | null>(null);
const fieldLabels = ref<Record<string, string>>({});

function fieldLabel(key: string) { return fieldLabels.value[key] || key; }

const filters = reactive({
  status: null as number | null,
  keyword: '',
  date: null as [string, string] | null,
});

const statusTags: Record<number, string> = { 0: 'warning', 1: '', 2: 'primary', 3: '', 4: 'success', 5: 'info' };
function statusTag(s: number) { return statusTags[s] ?? 'info'; }

function fmt(d: string) { return (d ?? '').slice(0, 10); }
function maskPhone(p: string) { return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(7) : p; }

const nextStatusMap: Record<number, { value: number; label: string; type: any }[]> = {
  0: [{ value: 1, label: '→ 已确认', type: '' }, { value: 5, label: '取消订单', type: 'danger' }],
  1: [{ value: 2, label: '→ 修图中', type: 'primary' }, { value: 5, label: '取消订单', type: 'danger' }],
  2: [{ value: 3, label: '→ 待交付', type: 'success' }, { value: 5, label: '取消订单', type: 'danger' }],
  3: [{ value: 4, label: '→ 已完成', type: 'success' }],
};
function nextStatuses(s: number) { return nextStatusMap[s] ?? []; }

async function fetchOrders() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: 20 };
    if (filters.status !== null) params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.date) { params.dateFrom = filters.date[0]; params.dateTo = filters.date[1]; }
    const res = await api.get('/admin/orders', { params });
    orders.value = res.data.data.list;
    total.value = res.data.data.total;
  } catch {
    ElMessage.error('加载订单失败');
  } finally {
    loading.value = false;
  }
}

function openDetail(row: Order) {
  detail.value = row;
  drawer.value = true;
}

async function changeStatus(orderId: string, newStatus: number) {
  const label = { 1: '已确认', 2: '修图中', 3: '待交付', 4: '已完成', 5: '取消' }[newStatus] ?? '';
  try {
    await ElMessageBox.confirm(`确认将订单状态改为「${label}」？`, '确认操作', { type: 'warning' });
  } catch { return; }

  try {
    await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
    ElMessage.success('状态更新成功');
    drawer.value = false;
    fetchOrders();
  } catch {
    ElMessage.error('操作失败');
  }
}

async function fetchLabels() {
  try {
    const res = await api.get('/admin/config');
    const fields = res.data.data?.bookingFormFields ?? [];
    const map: Record<string, string> = {};
    fields.forEach((f: any) => { map[f.key] = f.label; });
    fieldLabels.value = map;
  } catch { /* ignore */ }
}

onMounted(() => { fetchOrders(); fetchLabels(); });
</script>

<style>
.ot h3 { margin-bottom: 16px; }
.of { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.otb { margin-bottom: 16px; }
.opg { display: flex; justify-content: center; }
.oact { margin-top: 16px; }
</style>
