<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-surface-600 dark:text-surface-300">
        Reports about questions and scripture passages generated for Lampada users.
      </p>
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        severity="secondary"
        text
        :loading="loading"
        @click="refresh"
      />
    </div>

    <Message v-if="error" severity="error" :closable="false">
      {{ error }}
    </Message>

    <div
      class="bg-surface-0 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
    >
      <DataTable
        :value="reports"
        dataKey="id"
        stripedRows
        :loading="loading && reports.length === 0"
        tableStyle="min-width: 62rem"
      >
        <Column field="created_at" header="Received" style="width: 12rem">
          <template #body="{ data }">
            <span class="text-sm whitespace-nowrap">{{ formatTime(data.created_at) }}</span>
          </template>
        </Column>
        <Column field="content_type" header="Type" style="width: 8rem">
          <template #body="{ data }">
            <Tag
              :value="typeLabel(data.content_type)"
              :severity="data.content_type === 'question' ? 'info' : 'secondary'"
            />
          </template>
        </Column>
        <Column field="language" header="Language" style="width: 7rem">
          <template #body="{ data }">
            <span class="uppercase font-medium">{{ data.language }}</span>
          </template>
        </Column>
        <Column field="content_text" header="Reported content">
          <template #body="{ data }">
            <span class="text-sm">{{ preview(data.content_text) }}</span>
          </template>
        </Column>
        <Column field="user_comment" header="User comment">
          <template #body="{ data }">
            <span v-if="data.user_comment" class="text-sm">{{ preview(data.user_comment) }}</span>
            <span v-else class="text-sm text-surface-400">—</span>
          </template>
        </Column>
        <Column header="" style="width: 6rem">
          <template #body="{ data }">
            <Button
              label="View"
              severity="secondary"
              text
              size="small"
              @click="selectedReport = data"
            />
          </template>
        </Column>
        <template #empty>
          <div class="py-10 text-center text-surface-500 dark:text-surface-400">
            No content reports have been received.
          </div>
        </template>
      </DataTable>
    </div>

    <div v-if="hasMore" class="flex justify-center">
      <Button
        label="Load older reports"
        icon="pi pi-angle-down"
        severity="secondary"
        :loading="loadingMore"
        @click="loadOlder"
      />
    </div>

    <Dialog
      v-model:visible="reportDialogVisible"
      modal
      header="Content report"
      :style="{ width: 'min(44rem, 92vw)' }"
    >
      <div v-if="selectedReport" class="flex flex-col gap-5">
        <div class="flex flex-wrap gap-2">
          <Tag
            :value="typeLabel(selectedReport.content_type)"
            :severity="selectedReport.content_type === 'question' ? 'info' : 'secondary'"
          />
          <Tag :value="selectedReport.language.toUpperCase()" severity="contrast" />
          <span class="text-sm text-surface-500 self-center">{{
            formatTime(selectedReport.created_at)
          }}</span>
        </div>
        <section>
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
            Reported content
          </h3>
          <p class="whitespace-pre-wrap break-words text-surface-900 dark:text-surface-0">
            {{ selectedReport.content_text }}
          </p>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
            User comment
          </h3>
          <p
            v-if="selectedReport.user_comment"
            class="whitespace-pre-wrap break-words text-surface-900 dark:text-surface-0"
          >
            {{ selectedReport.user_comment }}
          </p>
          <p v-else class="text-surface-400">No comment provided.</p>
        </section>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { adminApiService } from '../services/api'
import type { ContentReport } from '../types/api'

const PAGE_SIZE = 50

const reports = ref<ContentReport[]>([])
const selectedReport = ref<ContentReport | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const error = ref<string | null>(null)

const reportDialogVisible = computed({
  get: () => selectedReport.value !== null,
  set: (visible) => {
    if (!visible) selectedReport.value = null
  },
})

function preview(text: string): string {
  return text.length <= 140 ? text : `${text.slice(0, 137)}…`
}

function typeLabel(type: ContentReport['content_type']): string {
  return type === 'question' ? 'Question' : 'Scripture'
}

function formatTime(value: string): string {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
    const withZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(normalized) ? normalized : `${normalized}+03:00`
  return new Date(withZone).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const response = await adminApiService.getContentReports({ limit: PAGE_SIZE })
    reports.value = response.items
    hasMore.value = response.items.length === PAGE_SIZE
  } catch {
    error.value = 'Content reports could not be loaded. Try again.'
  } finally {
    loading.value = false
  }
}

async function loadOlder() {
  const last = reports.value[reports.value.length - 1]
  if (!last) return

  loadingMore.value = true
  error.value = null
  try {
    const response = await adminApiService.getContentReports({
      limit: PAGE_SIZE,
      before_id: last.id,
    })
    reports.value.push(...response.items)
    hasMore.value = response.items.length === PAGE_SIZE
  } catch {
    error.value = 'Older content reports could not be loaded. Try again.'
  } finally {
    loadingMore.value = false
  }
}

onMounted(refresh)
</script>
