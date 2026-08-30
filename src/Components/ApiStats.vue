<template>
    <div class="w-full flex flex-col gap-6">
        <!-- Period selector -->
        <div class="flex items-center gap-3">
            <SelectButton v-model="selectedDays" :options="periodOptions" optionLabel="label" optionValue="value"
                @change="fetchStats" />
            <Button icon="pi pi-refresh" severity="secondary" text rounded @click="fetchAll" :loading="loading" />
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Total Requests</div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ formatNumber(summary?.totals.total_requests) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500 mt-1">
                    Today: {{ formatNumber(summary?.today.requests) }}
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Unique Users (IPs)</div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ formatNumber(summary?.totals.unique_ips) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500 mt-1">
                    Today: {{ formatNumber(summary?.today.unique_ips) }}
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Avg Response Time</div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ summary?.totals.avg_response_time_ms ?? 0 }} ms
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500 mt-1">
                    Today: {{ summary?.today.avg_response_time_ms ?? 0 }} ms
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Errors</div>
                <div class="text-2xl font-bold" :class="(summary?.totals.total_errors ?? 0) > 0 ? 'text-red-500' : 'text-green-500'">
                    {{ formatNumber(summary?.totals.total_errors) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500 mt-1">
                    Today: {{ summary?.today.errors ?? 0 }}
                </div>
            </div>
        </div>

        <!-- Daily requests chart -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Daily Requests</h3>
            <Chart v-if="chartData.labels.length" type="line" :data="chartData" :options="chartOptions"
                class="h-[300px]" />
            <div v-else class="h-[300px] flex items-center justify-center text-surface-400">
                No data for the selected period
            </div>
        </div>

        <!-- Top endpoints -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">Top Endpoints</h3>
            <DataTable :value="summary?.top_endpoints ?? []" stripedRows size="small">
                <Column field="endpoint" header="Endpoint" />
                <Column field="requests" header="Requests" sortable>
                    <template #body="{ data }">{{ formatNumber(data.requests) }}</template>
                </Column>
                <Column field="unique_ips" header="Unique IPs" sortable />
                <Column field="avg_response_time_ms" header="Avg ms" sortable />
                <Column field="errors" header="Errors" sortable>
                    <template #body="{ data }">
                        <span :class="data.errors > 0 ? 'text-red-500 font-semibold' : ''">{{ data.errors }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Recent requests -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Recent Requests</h3>
                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" text size="small"
                    @click="fetchRecent" :loading="recentLoading" />
            </div>
            <DataTable :value="recentRequests" stripedRows size="small" paginator :rows="10"
                :rowsPerPageOptions="[10, 20, 50]">
                <Column field="created_at" header="Time" style="width: 160px">
                    <template #body="{ data }">
                        <span class="text-xs font-mono">{{ formatTime(data.created_at) }}</span>
                    </template>
                </Column>
                <Column field="method" header="Method" style="width: 80px">
                    <template #body="{ data }">
                        <Tag :value="data.method" :severity="data.method === 'GET' ? 'info' : 'warn'" />
                    </template>
                </Column>
                <Column field="endpoint" header="Endpoint" />
                <Column field="status_code" header="Status" style="width: 80px">
                    <template #body="{ data }">
                        <Tag :value="String(data.status_code)"
                            :severity="data.status_code < 400 ? 'success' : 'danger'" />
                    </template>
                </Column>
                <Column field="response_time_ms" header="Time (ms)" style="width: 100px" sortable />
                <Column field="client_ip" header="IP" style="width: 140px">
                    <template #body="{ data }">
                        <span class="text-xs font-mono">{{ data.client_ip }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import { adminApiService } from '../services/api'
import type { StatsSummaryResponse, RecentRequestRow } from '../types/api'

const periodOptions = [
    { label: '7 days', value: 7 },
    { label: '30 days', value: 30 },
    { label: '90 days', value: 90 },
]
const selectedDays = ref(30)
const summary = ref<StatsSummaryResponse | null>(null)
const recentRequests = ref<RecentRequestRow[]>([])
const loading = ref(false)
const recentLoading = ref(false)

const chartData = computed(() => {
    const daily = summary.value?.daily ?? []
    return {
        labels: daily.map(d => d.date),
        datasets: [
            {
                label: 'Requests',
                data: daily.map(d => d.requests),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.3,
            },
            {
                label: 'Unique IPs',
                data: daily.map(d => d.unique_ips),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3,
            },
        ],
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
        legend: { position: 'top' as const },
    },
    scales: {
        y: { beginAtZero: true },
    },
}

function formatNumber(n: number | undefined | null): string {
    if (n == null) return '0'
    return n.toLocaleString()
}

function formatTime(dt: string): string {
    if (!dt) return ''
    // MySQL returns UTC without suffix — append 'Z' so JS parses as UTC
    const d = new Date(dt.replace(' ', 'T') + 'Z')
    return d.toLocaleString('en-GB', {
        month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

async function fetchStats() {
    loading.value = true
    try {
        summary.value = await adminApiService.getStatsSummary(selectedDays.value)
    } catch (e) {
        console.error('Failed to load stats summary', e)
    } finally {
        loading.value = false
    }
}

async function fetchRecent() {
    recentLoading.value = true
    try {
        const res = await adminApiService.getRecentRequests(100)
        recentRequests.value = res.items
    } catch (e) {
        console.error('Failed to load recent requests', e)
    } finally {
        recentLoading.value = false
    }
}

async function fetchAll() {
    await Promise.all([fetchStats(), fetchRecent()])
}

onMounted(fetchAll)
</script>
