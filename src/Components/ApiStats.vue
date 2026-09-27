<template>
    <div class="w-full flex flex-col gap-6">
        <!-- Period selector -->
        <div class="flex flex-wrap items-center gap-3">
            <SelectButton v-model="selectedPreset" :options="presetOptions" optionLabel="label" optionValue="value"
                :allowEmpty="false" aria-label="Statistics period" class="flex flex-wrap" />
            <DatePicker v-if="selectedPreset === 'custom'" v-model="customRange" selectionMode="range"
                :manualInput="false" :maxDate="maxSelectableDate" dateFormat="yy-mm-dd" showIcon placeholder="From — to"
                @show="refreshMaxSelectableDate"
                inputId="stats_custom_range" aria-label="Custom date range" class="w-full sm:w-64" />
            <Button icon="pi pi-refresh" severity="secondary" text rounded aria-label="Refresh statistics"
                @click="fetchAll" :loading="loading" />
        </div>
        <p v-if="rangeError" role="alert" class="text-sm text-red-600 dark:text-red-400">{{ rangeError }}</p>
        <p v-else-if="awaitingCustomRange" class="text-sm text-surface-600 dark:text-surface-300">
            Pick a start and an end date to load statistics for a custom range.
        </p>
        <p class="text-xs text-surface-500">Production daily statistics use UTC calendar days; local development uses Moscow days. Production dates before the cut-over keep historical Moscow-day boundaries.</p>

        <div v-if="statsError" role="alert"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <span>{{ statsError }}</span>
            <Button label="Retry" icon="pi pi-refresh" severity="danger" outlined size="small"
                @click="fetchPeriodData" :loading="loading" />
        </div>

        <template v-if="summary">

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div v-for="card in cards" :key="card.key"
                class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
                <div class="text-surface-500 dark:text-surface-400 text-sm font-medium mb-1">{{ card.label }}</div>
                <div class="text-2xl font-bold" :class="card.valueClass">{{ card.value }}</div>
                <div class="text-sm mt-1" :class="toneClass[card.delta.tone]">{{ card.delta.text }}</div>
                <div v-if="card.note" class="text-xs text-surface-400 dark:text-surface-500 mt-1">{{ card.note }}</div>
            </div>
        </div>

        <!-- Application breakdown -->
        <div class="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-surface-200 bg-surface-0 px-5 py-3 text-sm dark:border-surface-700 dark:bg-surface-800"
            aria-label="Requests by application">
            <span v-for="app in visibleApplications" :key="app.application" class="text-surface-500 dark:text-surface-400">
                <span class="font-medium text-surface-900 dark:text-surface-0">{{ applicationLabel(app.application) }}</span>
                {{ formatNumber(app.requests) }} {{ app.requests === 1 ? 'request' : 'requests' }} ·
                <span :class="(app.server_errors ?? 0) > 0 ? 'text-red-500 font-semibold' : ''">{{ formatCount(app.server_errors) }} 5xx</span>
            </span>
        </div>

        <!-- Activity chart -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex flex-col items-stretch gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
                    {{ summary.period.bucket === 'hour' ? 'Hourly Activity' : 'Daily Activity' }}
                </h3>
                <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                    <SelectButton v-if="chartMetric === 'requests'" v-model="splitByGroup"
                        :options="splitOptions" optionLabel="label" optionValue="value" size="small"
                        :allowEmpty="false" aria-label="Chart traffic groups" class="flex w-full flex-wrap sm:w-auto" />
                    <SelectButton v-model="chartMetric" :options="chartMetricOptions" optionLabel="label"
                        optionValue="value" size="small" :allowEmpty="false" aria-label="Chart metric"
                        class="flex w-full flex-wrap sm:w-auto" />
                </div>
            </div>
            <Chart v-if="chartData.labels.length" type="line" :data="chartData" :options="chartOptions"
                class="h-[300px]" />
            <div v-else class="h-[300px] flex items-center justify-center text-surface-400">
                No data for the selected period
            </div>
        </div>
        </template>

        <!-- Errors and degradations -->
        <div v-if="!awaitingCustomRange && !rangeError" class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-3 sm:p-5">
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">Errors</h3>
            <div v-if="errorsError" role="alert"
                class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <span>{{ errorsError }}</span>
                <Button label="Retry" icon="pi pi-refresh" severity="danger" outlined size="small"
                    @click="fetchErrors" :loading="errorsLoading" />
            </div>
            <template v-else-if="errorsData">
                <p v-if="errorsCoverageNote" class="mb-3 text-sm text-amber-700 dark:text-amber-400">{{ errorsCoverageNote }}</p>
                <!-- On phones the endpoint is stacked under the code/reason so the table fits without scrolling -->
                <DataTable :value="errorsData.errors" stripedRows size="small">
                    <Column field="status_code" header="Code" headerClass="w-20">
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <Tag :value="String(data.status_code)" :severity="data.status_code >= 500 ? 'danger' : 'secondary'" />
                                <span class="text-xs text-surface-500 sm:hidden">{{ data.method }}</span>
                            </div>
                            <div class="mt-1 break-all text-xs sm:hidden">{{ data.endpoint }}</div>
                        </template>
                    </Column>
                    <Column field="method" header="Method" headerClass="hidden sm:table-cell w-20" bodyClass="hidden sm:table-cell" />
                    <Column field="endpoint" header="Endpoint" headerClass="hidden sm:table-cell" bodyClass="hidden sm:table-cell break-all" />
                    <Column field="count" header="Count" headerClass="w-16">
                        <template #body="{ data }">{{ formatNumber(data.count) }}</template>
                    </Column>
                    <Column field="last_seen" header="Last seen" headerClass="w-28">
                        <template #body="{ data }">
                            <span class="whitespace-nowrap text-xs" :title="formatTime(data.last_seen)">{{ formatShortTime(data.last_seen) }}</span>
                        </template>
                    </Column>
                    <template #empty>No errors in the selected period</template>
                </DataTable>

                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mt-6 mb-3">Degradations</h3>
                <DataTable :value="errorsData.degradations" stripedRows size="small">
                    <Column field="reason" header="Reason">
                        <template #body="{ data }">
                            <Tag :value="data.reason" severity="warn" class="max-w-full break-all" />
                            <div class="mt-1 break-all text-xs sm:hidden">{{ data.endpoint }}</div>
                        </template>
                    </Column>
                    <Column field="endpoint" header="Endpoint" headerClass="hidden sm:table-cell" bodyClass="hidden sm:table-cell break-all" />
                    <Column field="count" header="Count" headerClass="w-16">
                        <template #body="{ data }">{{ formatNumber(data.count) }}</template>
                    </Column>
                    <Column field="last_seen" header="Last seen" headerClass="w-28">
                        <template #body="{ data }">
                            <span class="whitespace-nowrap text-xs" :title="formatTime(data.last_seen)">{{ formatShortTime(data.last_seen) }}</span>
                        </template>
                    </Column>
                    <template #empty>No degradations in the selected period</template>
                </DataTable>
            </template>
        </div>

        <!-- Recent requests -->
        <div class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-5">
            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">Recent Requests</h3>
                <Button label="Refresh" icon="pi pi-refresh" severity="secondary" text size="small"
                    @click="fetchRecent" :loading="recentLoading" />
            </div>
            <div class="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:items-center">
                <InputText v-model="recentFilters.endpoint" placeholder="Endpoint contains" size="small"
                    name="recent_endpoint" aria-label="Filter recent requests by endpoint"
                    class="w-full sm:w-52" />
                <Select v-model="recentFilters.status" :options="statusFilterOptions" optionLabel="label"
                    optionValue="value" placeholder="Status" size="small" showClear name="recent_status"
                    aria-label="Filter recent requests by status" class="w-full sm:w-32" />
                <Select v-model="recentFilters.method" :options="methodFilterOptions" optionLabel="label"
                    optionValue="value" placeholder="Method" size="small" showClear name="recent_method"
                    aria-label="Filter recent requests by method" class="w-full sm:w-32" />
                <Select v-model="recentFilters.application" :options="applicationFilterOptions" optionLabel="label"
                    optionValue="value" placeholder="Application" size="small" showClear name="recent_application"
                    aria-label="Filter recent requests by application" class="w-full sm:w-40" />
                <InputText v-model="recentFilters.client_pseudonym" placeholder="Client ID prefix" size="small"
                    name="recent_client_pseudonym" aria-label="Filter recent requests by client pseudonym prefix"
                    maxlength="40" class="w-full sm:w-44" />
            </div>
            <p class="mb-2 text-xs text-surface-500">Times use your browser's zone.</p>
            <div v-if="recentError" role="alert"
                class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <span>{{ recentError }}</span>
                <Button label="Retry" icon="pi pi-refresh" severity="danger" outlined size="small"
                    @click="fetchRecent" :loading="recentLoading" />
            </div>
            <DataTable v-else :value="recentRequests" stripedRows size="small" paginator :rows="10"
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
                <Column field="application" header="Application">
                    <template #body="{ data }">{{ applicationLabel(data.application) }}</template>
                </Column>
                <Column field="status_code" header="Status">
                    <template #body="{ data }">
                        <div class="flex flex-wrap items-center gap-1">
                            <Tag :value="String(data.status_code)"
                                :severity="data.status_code < 400 ? 'success' : 'danger'" />
                            <Tag v-if="data.degraded_reason" :value="data.degraded_reason" severity="warn"
                                :title="`Degraded: ${data.degraded_reason}`" />
                        </div>
                    </template>
                </Column>
                <Column field="response_time_ms" header="Time (ms)" style="width: 100px" sortable />
                <Column field="client_pseudonym" header="Client" style="width: 140px">
                    <template #body="{ data }">
                        <span class="text-xs font-mono" :title="data.client_pseudonym">{{ data.client_pseudonym.slice(0, 8) }}</span>
                    </template>
                </Column>
                <template #empty>No requests match the filters</template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'
import { adminApiService } from '../services/api'
import { parseServerTimestamp } from '../utils/serverTime'
import { validationDetail } from '../utils/apiError'
import {
    customRangePeriod,
    formatDelta,
    averageOrNull,
    hourTickLabels,
    lastDaysPeriod,
    utcTodayAsLocalDate,
    periodLengthLabel,
    periodToParams,
    type DeltaTone,
    type DeltaView,
    type StatsPeriod,
} from '../utils/statsPeriod'
import type {
    StatsSummaryResponse,
    StatsErrorsResponse,
    StatsTotals,
    RecentRequestRow,
    StatsApplicationKey,
} from '../types/api'

type Preset = '24h' | '7d' | '30d' | '90d' | 'custom'
const presetOptions: { label: string; value: Preset }[] = [
    { label: '24 hours', value: '24h' },
    { label: '7 days', value: '7d' },
    { label: '30 days', value: '30d' },
    { label: '90 days', value: '90d' },
    { label: 'Custom', value: 'custom' },
]
const presetDays: Record<Exclude<Preset, '24h' | 'custom'>, number> = { '7d': 7, '30d': 30, '90d': 90 }
const selectedPreset = ref<Preset>('24h')
const customRange = ref<(Date | null)[] | null>(null)
const rangeError = ref<string | null>(null)
// The API refuses dates after its today (UTC on prod); recomputed so a tab left open past midnight stays valid.
const maxSelectableDate = ref(utcTodayAsLocalDate(new Date()))
function refreshMaxSelectableDate() {
    maxSelectableDate.value = utcTodayAsLocalDate(new Date())
}

const awaitingCustomRange = computed(() =>
    selectedPreset.value === 'custom' && !(customRange.value?.[0] && customRange.value?.[1]))
const summary = ref<StatsSummaryResponse | null>(null)
// Period the displayed summary was loaded for; comparison labels follow it, not the selector.
const summaryPeriod = ref<StatsPeriod | null>(null)
const errorsData = ref<StatsErrorsResponse | null>(null)
const recentRequests = ref<RecentRequestRow[]>([])
const loading = ref(false)
const statsError = ref<string | null>(null)
const errorsLoading = ref(false)
const errorsError = ref<string | null>(null)
const recentLoading = ref(false)
const recentError = ref<string | null>(null)

type ChartMetric = 'requests' | 'unique_clients' | 'server_errors' | 'degraded' | 'avg_response_time_ms'
const chartMetricOptions: { label: string; value: ChartMetric }[] = [
    { label: 'Requests', value: 'requests' },
    { label: 'Unique clients', value: 'unique_clients' },
    { label: '5xx', value: 'server_errors' },
    { label: 'Degradations', value: 'degraded' },
    { label: 'Avg ms', value: 'avg_response_time_ms' },
]
const chartMetric = ref<ChartMetric>('requests')
const splitByGroup = ref(false)
const splitOptions = [
    { label: 'Total', value: false },
    { label: 'Scripture / AI', value: true },
]

const recentFilters = ref({
    endpoint: '',
    status: '' as '' | '2xx' | '4xx' | '5xx',
    method: '' as '' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    client_pseudonym: '',
    application: '' as '' | StatsApplicationKey,
})
const statusFilterOptions = [
    { label: '2xx', value: '2xx' as const },
    { label: '4xx', value: '4xx' as const },
    { label: '5xx', value: '5xx' as const },
]
const methodFilterOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ label: m, value: m }))
const applicationFilterOptions: { label: string; value: StatsApplicationKey }[] = [
    { label: 'Bible Garden', value: 'bible-garden' },
    { label: 'Lampada', value: 'lampada' },
    { label: 'Ops', value: 'ops' },
    { label: 'Unknown (legacy)', value: 'unknown' },
]

function applicationLabel(application: StatsApplicationKey): string {
    const label = applicationFilterOptions.find(option => option.value === application)?.label
    if (!label) throw new Error(`Unknown request application: ${application}`)
    return label
}

const toneClass: Record<DeltaTone, string> = {
    neutral: 'text-surface-400 dark:text-surface-500',
    good: 'text-green-500',
    bad: 'text-red-500',
}

const metricColors: Record<ChartMetric, string> = {
    requests: '#f59e0b',
    unique_clients: '#3b82f6',
    server_errors: '#ef4444',
    degraded: '#d97706',
    avg_response_time_ms: '#8b5cf6',
}

interface CardView {
    key: keyof StatsTotals
    label: string
    value: string
    valueClass: string
    delta: DeltaView
    note: string | null
}

// Set by the API only when the period starts before the data behind a number.
function sinceNote(since: string | null): string | null {
    return since === null ? null : `Counted since ${since}`
}

const cards = computed<CardView[]>(() => {
    const s = summary.value
    const period = summaryPeriod.value
    if (!s || !period) return []
    const length = periodLengthLabel(period)
    const t = s.totals
    const p = s.previous
    const rawSince = s.coverage.raw_since === null ? null : formatTime(s.coverage.raw_since)
    // In hours mode every number comes from raw rows; in date mode only unique clients do.
    const rawNote = sinceNote(rawSince)
    const hoursRawNote = s.period.mode === 'hours' ? rawNote : null
    const plain = 'text-surface-900 dark:text-surface-0'
    const muted = 'text-surface-400 dark:text-surface-500'
    const avgMs = averageOrNull(t.avg_response_time_ms, t.requests)
    return [
        {
            key: 'requests', label: 'Requests', value: formatNumber(t.requests), valueClass: plain,
            delta: formatDelta(t.requests, p.requests, length, false), note: hoursRawNote,
        },
        {
            key: 'unique_clients', label: 'Unique clients (by IP)', value: formatCount(t.unique_clients),
            valueClass: t.unique_clients === null ? muted : plain,
            delta: formatDelta(t.unique_clients, p.unique_clients, length, false),
            note: t.unique_clients === null ? 'Not available: the range is older than the raw request log' : rawNote,
        },
        {
            key: 'server_errors', label: 'Server errors (5xx)', value: formatCount(t.server_errors),
            valueClass: countClass(t.server_errors, 'text-red-500'),
            delta: formatDelta(t.server_errors, p.server_errors, length, true),
            note: failureNote(t.server_errors, s.coverage.server_errors_since, hoursRawNote),
        },
        {
            key: 'degraded', label: 'AI degradations', value: formatCount(t.degraded),
            valueClass: countClass(t.degraded, 'text-amber-500'),
            delta: formatDelta(t.degraded, p.degraded, length, true),
            note: failureNote(t.degraded, s.coverage.degraded_since, hoursRawNote),
        },
        {
            key: 'avg_response_time_ms', label: 'Response time (avg)',
            value: avgMs === null ? 'n/a' : `${formatNumber(avgMs)} ms`,
            valueClass: avgMs === null ? muted : plain,
            delta: formatDelta(avgMs, averageOrNull(p.avg_response_time_ms, p.requests), length, true),
            note: hoursRawNote,
        },
    ]
})

function failureNote(value: number | null, since: string | null, rawNote: string | null): string | null {
    if (value === null) return 'Not counted for these days'
    return sinceNote(since) ?? rawNote
}

function countClass(value: number | null, positiveClass: string): string {
    if (value === null) return 'text-surface-400 dark:text-surface-500'
    return value > 0 ? positiveClass : 'text-green-500'
}

const visibleApplications = computed(() =>
    (summary.value?.applications ?? []).filter(app => app.application !== 'unknown' || app.requests > 0))

const errorsCoverageNote = computed(() => {
    const data = errorsData.value
    if (!data?.partial) return null
    if (data.raw_available_from === null) return 'No raw request log is stored, so errors and degradations cannot be listed.'
    return `Raw request log starts at ${formatTime(data.raw_available_from)}; earlier errors and degradations are not listed.`
})

const isHourly = computed(() => summary.value?.period.bucket === 'hour')

// Full bucket names for tooltips; the axis shows the short tick labels.
const chartLabels = computed(() => {
    const series = summary.value?.series ?? []
    if (!isHourly.value) return series.map(row => row.bucket_start)
    return series.map(row => parseServerTimestamp(row.bucket_start).toLocaleString('en-GB', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }))
})

const hourTicks = computed(() => isHourly.value
    ? hourTickLabels((summary.value?.series ?? []).map(row => parseServerTimestamp(row.bucket_start)))
    : [])

const chartData = computed(() => {
    const series = summary.value?.series ?? []
    const labels = chartLabels.value
    if (chartMetric.value === 'requests' && splitByGroup.value) {
        return {
            labels,
            datasets: [
                {
                    label: 'Scripture',
                    data: series.map(row => row.scripture_requests),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.3,
                },
                {
                    label: 'AI',
                    data: series.map(row => row.ai_requests),
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
        labels,
        datasets: [
            {
                label: chartMetricOptions.find(o => o.value === metric)?.label ?? metric,
                data: series.map(row => row[metric]),
                borderColor: metricColors[metric],
                backgroundColor: `${metricColors[metric]}1a`,
                fill: true,
                tension: 0.3,
            },
        ],
    }
})

const chartOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
        legend: { position: 'top' as const },
    },
    scales: {
        x: isHourly.value
            ? {
                ticks: {
                    autoSkip: false,
                    maxRotation: 0,
                    callback: (_value: unknown, index: number) => hourTicks.value[index],
                },
            }
            : { ticks: { maxRotation: 0 } },
        y: { beginAtZero: true },
    },
}))

function formatNumber(n: number): string {
    return n.toLocaleString()
}

// Failure counters are null for days aggregated before they were introduced.
function formatCount(n: number | null): string {
    return n === null ? '—' : formatNumber(n)
}

function formatShortTime(dt: string): string {
    return parseServerTimestamp(dt).toLocaleString('en-GB', {
        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
    })
}

function formatTime(dt: string): string {
    const d = parseServerTimestamp(dt)
    return d.toLocaleString('en-GB', {
        month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
}

const totalsKeys: (keyof StatsTotals)[] = [
    'requests', 'unique_clients', 'server_errors', 'client_errors', 'degraded', 'avg_response_time_ms',
]
const requiredTotalsKeys: (keyof StatsTotals)[] = ['requests', 'avg_response_time_ms']

function isCount(value: unknown): boolean {
    return value === null || typeof value === 'number'
}

function isStatsSummaryResponse(response: StatsSummaryResponse): boolean {
    const bucket = response.period?.bucket
    return (bucket === 'hour' || bucket === 'day')
        && requiredTotalsKeys.every(key => typeof response.totals?.[key] === 'number')
        && totalsKeys.every(key => isCount(response.totals?.[key]) && isCount(response.previous?.[key]))
        && response.coverage !== undefined
        && response.coverage.raw_since !== undefined
        && Array.isArray(response.applications)
        && response.applications.every(app => applicationFilterOptions.some(option => option.value === app.application))
        && Array.isArray(response.series)
}

function isStatsErrorsResponse(response: StatsErrorsResponse): boolean {
    return typeof response.partial === 'boolean'
        && Array.isArray(response.errors)
        && Array.isArray(response.degradations)
}

/** The selected period, or null while a custom range is incomplete or invalid. */
function resolvePeriod(): StatsPeriod | null {
    rangeError.value = null
    refreshMaxSelectableDate()
    const preset = selectedPreset.value
    if (preset === '24h') return { mode: 'hours', hours: 24 }
    if (preset !== 'custom') return lastDaysPeriod(presetDays[preset], new Date())
    try {
        return customRangePeriod(customRange.value)
    } catch (e) {
        rangeError.value = e instanceof Error ? e.message : String(e)
        return null
    }
}

async function fetchStats(period: StatsPeriod) {
    const requestSequence = ++statsRequestSequence
    loading.value = true
    statsError.value = null
    try {
        const response = await adminApiService.getStatsSummary(periodToParams(period))
        if (requestSequence !== statsRequestSequence) return
        if (!isStatsSummaryResponse(response)) {
            throw new Error('Stats summary API response is missing required fields')
        }
        summary.value = response
        summaryPeriod.value = period
    } catch (e) {
        if (requestSequence !== statsRequestSequence) return
        console.error('Failed to load stats summary', e)
        summary.value = null
        summaryPeriod.value = null
        const detail = validationDetail(e)
        statsError.value = detail
            ? `The API rejected the period: ${detail}`
            : 'Failed to load statistics. The API response is incompatible or unavailable.'
    } finally {
        if (requestSequence === statsRequestSequence) loading.value = false
    }
}

async function fetchErrorsFor(period: StatsPeriod) {
    const requestSequence = ++errorsRequestSequence
    errorsLoading.value = true
    errorsError.value = null
    try {
        const response = await adminApiService.getStatsErrors(periodToParams(period))
        if (requestSequence !== errorsRequestSequence) return
        if (!isStatsErrorsResponse(response)) {
            throw new Error('Stats errors API response is missing required fields')
        }
        errorsData.value = response
    } catch (e) {
        if (requestSequence !== errorsRequestSequence) return
        console.error('Failed to load stats errors', e)
        errorsData.value = null
        const detail = validationDetail(e)
        errorsError.value = detail
            ? `The API rejected the period: ${detail}`
            : 'Failed to load errors and degradations.'
    } finally {
        if (requestSequence === errorsRequestSequence) errorsLoading.value = false
    }
}

async function fetchErrors() {
    const period = resolvePeriod()
    if (period) await fetchErrorsFor(period)
}

// Drops data of a previous period and cancels its pending requests.
function clearPeriodData() {
    statsRequestSequence++
    errorsRequestSequence++
    summary.value = null
    summaryPeriod.value = null
    errorsData.value = null
    statsError.value = null
    errorsError.value = null
    loading.value = false
    errorsLoading.value = false
}

async function fetchPeriodData() {
    const period = resolvePeriod()
    if (!period) {
        clearPeriodData()
        return
    }
    await Promise.all([fetchStats(period), fetchErrorsFor(period)])
}

async function fetchRecent() {
    const requestSequence = ++recentRequestSequence
    recentLoading.value = true
    recentError.value = null
    try {
        const f = recentFilters.value
        const res = await adminApiService.getRecentRequests(100, {
            endpoint: f.endpoint.trim() || undefined,
            status: f.status || undefined,
            method: f.method || undefined,
            client_pseudonym: f.client_pseudonym.trim() || undefined,
            application: f.application || undefined,
        })
        if (requestSequence !== recentRequestSequence) return
        recentRequests.value = res.items
    } catch (e) {
        if (requestSequence !== recentRequestSequence) return
        console.error('Failed to load recent requests', e)
        recentRequests.value = []
        recentError.value = 'Failed to load recent requests.'
    } finally {
        if (requestSequence === recentRequestSequence) recentLoading.value = false
    }
}

let recentFilterTimer: ReturnType<typeof setTimeout> | undefined
let statsRequestSequence = 0
let errorsRequestSequence = 0
let recentRequestSequence = 0
watch(recentFilters, () => {
    clearTimeout(recentFilterTimer)
    recentFilterTimer = setTimeout(fetchRecent, 400)
}, { deep: true })
watch([selectedPreset, customRange], fetchPeriodData)

async function fetchAll() {
    await Promise.all([fetchPeriodData(), fetchRecent()])
}

onMounted(fetchAll)
onUnmounted(() => {
    clearTimeout(recentFilterTimer)
    statsRequestSequence++
    errorsRequestSequence++
    recentRequestSequence++
})
</script>
