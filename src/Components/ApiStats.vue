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
                <div class="text-sm mt-1" :class="deltaClass(requestsDelta, false)">
                    {{ deltaText(requestsDelta) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500">
                    Today: {{ formatNumber(summary?.today.requests) }}
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Unique Users (IPs)</div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ formatNumber(summary?.totals.unique_ips) }}
                </div>
                <div class="text-sm mt-1" :class="deltaClass(ipsDelta, false)">
                    {{ deltaText(ipsDelta) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500">
                    Today: {{ formatNumber(summary?.today.unique_ips) }}
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Avg Response Time</div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ summary?.totals.avg_response_time_ms ?? 0 }} ms
                </div>
                <div class="text-sm mt-1" :class="deltaClass(avgMsDelta, true)">
                    {{ deltaText(avgMsDelta) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500">
                    Today: {{ summary?.today.avg_response_time_ms ?? 0 }} ms
                </div>
            </div>
            <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">Errors</div>
                <div class="text-2xl font-bold" :class="(summary?.totals.total_errors ?? 0) > 0 ? 'text-red-500' : 'text-green-500'">
                    {{ formatNumber(summary?.totals.total_errors) }}
                </div>
                <div class="text-sm mt-1" :class="deltaClass(errorsDelta, true)">
                    {{ deltaText(errorsDelta) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500">
                    Today: {{ summary?.today.errors ?? 0 }}
                </div>
            </div>
        </div>

        <!-- Traffic groups -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div v-for="group in groupCards" :key="group.key"
                class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="flex items-center justify-between mb-1">
                    <div class="text-surface-500 dark:text-surface-400 text-sm font-medium">{{ group.label }}</div>
                    <Tag :value="group.share" severity="secondary" />
                </div>
                <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                    {{ formatNumber(group.requests) }}
                </div>
                <div class="text-sm text-surface-400 dark:text-surface-500">
                    {{ formatNumber(group.errors) }} errors · avg {{ group.avgMs }} ms
                </div>
            </div>
        </div>

        <!-- Daily requests chart -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Daily Activity</h3>
                <div class="flex items-center gap-3">
                    <SelectButton v-if="chartMetric === 'requests'" v-model="splitByGroup"
                        :options="splitOptions" optionLabel="label" optionValue="value" size="small" />
                    <SelectButton v-model="chartMetric" :options="chartMetricOptions" optionLabel="label"
                        optionValue="value" size="small" />
                </div>
            </div>
            <Chart v-if="chartData.labels.length" type="line" :data="chartData" :options="chartOptions"
                class="h-[300px]" />
            <div v-else class="h-[300px] flex items-center justify-center text-surface-400">
                No data for the selected period
            </div>
        </div>

        <!-- Top endpoints -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Top Endpoints</h3>
                <div class="flex items-center gap-3">
                    <Select v-model="topGroupFilter" :options="groupFilterOptions" optionLabel="label"
                        optionValue="value" size="small" class="w-36" />
                    <InputText v-model="topEndpointFilter" placeholder="Filter by endpoint" size="small"
                        class="w-56" />
                </div>
            </div>
            <DataTable :value="filteredTopEndpoints" stripedRows size="small">
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
                <template #footer>
                    <div class="flex items-center gap-4 text-sm">
                        <span>Total: <b>{{ formatNumber(topEndpointsTotals.requests) }}</b> requests</span>
                        <span :class="topEndpointsTotals.errors > 0 ? 'text-red-500' : ''">
                            {{ formatNumber(topEndpointsTotals.errors) }} errors
                            ({{ topEndpointsTotals.errorRate }}%)
                        </span>
                        <span>across {{ filteredTopEndpoints.length }} endpoints</span>
                    </div>
                </template>
                <template #empty>No endpoints match the filters</template>
            </DataTable>
        </div>

        <!-- Slow endpoints -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">Slowest Endpoints</h3>
            <p class="text-sm text-surface-400 dark:text-surface-500 mb-4">
                Avg and max response time over the last 14 days, endpoints with at least 10 requests
            </p>
            <DataTable :value="summary?.slow_endpoints ?? []" stripedRows size="small">
                <Column field="endpoint" header="Endpoint" />
                <Column field="requests" header="Requests" sortable>
                    <template #body="{ data }">{{ formatNumber(data.requests) }}</template>
                </Column>
                <Column field="avg_response_time_ms" header="Avg ms" sortable>
                    <template #body="{ data }">
                        <span :class="data.avg_response_time_ms >= 1000 ? 'text-red-500 font-semibold' : ''">
                            {{ data.avg_response_time_ms }}
                        </span>
                    </template>
                </Column>
                <Column field="max_response_time_ms" header="Max ms" sortable />
                <template #empty>No endpoints with enough requests in the last 14 days</template>
            </DataTable>
        </div>

        <!-- Recent requests -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Recent Requests</h3>
                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" text size="small"
                    @click="fetchRecent" :loading="recentLoading" />
            </div>
            <div class="flex flex-wrap items-center gap-3 mb-4">
                <InputText v-model="recentFilters.endpoint" placeholder="Endpoint contains" size="small"
                    class="w-52" />
                <Select v-model="recentFilters.status" :options="statusFilterOptions" optionLabel="label"
                    optionValue="value" placeholder="Status" size="small" class="w-32" />
                <Select v-model="recentFilters.method" :options="methodFilterOptions" optionLabel="label"
                    optionValue="value" placeholder="Method" size="small" class="w-32" />
                <InputText v-model="recentFilters.client_ip" placeholder="IP contains" size="small" class="w-40" />
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
                <template #empty>No requests match the filters</template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { adminApiService } from '../services/api'
import type { StatsSummaryResponse, RecentRequestRow, StatsGroupKey } from '../types/api'

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

type ChartMetric = 'requests' | 'unique_ips' | 'errors' | 'avg_response_time_ms'
const chartMetricOptions: { label: string; value: ChartMetric }[] = [
    { label: 'Requests', value: 'requests' },
    { label: 'Unique IPs', value: 'unique_ips' },
    { label: 'Errors', value: 'errors' },
    { label: 'Avg ms', value: 'avg_response_time_ms' },
]
const chartMetric = ref<ChartMetric>('requests')
const splitByGroup = ref(false)
const splitOptions = [
    { label: 'Total', value: false },
    { label: 'Scripture / AI', value: true },
]

const topGroupFilter = ref<'all' | StatsGroupKey>('all')
const groupFilterOptions: { label: string; value: 'all' | StatsGroupKey }[] = [
    { label: 'All groups', value: 'all' },
    { label: 'Scripture', value: 'scripture' },
    { label: 'AI', value: 'ai' },
    { label: 'Other', value: 'other' },
]
const topEndpointFilter = ref('')

const recentFilters = ref({
    endpoint: '',
    status: '' as '' | '2xx' | '4xx' | '5xx',
    method: '' as '' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    client_ip: '',
})
const statusFilterOptions = [
    { label: '2xx', value: '2xx' as const },
    { label: '4xx', value: '4xx' as const },
    { label: '5xx', value: '5xx' as const },
]
const methodFilterOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ label: m, value: m }))

const metricColors: Record<ChartMetric, string> = {
    requests: '#f59e0b',
    unique_ips: '#3b82f6',
    errors: '#ef4444',
    avg_response_time_ms: '#8b5cf6',
}

function endpointGroup(endpoint: string): StatsGroupKey {
    if (endpoint.startsWith('/api/ai/')) return 'ai'
    if (endpoint.startsWith('/api/')) return 'scripture'
    return 'other'
}

const groupCards = computed(() => {
    const groups = summary.value?.groups
    const total = groups ? groups.scripture.requests + groups.ai.requests + groups.other.requests : 0
    const defs: { key: StatsGroupKey; label: string }[] = [
        { key: 'scripture', label: 'Scripture' },
        { key: 'ai', label: 'AI' },
        { key: 'other', label: 'Other' },
    ]
    return defs.map(({ key, label }) => {
        const g = groups?.[key] ?? { requests: 0, errors: 0, avg_response_time_ms: 0 }
        return {
            key,
            label,
            requests: g.requests,
            errors: g.errors,
            avgMs: g.avg_response_time_ms,
            share: total > 0 ? `${Math.round((g.requests / total) * 100)}%` : '0%',
        }
    })
})

const chartData = computed(() => {
    const daily = summary.value?.daily ?? []
    if (chartMetric.value === 'requests' && splitByGroup.value) {
        const rows = summary.value?.daily_groups ?? []
        const scripture: Record<string, number> = {}
        const ai: Record<string, number> = {}
        for (const r of rows) {
            if (r.grp === 'scripture') scripture[r.date] = r.requests
            if (r.grp === 'ai') ai[r.date] = r.requests
        }
        return {
            labels: daily.map(d => d.date),
            datasets: [
                {
                    label: 'Scripture',
                    data: daily.map(d => scripture[d.date] ?? 0),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'AI',
                    data: daily.map(d => ai[d.date] ?? 0),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3,
                },
            ],
        }
    }
    const metric = chartMetric.value
    return {
        labels: daily.map(d => d.date),
        datasets: [
            {
                label: chartMetricOptions.find(o => o.value === metric)?.label ?? metric,
                data: daily.map(d => d[metric]),
                borderColor: metricColors[metric],
                backgroundColor: `${metricColors[metric]}1a`,
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

const filteredTopEndpoints = computed(() => {
    const endpoints = summary.value?.top_endpoints ?? []
    const needle = topEndpointFilter.value.trim().toLowerCase()
    return endpoints.filter(row => {
        if (topGroupFilter.value !== 'all' && endpointGroup(row.endpoint) !== topGroupFilter.value) return false
        if (needle && !row.endpoint.toLowerCase().includes(needle)) return false
        return true
    })
})

const topEndpointsTotals = computed(() => {
    const requests = filteredTopEndpoints.value.reduce((sum, r) => sum + r.requests, 0)
    const errors = filteredTopEndpoints.value.reduce((sum, r) => sum + r.errors, 0)
    return {
        requests,
        errors,
        errorRate: requests > 0 ? ((errors / requests) * 100).toFixed(1) : '0.0',
    }
})

// Trend deltas against the previous period of the same length
type Delta = { current: number; previous: number | null } | null

function computeDelta(current: number, previous: number | null | undefined): Delta {
    if (previous == null) return null
    return { current, previous }
}

const requestsDelta = computed(() =>
    summary.value ? computeDelta(summary.value.totals.total_requests, summary.value.previous_totals.total_requests) : null)
const errorsDelta = computed(() =>
    summary.value ? computeDelta(summary.value.totals.total_errors, summary.value.previous_totals.total_errors) : null)
const ipsDelta = computed(() =>
    summary.value ? computeDelta(summary.value.totals.unique_ips, summary.value.previous_totals.unique_ips) : null)
const avgMsDelta = computed(() =>
    summary.value ? computeDelta(summary.value.totals.avg_response_time_ms, summary.value.previous_totals.avg_response_time_ms) : null)

function deltaText(delta: Delta): string {
    if (!delta || !summary.value) return ''
    const period = summary.value.period_days
    if (delta.previous === 0) {
        return delta.current > 0 ? `vs previous ${period}d: new` : `vs previous ${period}d: —`
    }
    const pct = ((delta.current - delta.previous) / delta.previous) * 100
    const arrow = pct >= 0 ? '▲' : '▼'
    return `vs previous ${period}d: ${arrow} ${Math.abs(pct).toFixed(0)}%`
}

function deltaClass(delta: Delta, invertColors = false): string {
    if (!delta || delta.previous === 0) return 'text-surface-400 dark:text-surface-500'
    const up = delta.current >= delta.previous
    const bad = invertColors ? up : false
    const good = invertColors ? !up : up
    if (bad) return 'text-red-500'
    if (good) return invertColors ? 'text-green-500' : 'text-surface-400 dark:text-surface-500'
    return 'text-surface-400 dark:text-surface-500'
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
        const f = recentFilters.value
        const res = await adminApiService.getRecentRequests(100, {
            endpoint: f.endpoint.trim() || undefined,
            status: f.status || undefined,
            method: f.method || undefined,
            client_ip: f.client_ip.trim() || undefined,
        })
        recentRequests.value = res.items
    } catch (e) {
        console.error('Failed to load recent requests', e)
    } finally {
        recentLoading.value = false
    }
}

let recentFilterTimer: ReturnType<typeof setTimeout> | undefined
watch(recentFilters, () => {
    clearTimeout(recentFilterTimer)
    recentFilterTimer = setTimeout(fetchRecent, 400)
}, { deep: true })

async function fetchAll() {
    await Promise.all([fetchStats(), fetchRecent()])
}

onMounted(fetchAll)
</script>
