<template>
  <div class="w-full">
    <!-- Voice Selection and Filters -->
    <div class="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-surface-800 dark:border-surface-700">
      <!-- Mobile: Stack vertically, Desktop: Horizontal layout -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div class="flex-1 min-w-0" style="flex: 2;">
          <Select id="voiceSelect" v-model="selectedVoice" :options="availableVoices" optionLabel="displayName"
            optionValue="code" :optionDisabled="isVoiceDisabled" placeholder="Select voice" class="w-full"
            @change="onVoiceChange" data-testid="voice-filter">
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full" :data-testid="`voice-option-${slotProps.option.code}`">
                <span :class="{ 'opacity-50': slotProps.option.anomalies_count === 0 }"
                  :title="slotProps.option.displayName">
                  {{ truncateText(slotProps.option.displayName) }}
                </span>
                <div class="flex gap-1">
                  <Tag :value="slotProps.option.anomalies_open_count || 0"
                    :severity="(slotProps.option.anomalies_open_count || 0) === 0 ? 'success' : 'warn'"
                    :title="'Open anomalies (detected/confirmed)'" />
                  <Tag :value="slotProps.option.anomalies_count"
                    :severity="slotProps.option.anomalies_count === 0 ? 'secondary' : 'info'"
                    :title="'Total anomalies'" />
                </div>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center justify-between w-full" v-if="slotProps.value">
                <span :title="getSelectedVoiceDisplayName(slotProps.value)">
                  {{ truncateText(getSelectedVoiceDisplayName(slotProps.value)) }}
                </span>
                <div class="flex gap-1">
                  <Tag :value="getSelectedVoiceOpenAnomaliesCount(slotProps.value)"
                    :severity="getSelectedVoiceOpenAnomaliesCount(slotProps.value) === 0 ? 'success' : 'warn'"
                    :title="'Open anomalies (detected/confirmed)'" />
                  <Tag :value="getSelectedVoiceAnomaliesCount(slotProps.value)"
                    :severity="getSelectedVoiceAnomaliesCount(slotProps.value) === 0 ? 'secondary' : 'info'"
                    :title="'Total anomalies'" />
                </div>
              </div>
            </template>
          </Select>
        </div>
        <div class="flex-1 min-w-0" style="flex: 2;">
          <Select id="bookFilter" v-model="selectedBookNumber" :options="bookOptions" optionLabel="label"
            optionValue="value" placeholder="All books" class="w-full" :disabled="!selectedVoice"
            :loading="booksState.loading" @change="onBookChange" showClear data-testid="book-filter">
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full" :data-testid="`book-option-${slotProps.option.value}`">
                <span :class="{ 'opacity-50': slotProps.option.anomalies_count === 0 }">
                  {{ slotProps.option.label }}
                </span>
                <div v-if="selectedVoice" class="flex gap-1">
                  <Tag :value="slotProps.option.anomalies_open_count || 0"
                    :severity="(slotProps.option.anomalies_open_count || 0) === 0 ? 'success' : 'warn'"
                    :title="'Open anomalies (detected/confirmed)'" />
                  <Tag :value="slotProps.option.anomalies_count"
                    :severity="slotProps.option.anomalies_count === 0 ? 'secondary' : 'info'"
                    :title="'Total anomalies'" />
                </div>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center justify-between w-full" v-if="slotProps.value && selectedVoice">
                <span>
                  {{ getSelectedBookDisplayName(slotProps.value) }}
                </span>
                <div class="flex gap-1">
                  <Tag :value="getSelectedBookOpenAnomaliesCount(slotProps.value)"
                    :severity="getSelectedBookOpenAnomaliesCount(slotProps.value) === 0 ? 'success' : 'warn'"
                    :title="'Open anomalies (detected/confirmed)'" />
                  <Tag :value="getSelectedBookAnomaliesCount(slotProps.value)"
                    :severity="getSelectedBookAnomaliesCount(slotProps.value) === 0 ? 'secondary' : 'info'"
                    :title="'Total anomalies'" />
                </div>
              </div>
              <span v-else-if="slotProps.value">
                {{ getSelectedBookDisplayName(slotProps.value) }}
              </span>
            </template>
          </Select>
        </div>
        <div class="flex-1 min-w-0" style="flex: 1;">
          <Select id="anomalyTypeFilter" v-model="selectedAnomalyType" :options="anomalyTypeOptions" optionLabel="label"
            optionValue="value" placeholder="All types" class="w-full" :disabled="!selectedVoice"
            @change="onAnomalyTypeChange" showClear data-testid="anomaly-type-filter" />
        </div>
        <div class="flex-1 min-w-0" style="flex: 1;">
          <Select id="statusFilter" v-model="selectedStatus" :options="statusFilterOptions" optionLabel="label"
            optionValue="value" placeholder="All statuses" class="w-full" :disabled="!selectedVoice"
            @change="onStatusChange" showClear data-testid="status-filter" />
        </div>
        <div class="flex gap-3">
          <Button @click="openCreateAnomalyDialog" :disabled="!selectedVoice" severity="help" title="Add New Anomaly" data-testid="add-anomaly-button">
            <PlusIcon class="w-5 h-5" />
          </Button>
          <Button @click="refreshData" :disabled="!selectedVoice" :loading="anomaliesState.loading" title="Refresh" data-testid="refresh-button">
            <RefreshIcon class="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Anomalies Table -->
    <DataTable :value="groupedAnomalies" tableStyle="min-width: 50rem" paginator :rows="pageSize"
      :first="(currentPage - 1) * pageSize"
      :rowsPerPageOptions="[10, 15, 50, 100]" :totalRecords="totalCount" :lazy="true" stripedRows
      :loading="anomaliesState.loading" @page="onPageChange" @sort="onSort" sortMode="single" :rowClass="getRowClass"
      :rowStyle="getRowStyle" class="compact-table">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span v-if="selectedVoice" class="text-sm text-gray-600">
              Voice: {{ getVoiceName(selectedVoice) }}
            </span>
          </div>
        </div>
      </template>

      <Column field="code" header="Code" style="width: 6%"></Column>
      <Column field="book_number" header="Reference" sortable style="width: 20%">
        <template #body="slotProps">
          <span class="text-sm font-medium">{{ formatReference(slotProps.data) }}</span>
        </template>
      </Column>
      <Column field="word" header="Word" style="width: 14%">
        <template #body="slotProps">
          <Tag v-if="slotProps.data.anomalyCount > 1" :value="`${slotProps.data.anomalyCount} anomalies`" severity="info" />
          <span v-else class="font-mono font-semibold">{{ slotProps.data.word || '—' }}</span>
        </template>
      </Column>
      <Column field="anomaly_type" header="Anomaly Type" sortable style="width: 15%">
        <template #body="slotProps">
          <div v-if="slotProps.data.anomalyTypes" class="flex flex-col gap-1">
            <Tag v-for="type in slotProps.data.anomalyTypes" :key="type"
              :value="getAnomalyTypeLabel(type)" :severity="getAnomalySeverity(type)" 
              :class="`text-xs ${getAnomalyTypeClass(type)}`" />
          </div>
          <Tag v-else :value="getAnomalyTypeLabel(slotProps.data.anomaly_type)"
            :severity="getAnomalySeverity(slotProps.data.anomaly_type)"
            :class="getAnomalyTypeClass(slotProps.data.anomaly_type)" />
        </template>
      </Column>
      <Column header="Info" style="width: 8%">
        <template #body="slotProps">
          <InfoIcon class="w-5 h-5 text-blue-500 cursor-pointer" v-tooltip.top="getInfoTooltip(slotProps.data)" />
        </template>
      </Column>
      <Column field="ratio" header="Ratio" sortable style="width: 10%">
        <template #body="slotProps">
          <Tag :value="(slotProps.data.maxRatio || slotProps.data.ratio).toFixed(2)" 
               :severity="getRatioSeverity(slotProps.data.maxRatio || slotProps.data.ratio)" />
        </template>
      </Column>
      <Column field="status" header="Status" style="width: 12%">
        <template #body="slotProps">
          <Button type="button" :severity="getStatusSeverity(slotProps.data.status)"
            @click="(event: Event) => toggleStatusPopover(event, slotProps.data.code)"
            class="min-w-44 text-xs flex items-center justify-between" size="small">
            <span>{{ getStatusLabel(slotProps.data.status) }}</span>
            <ChevronDownIcon class="w-4 h-4 ml-2" />
          </Button>

          <Popover :ref="(el) => setStatusPopoverRef(el, slotProps.data.code)">
            <div class="flex flex-col gap-2 p-0">
              <ul class="list-none p-0 m-0 flex flex-col gap-1">
                <li v-for="option in selectableStatusOptions" :key="option.value" :class="[
                  'flex flex-col gap-1 px-3 py-2 hover:bg-emphasis cursor-pointer rounded-border',
                  { 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700': option.value === slotProps.data.status }
                ]" @click="selectStatus(slotProps.data, option.value)" :data-testid="`status-option-${option.value}`">
                  <div class="flex items-center gap-2">
                    <Tag :value="option.label" :severity="getStatusSeverity(option.value)" class="text-xs" />
                  </div>
                  <span class="text-xs text-muted-color ml-1">{{ option.description }}</span>
                </li>
              </ul>
            </div>
          </Popover>
        </template>
      </Column>
      <Column header="Actions" style="width: 10%">
        <template #body="slotProps">
          <div class="flex gap-1">
            <!-- Dynamic Play/Pause button -->
            <Button v-if="currentPlayingId === slotProps.data.code && isPlaying" severity="primary" class="w-9 h-9"
              v-tooltip.top="'Pause'" @click="togglePlayPause()">
              <PauseIcon class="-m-1" />
            </Button>
            <Button v-else severity="info" class="w-9 h-9" v-tooltip.top="'Play Verse'"
              @click="playVerse(slotProps.data)">
              <PlayIcon class="-m-1" />
            </Button>
          </div>
        </template>
      </Column>

      <template #footer>
        <div class="flex justify-between items-center">
          <span>Total anomalies: {{ totalCount }} (showing: {{ anomalies ? anomalies.length : 0 }})</span>
          <span v-if="anomaliesState.error" class="text-red-500 text-sm">
            {{ anomaliesState.error }}
          </span>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-8">
          <InfoIcon class="w-12 h-12 text-gray-400 mb-4 mx-auto" />
          <p class="text-gray-600">
            {{ selectedVoice ? 'No anomalies found for selected voice' : 'Select a voice to view anomalies' }}
          </p>
        </div>
      </template>
    </DataTable>

    <!-- Mini Audio Player Popup -->
    <div v-if="showPlayer"
      class="fixed top-4 right-4 w-[420px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-lg p-7 transition-all duration-500 ease-in-out"
      style="z-index: 1200;">
      <div class="flex flex-col gap-3">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-400/20 flex items-center justify-center">
              <SpeakerIcon class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div class="text-base font-semibold text-surface-900 dark:text-surface-0 leading-normal">
                Playing Verse
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-300 leading-tight">
                Book {{ currentVerse?.book_number }} Chapter {{ currentVerse?.chapter_number }}:{{
                  currentVerse?.verse_number }}
              </div>
            </div>
          </div>
          <!-- Play/Pause, Navigation and Stop buttons in top right corner -->
          <div class="flex gap-2 -mt-1 -mr-1">
            <Button severity="primary" class="w-10 h-10 !p-2" @click="togglePlayPause" data-testid="audio-player-play-pause-button">
              <component :is="isPlaying ? PauseIcon : PlayIcon" class="w-5 h-5" />
            </Button>
            <!-- Navigation menu button -->
            <div class="relative navigation-menu-container">
              <Button severity="secondary" class="w-10 h-10 !p-2" @click="toggleNavigationMenu"
                v-tooltip.top="'Navigation'">
                <MoreHorizontalIcon class="w-5 h-5" />
              </Button>
              <!-- Navigation dropdown menu -->
              <div v-if="showNavigationMenu"
                class="absolute top-12 right-0 w-56 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg py-1"
                style="z-index: 1210;">
                <button
                  class="w-full px-4 py-3 text-left text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!canPlayPreviousVerse" @click="playPreviousVerse">
                  <SkipBackIcon class="w-5 h-5 flex-shrink-0" />
                  Play previous verse
                </button>
                <button
                  class="w-full px-4 py-3 text-left text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  :disabled="!canPlayNextVerse" @click="playNextVerse">
                  <SkipForwardIcon class="w-5 h-5 flex-shrink-0" />
                  Play next verse
                </button>
              </div>
            </div>
            <Button severity="secondary" class="w-10 h-10 !p-2" @click="stopPlaying" v-tooltip.top="'Stop'" data-testid="audio-player-stop-button">
              <CloseIcon class="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div class="text-sm text-surface-700 dark:text-surface-200 leading-relaxed" v-if="currentExcerptVerse?.text"
          v-html="highlightProblematicWord(currentExcerptVerse.text, currentVerse?.word || null, currentVerse?.position_in_verse || null, currentVerse?.position_from_end || null, getAnomalyTypesArray(currentVerse))">
        </div>
        
        <!-- Timing overlap warnings -->
        <div v-if="timingAnalysis.hasBeginOverlap || timingAnalysis.hasEndOverlap" class="space-y-2">
          <div v-if="timingAnalysis.hasBeginOverlap" 
            class="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span class="text-white text-xs font-bold">!</span>
            </div>
            <div class="text-sm text-red-800 dark:text-red-200 leading-relaxed">
              <div class="font-semibold mb-1">Begin Time Overlap</div>
              <div>{{ timingAnalysis.beginOverlapMessage }}</div>
            </div>
          </div>
          
          <div v-if="timingAnalysis.hasEndOverlap" 
            class="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div class="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span class="text-white text-xs font-bold">!</span>
            </div>
            <div class="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
              <div class="font-semibold mb-1">End Time Overlap</div>
              <div>{{ timingAnalysis.endOverlapMessage }}</div>
            </div>
          </div>
        </div>
        
        <div class="flex flex-col gap-2">
          <div
            class="relative h-1.5 rounded-lg overflow-hidden cursor-pointer hover:h-2 transition-all duration-200 bg-surface-200 dark:bg-surface-700"
            @click="seekToPosition">
            <div class="absolute top-0 left-0 bg-primary h-full rounded-lg"
              :style="{ width: progressPercentage + '%' }" />
          </div>
          <div class="text-right text-xs text-surface-900 dark:text-surface-0 leading-tight">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
        </div>
        <!-- Main action buttons -->
        <div class="flex gap-4">
          <!-- Original verse buttons -->
          <template v-if="currentVerseType === 'original'">
            <Button severity="danger" :class="['flex-1', { 'animate-pulse-glow': showButtonAnimation && canChangeStatus }]"
              @click="confirmAnomaly" :disabled="!currentVerse || !canChangeStatus" data-testid="confirm-error-button">
              <span class="font-semibold text-sm">Confirm Error</span>
            </Button>
            <Button severity="success" :class="['flex-1', { 'animate-pulse-glow': showButtonAnimation && canChangeStatus }]"
              @click="disproveAnomaly" :disabled="!currentVerse || !canChangeStatus" data-testid="alignment-correct-button">
              <span class="font-semibold text-sm">Alignment Correct</span>
            </Button>
          </template>
          
          <!-- Previous verse button -->
          <template v-else-if="currentVerseType === 'previous'">
            <Button severity="warn" class="flex-1" :disabled="!currentVerse" @click="addAnomalyToPreviousVerse">
              <span class="font-semibold text-sm">Add anomaly to previous verse</span>
            </Button>
          </template>
          
          <!-- Next verse button -->
          <template v-else-if="currentVerseType === 'next'">
            <Button severity="warn" class="flex-1" :disabled="!currentVerse" @click="addAnomalyToNextVerse">
              <span class="font-semibold text-sm">Add anomaly to next verse</span>
            </Button>
          </template>
        </div>
        <!-- Auto-advance checkbox -->
        <div class="relative flex pt-4 mt-2 border-t border-surface-200 dark:border-surface-700">
          <!-- Left side: Checkboxes and settings -->
          <div class="flex-1 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Checkbox v-model="quickCheckMode" inputId="quickCheck" binary />
              <label for="quickCheck" class="text-sm text-surface-700 dark:text-surface-200 cursor-pointer">
                Quick Check
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox v-model="autoAdvanceToNext" inputId="autoAdvance" binary />
              <label for="autoAdvance" class="text-sm text-surface-700 dark:text-surface-200 cursor-pointer">
                Automatically advance to next verse
              </label>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox v-model="autoAcceptOnTimer" inputId="autoAcceptTimer" binary :disabled="!autoAdvanceToNext" />
              <label for="autoAcceptTimer" class="text-sm text-surface-700 dark:text-surface-200 cursor-pointer" :class="{ 'opacity-50': !autoAdvanceToNext }">
                Auto-accept on timer
              </label>
            </div>
            <div v-if="autoAcceptOnTimer && autoAdvanceToNext" class="flex items-center gap-2 ml-6">
              <span class="text-sm text-surface-700 dark:text-surface-200">Timer:</span>
              <InputNumber v-model="autoAcceptTimerDuration" :min="1" :max="30" :step="1" 
                class="w-20" size="small" :disabled="autoAcceptTimeRemaining > 0" />
              <span class="text-sm text-surface-700 dark:text-surface-200">sec</span>
            </div>
          </div>
          
          <!-- Right side: Circular timer indicator -->
          <div v-if="autoAcceptTimeRemaining > 0" class="flex items-center justify-end pl-4 shrink-0">
            <div 
              class="relative flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" 
              style="width: 70px; height: 70px;"
              @click="toggleAutoAcceptTimer"
              title="Click to pause/resume timer"
            >
              <svg viewBox="0 0 70 70" class="w-full h-full transform -rotate-90">
                <!-- Background circle -->
                <circle
                  cx="35"
                  cy="35"
                  r="30"
                  stroke="currentColor"
                  stroke-width="6"
                  fill="none"
                  class="text-surface-200 dark:text-surface-700"
                />
                <!-- Progress circle -->
                <circle
                  cx="35"
                  cy="35"
                  r="30"
                  :stroke="autoAcceptTimerPaused ? 'currentColor' : 'url(#gradient)'"
                  stroke-width="6"
                  fill="none"
                  stroke-linecap="round"
                  :stroke-dasharray="188.5"
                  :stroke-dashoffset="188.5 * (1 - autoAcceptTimeRemaining / (autoAcceptTimerDuration * 10))"
                  :class="autoAcceptTimerPaused ? 'text-orange-500' : 'transition-all duration-100 ease-linear'"
                />
                <!-- Gradient definition -->
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(59, 130, 246);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(34, 197, 94);stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
              <!-- Timer text in center -->
              <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-xl font-bold" :class="autoAcceptTimerPaused ? 'text-orange-500' : 'text-primary-600 dark:text-primary-400'">
                  {{ Math.ceil(autoAcceptTimeRemaining / 10) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Verse Correction Interface - Variant 1: Compact Inline -->
        <div v-if="shouldShowCorrectionInterface && !showCorrectionInterface"
          class="pt-4 mt-2 border-t border-surface-200 dark:border-surface-700">
          <Button @click="initializeCorrectionInterface" severity="secondary" size="small" class="w-full">
            <EditIcon class="w-4 h-4 mr-2" />
            Adjust Verse Timing
          </Button>
        </div>

        <!-- Verse Correction Interface - Variant 1: Expanded Controls -->
        <div v-if="shouldShowCorrectionInterface && showCorrectionInterface"
          class="pt-4 mt-2 border-t border-surface-200 dark:border-surface-700 space-y-3">
          <div class="text-sm font-medium text-surface-900 dark:text-surface-0 mb-3">
            Adjust Verse Timing
          </div>

          <!-- Start Time Controls -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-700 dark:text-surface-200">Start Time:</span>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                <!-- Very fast decrease -->
                <Button @click="adjustStartTime(-1.0)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-1.0s'">
                  <span class="text-2xl font-bold leading-none" style="margin-top: -2px;">-</span>
                </Button>
                <!-- Fast decrease -->
                <Button @click="adjustStartTime(-0.1)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-0.1s'">
                  <span class="text-lg font-bold leading-none" style="margin-top: -1px;">-</span>
                </Button>
                <!-- Fine decrease -->
                <Button @click="adjustStartTime(-0.01)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-0.01s'">
                  <span class="text-xs font-bold leading-none">-</span>
                </Button>
                <!-- Time display -->
                <span
                  class="text-sm font-mono min-w-[80px] text-center bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded mx-1">{{
                    formatTimeWithMs(correctionStartTime) }}</span>
                <!-- Fine increase -->
                <Button @click="adjustStartTime(0.01)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+0.01s'">
                  <span class="text-xs font-bold leading-none">+</span>
                </Button>
                <!-- Fast increase -->
                <Button @click="adjustStartTime(0.1)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+0.1s'">
                  <span class="text-lg font-bold leading-none" style="margin-top: -1px;">+</span>
                </Button>
                <!-- Very fast increase -->
                <Button @click="adjustStartTime(1.0)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+1.0s'">
                  <span class="text-2xl font-bold leading-none" style="margin-top: -2px;">+</span>
                </Button>
              </div>
              <!-- Preview button for Start Time -->
              <Button @click="previewStartTime" severity="info" size="small" class="px-2 py-1"
                v-tooltip.top="'Preview start time'">
                <PlayIcon class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <!-- End Time Controls -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-700 dark:text-surface-200">End Time:</span>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                <!-- Very fast decrease -->
                <Button @click="adjustEndTime(-1.0)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-1.0s'">
                  <span class="text-2xl font-bold leading-none" style="margin-top: -2px;">-</span>
                </Button>
                <!-- Fast decrease -->
                <Button @click="adjustEndTime(-0.1)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-0.1s'">
                  <span class="text-lg font-bold leading-none" style="margin-top: -1px;">-</span>
                </Button>
                <!-- Fine decrease -->
                <Button @click="adjustEndTime(-0.01)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'-0.01s'">
                  <span class="text-xs font-bold leading-none">-</span>
                </Button>
                <!-- Time display -->
                <span
                  class="text-sm font-mono min-w-[80px] text-center bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded mx-1">{{
                    formatTimeWithMs(correctionEndTime) }}</span>
                <!-- Fine increase -->
                <Button @click="adjustEndTime(0.01)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+0.01s'">
                  <span class="text-xs font-bold leading-none">+</span>
                </Button>
                <!-- Fast increase -->
                <Button @click="adjustEndTime(0.1)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+0.1s'">
                  <span class="text-lg font-bold leading-none" style="margin-top: -1px;">+</span>
                </Button>
                <!-- Very fast increase -->
                <Button @click="adjustEndTime(1.0)" severity="secondary" size="small"
                  class="w-7 h-7 !p-0 inline-flex items-center justify-center" v-tooltip.top="'+1.0s'">
                  <span class="text-2xl font-bold leading-none" style="margin-top: -2px;">+</span>
                </Button>
              </div>
              <!-- Preview button for End Time -->
              <Button @click="previewEndTime" severity="info" size="small" class="px-2 py-1"
                v-tooltip.top="'Preview end time'">
                <PlayIcon class="w-3 h-3" />
              </Button>
            </div>
          </div>

          <!-- Timing overlap warnings for corrected values -->
          <div v-if="correctedTimingAnalysis.hasBeginOverlap || correctedTimingAnalysis.hasEndOverlap" class="space-y-2 pt-2">
            <div v-if="correctedTimingAnalysis.hasBeginOverlap" 
              class="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-white text-xs font-bold">!</span>
              </div>
              <div class="flex-1 text-xs text-red-800 dark:text-red-200 leading-relaxed">
                <div class="font-semibold mb-1">Begin Time Overlap</div>
                <div>{{ correctedTimingAnalysis.beginOverlapMessage }}</div>
              </div>
              <div class="flex flex-col gap-1">
                <Button @click="correctBeginOverlap" severity="danger" size="small" class="px-2 py-1 text-xs h-6 whitespace-nowrap"
                  v-tooltip.top="'Auto-correct begin time overlap'">
                  Correct
                </Button>
                <Button @click="addAnomalyToPreviousVerse" severity="warn" size="small" class="px-2 py-1 text-xs h-6 whitespace-nowrap"
                  v-tooltip.top="'Add manual anomaly to previous verse'">
                  Add to prev
                </Button>
              </div>
            </div>
            
            <div v-if="correctedTimingAnalysis.hasEndOverlap" 
              class="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div class="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-white text-xs font-bold">!</span>
              </div>
              <div class="flex-1 text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                <div class="font-semibold mb-1">End Time Overlap</div>
                <div>{{ correctedTimingAnalysis.endOverlapMessage }}</div>
              </div>
              <div class="flex flex-col gap-1">
                <Button @click="correctEndOverlap" severity="warn" size="small" class="px-2 py-1 text-xs h-6 whitespace-nowrap"
                  v-tooltip.top="'Auto-correct end time overlap'">
                  Correct
                </Button>
                <Button @click="addAnomalyToNextVerse" severity="warn" size="small" class="px-2 py-1 text-xs h-6 whitespace-nowrap"
                  v-tooltip.top="'Add manual anomaly to next verse'">
                  Add to next
                </Button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-2">
            <Button @click="applyCorrectionChanges" severity="success" size="small" class="flex-1"
              :disabled="!hasTimingChanges">
              Apply Corrections
            </Button>
            <Button @click="resetCorrectionChanges" severity="secondary" size="small" class="flex-1">
              Reset
            </Button>
            <Button @click="showCorrectionInterface = false" severity="secondary" size="small" class="flex-1">
              Close
            </Button>
          </div>
        </div>


      </div>
    </div>

    <!-- Create Anomaly Dialog -->
    <Dialog v-model:visible="showCreateAnomalyDialog" modal header="Create New Anomaly" 
      :style="{ width: '500px' }" :closable="true" @hide="resetCreateAnomalyForm">
      <div class="space-y-4">
        <!-- Book Selection -->
        <div class="field">
          <label for="createBook" class="block text-sm font-medium mb-2">Book</label>
          <Select id="createBook" v-model="newAnomaly.book_number" :options="bookOptions" 
            optionLabel="label" optionValue="value" placeholder="Select book" class="w-full" />
        </div>
        
        <!-- Chapter Number -->
        <div class="field">
          <label for="createChapter" class="block text-sm font-medium mb-2">Chapter</label>
          <InputNumber id="createChapter" v-model="newAnomaly.chapter_number" 
            :min="1" :max="150" placeholder="Chapter number" class="w-full" />
        </div>
        
        <!-- Verse Number -->
        <div class="field">
          <label for="createVerse" class="block text-sm font-medium mb-2">Verse</label>
          <InputNumber id="createVerse" v-model="newAnomaly.verse_number" 
            :min="1" :max="200" placeholder="Verse number" class="w-full" />
        </div>
        

        
        <!-- Anomaly Type -->
        <div class="field">
          <label for="createType" class="block text-sm font-medium mb-2">Anomaly Type</label>
          <Select id="createType" v-model="newAnomaly.anomaly_type" :options="createAnomalyTypeOptions" 
            optionLabel="label" optionValue="value" placeholder="Select type" class="w-full" />
        </div>
        

        
        <!-- Ratio -->
        <div class="field">
          <label for="createRatio" class="block text-sm font-medium mb-2">Ratio</label>
          <InputNumber id="createRatio" v-model="newAnomaly.ratio" 
            :min="0.1" :max="10" :minFractionDigits="2" :maxFractionDigits="2" 
            placeholder="Anomaly ratio" class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="Cancel" severity="secondary" @click="showCreateAnomalyDialog = false" data-testid="create-dialog-cancel-button" />
          <Button label="Create" severity="help" @click="createNewAnomaly" :loading="creatingAnomaly" data-testid="create-dialog-submit-button" />
        </div>
      </template>
    </Dialog>

    <!-- Toast notifications -->
    <Toast :position="showPlayer ? 'top-left' : 'top-right'" :pt="{ root: { style: showPlayer ? 'top: 1rem; left: 1rem;' : '' } }" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import type { DataTableSortEvent } from 'primevue/datatable'
import type { VoiceAnomalyModel, BookModel, AnomalyStatus, AnomalyType, ExcerptResponse, ExcerptVerseModel, CreateAnomalyRequest } from '../types/api'
import { useVoiceAnomalies, useTranslations, useBooks, type VoiceWithTranslation } from '../composables/useApi'
import { adminApiService } from '../services/api'
import { useToast } from 'primevue/usetoast'
import { createAudioUrlWithAuth, fetchWithAuth } from '../utils/audio'
// Lucide imports
import {
  RotateCcw as RefreshIcon,
  Info as InfoIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  X as CloseIcon,
  Volume2 as SpeakerIcon,
  ChevronDown as ChevronDownIcon,
  MoreHorizontal as MoreHorizontalIcon,
  SkipBack as SkipBackIcon,
  SkipForward as SkipForwardIcon,
  Plus as PlusIcon,
  Minus as MinusIcon
} from 'lucide-vue-next'

// Composables
const {
  state: anomaliesState,
  anomalies,
  totalCount,
  currentPage,
  pageSize,
  selectedVoiceCode,
  selectedAnomalyType,
  selectedBookNumber,
  selectedStatus,
  selectedSortBy,
  selectedSortOrder,
  fetchAnomalies,
  loadPage,
  refreshAnomalies,
  setAnomalyTypeFilter,
  setBookFilter,
  setStatusFilter,
  setSortBy,
  updateAnomalyStatus,
  createAnomaly
} = useVoiceAnomalies()

const { state: voicesState, voices, fetchTranslations } = useTranslations()
const { state: booksState, books, fetchBooks, clearBooks } = useBooks()
const toast = useToast()

// Local state
const selectedVoice = ref<number | null>(null)

// Audio player state
const showPlayer = ref(false)
const isPlaying = ref(false)
const currentVerse = ref<VoiceAnomalyModel | null>(null)
const currentPlayingId = ref<number | null>(null)
const showButtonAnimation = ref(false) // ID of currently playing anomaly
const audioElement = ref<HTMLAudioElement | null>(null)
const currentTime = ref(0)
const duration = ref(0)
const progressUpdateInterval = ref<number | null>(null)

// Web Audio API state for precise timing control
const audioContext = ref<AudioContext | null>(null)
const audioBuffer = ref<AudioBuffer | null>(null)
const sourceNode = ref<AudioBufferSourceNode | null>(null)
const audioStartTime = ref(0) // AudioContext time when playback started
const audioOffset = ref(0) // Offset within the audio buffer (for pause/resume)
const animationFrameId = ref<number | null>(null) // requestAnimationFrame ID for smooth timeline updates
const autoAdvanceToNext = ref(false) // Auto-advance to next verse checkbox
const quickCheckMode = ref(false) // Quick check mode: play first 2s, pause 0.5s, play last 2s
const isQuickCheckActive = ref(false) // Whether quick check is actually running (for verses >= 6s)
const shouldStopQuickCheck = ref(false) // Flag to interrupt quick check playback
const currentVerseType = ref<'original' | 'previous' | 'next'>('original') // Type of currently playing verse
const originalVerseNumber = ref<number | null>(null) // Store original verse number with anomaly
const autoAcceptOnTimer = ref(false) // Auto-accept verse on timer after playback
const autoAcceptTimerDuration = ref(5) // Timer duration in seconds (default 5s)
const autoAcceptTimerId = ref<number | null>(null) // Timer ID for auto-accept
const autoAcceptTimeRemaining = ref(0) // Remaining time for auto-accept timer
const autoAcceptTimerPaused = ref(false) // Whether the timer is paused

// Excerpt data state
const currentExcerpt = ref<ExcerptResponse | null>(null)
const currentExcerptVerse = ref<ExcerptVerseModel | null>(null)
const adjacentVerses = ref<ExcerptVerseModel[]>([])

// Navigation menu state
const showNavigationMenu = ref(false)
const navigationMenuRef = ref<any>(null)

// Create anomaly dialog state
const showCreateAnomalyDialog = ref(false)
const creatingAnomaly = ref(false)
const newAnomaly = ref<Partial<CreateAnomalyRequest>>({
  voice: undefined,
  translation: undefined,
  book_number: undefined,
  chapter_number: undefined,
  verse_number: undefined,
  word: 'N/A', // Default value since field is removed
  position_in_verse: 1, // Default value since field is removed
  position_from_end: 1, // Default value since field is removed
  duration: 1.0, // Default value since field is removed
  speed: 1.0, // Default value since field is removed
  ratio: 1.0,
  anomaly_type: 'manual',
  status: 'detected'
})

// Verse correction state
const showCorrectionInterface = ref(false)
const correctionStartTime = ref(0)
const correctionEndTime = ref(0)
const originalStartTime = ref(0)
const originalEndTime = ref(0)

// Timing analysis computed properties
const timingAnalysis = computed(() => {
  if (!currentExcerptVerse.value || !adjacentVerses.value || adjacentVerses.value.length === 0) {
    return {
      hasBeginOverlap: false,
      hasEndOverlap: false,
      beginOverlapMessage: '',
      endOverlapMessage: ''
    }
  }

  const currentVerse = currentExcerptVerse.value
  const currentVerseNumber = currentVerse.number
  
  // Find previous and next verses
  const previousVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber - 1)
  const nextVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber + 1)
  
  let hasBeginOverlap = false
  let hasEndOverlap = false
  let beginOverlapMessage = ''
  let endOverlapMessage = ''
  
  // Check if current verse begin is less than previous verse end
  if (previousVerse && currentVerse.begin < previousVerse.end) {
    hasBeginOverlap = true
    const overlapDuration = (previousVerse.end - currentVerse.begin).toFixed(2)
    beginOverlapMessage = `Begin time (${currentVerse.begin.toFixed(2)}s) overlaps with previous verse end (${previousVerse.end.toFixed(2)}s) by ${overlapDuration}s`
  }
  
  // Check if current verse end is greater than next verse begin
  if (nextVerse && currentVerse.end > nextVerse.begin) {
    hasEndOverlap = true
    const overlapDuration = (currentVerse.end - nextVerse.begin).toFixed(2)
    endOverlapMessage = `End time (${currentVerse.end.toFixed(2)}s) overlaps with next verse begin (${nextVerse.begin.toFixed(2)}s) by ${overlapDuration}s`
  }
  
  return {
    hasBeginOverlap,
    hasEndOverlap,
    beginOverlapMessage,
    endOverlapMessage
  }
})

// Timing analysis for corrected values (used in correction interface)
const correctedTimingAnalysis = computed(() => {
  if (!currentExcerptVerse.value || !adjacentVerses.value || adjacentVerses.value.length === 0 || !showCorrectionInterface.value) {
    return {
      hasBeginOverlap: false,
      hasEndOverlap: false,
      beginOverlapMessage: '',
      endOverlapMessage: ''
    }
  }

  const currentVerseNumber = currentExcerptVerse.value.number
  
  // Find previous and next verses
  const previousVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber - 1)
  const nextVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber + 1)
  
  let hasBeginOverlap = false
  let hasEndOverlap = false
  let beginOverlapMessage = ''
  let endOverlapMessage = ''
  
  // Check if corrected begin is less than previous verse end
  if (previousVerse && correctionStartTime.value < previousVerse.end) {
    hasBeginOverlap = true
    const overlapDuration = (previousVerse.end - correctionStartTime.value).toFixed(2)
    beginOverlapMessage = `Corrected begin time (${correctionStartTime.value.toFixed(2)}s) would overlap with previous verse end (${previousVerse.end.toFixed(2)}s) by ${overlapDuration}s`
  }
  
  // Check if corrected end is greater than next verse begin
  if (nextVerse && correctionEndTime.value > nextVerse.begin) {
    hasEndOverlap = true
    const overlapDuration = (correctionEndTime.value - nextVerse.begin).toFixed(2)
    endOverlapMessage = `Corrected end time (${correctionEndTime.value.toFixed(2)}s) would overlap with next verse begin (${nextVerse.begin.toFixed(2)}s) by ${overlapDuration}s`
  }
  
  return {
    hasBeginOverlap,
    hasEndOverlap,
    beginOverlapMessage,
    endOverlapMessage
  }
})

// Anomaly type filter options
const anomalyTypeOptions = ref([
  { label: 'Fast First', value: 'fast_first' },
  { label: 'Fast Last', value: 'fast_last' },
  { label: 'Fast Middle', value: 'fast_middle' },
  { label: 'Fast Next Verse', value: 'fast_next_verse' },
  { label: 'Fast Previous Verse', value: 'fast_previous_verse' },
  { label: 'Slow First', value: 'slow_first' },
  { label: 'Slow Last', value: 'slow_last' },
  { label: 'Slow Middle', value: 'slow_middle' },
  { label: 'Slow Next Verse', value: 'slow_next_verse' },
  { label: 'Slow Previous Verse', value: 'slow_previous_verse' },
  { label: 'Manual', value: 'manual' },
  { label: 'AI: Likely False Positive', value: 'ai_likely_false_positive' },
  { label: 'AI: Review Recommended', value: 'ai_review_recommended' },
  { label: 'AI: Likely Problem', value: 'ai_likely_problem' },
  { label: 'AI: Problem', value: 'ai_problem' }
])

// Computed properties
const availableVoices = computed(() => {
  return voices.value.map(voice => ({
    ...voice,
    displayName: `${voice.name} (${voice.translation.name} - ${voice.translation.language})`,
    anomalies_count: voice.anomalies_count || 0,
    anomalies_open_count: voice.anomalies_open_count || 0
  }))
})

// Function to disable voices with zero anomalies
const isVoiceDisabled = (voice: any) => {
  return voice.anomalies_count === 0
}

// Functions for selected voice display
const getSelectedVoiceDisplayName = (voiceCode: number): string => {
  const voice = voices.value.find(v => v.code === voiceCode)
  return voice ? `${voice.name} (${voice.translation.name} - ${voice.translation.language})` : ''
}

const getSelectedVoiceAnomaliesCount = (voiceCode: number): number => {
  const voice = voices.value.find(v => v.code === voiceCode)
  return voice ? voice.anomalies_count || 0 : 0
}

const getSelectedVoiceOpenAnomaliesCount = (voiceCode: number): number => {
  const voice = voices.value.find(v => v.code === voiceCode)
  return voice ? voice.anomalies_open_count || 0 : 0
}

// Functions for selected book display
const getSelectedBookDisplayName = (bookNumber: number): string => {
  const book = books.value.find(b => b.book_number === bookNumber)
  return book ? `${book.name} (${book.book_number})` : ''
}

const getSelectedBookAnomaliesCount = (bookNumber: number): number => {
  const book = books.value.find(b => b.book_number === bookNumber)
  return book ? book.anomalies_count || 0 : 0
}

const getSelectedBookOpenAnomaliesCount = (bookNumber: number): number => {
  const book = books.value.find(b => b.book_number === bookNumber)
  return book ? book.anomalies_open_count || 0 : 0
}

const bookOptions = computed(() => {
  return books.value.map((book) => ({
    label: `${book.name} (${book.book_number})`,
    value: book.book_number,
    anomalies_count: book.anomalies_count || 0,
    anomalies_open_count: book.anomalies_open_count || 0
  }))
})

// Status options
// Status options for filtering (includes all statuses)
const statusFilterOptions = [
  { label: 'Detected', value: 'detected' as AnomalyStatus, description: 'Error detected automatically (default)' },
  { label: 'Confirmed', value: 'confirmed' as AnomalyStatus, description: 'Error confirmed during verification' },
  { label: 'Disproved', value: 'disproved' as AnomalyStatus, description: 'Error disproved, not confirmed by verification' },
  { label: 'Corrected', value: 'corrected' as AnomalyStatus, description: 'Manual correction performed' },
  { label: 'Already Resolved', value: 'already_resolved' as AnomalyStatus, description: 'Verse marked as completely correct previously' },
  { label: 'Disproved (Whisper)', value: 'disproved_whisper' as AnomalyStatus, description: 'Auto-disproved by Whisper analysis' }
]

// Status options for manual selection (excludes already_resolved)
const selectableStatusOptions = [
  { label: 'Detected', value: 'detected' as AnomalyStatus, description: 'Error detected automatically (default)' },
  { label: 'Confirmed', value: 'confirmed' as AnomalyStatus, description: 'Error confirmed during verification' },
  { label: 'Disproved', value: 'disproved' as AnomalyStatus, description: 'Error disproved, not confirmed by verification' },
  { label: 'Corrected', value: 'corrected' as AnomalyStatus, description: 'Manual correction performed' }
]

// Anomaly type options for create form
const createAnomalyTypeOptions = [
  { label: 'Fast First', value: 'fast_first' as AnomalyType },
  { label: 'Fast Last', value: 'fast_last' as AnomalyType },
  { label: 'Fast Middle', value: 'fast_middle' as AnomalyType },
  { label: 'Fast Previous Verse', value: 'fast_previous_verse' as AnomalyType },
  { label: 'Manual', value: 'manual' as AnomalyType }
]

// Methods
const onVoiceChange = async () => {
  if (selectedVoice.value) {
    currentPage.value = 1
    selectedAnomalyType.value = null // Reset filters when changing voice
    selectedBookNumber.value = null

    // Get translation code from selected voice
    const selectedVoiceData = availableVoices.value.find(v => v.code === selectedVoice.value)
    if (selectedVoiceData) {
      // Load books for the translation with voice_code to get anomalies count
      await fetchBooks(selectedVoiceData.translation.code, selectedVoice.value)
    }

    await fetchAnomalies(selectedVoice.value, {
      page: 1,
      limit: pageSize.value,
      sort_by: selectedSortBy.value,
      sort_order: selectedSortOrder.value
    })
  } else {
    // Clear books when no voice is selected
    clearBooks()
  }
}

const onAnomalyTypeChange = async () => {
  currentPage.value = 1
  await setAnomalyTypeFilter(selectedAnomalyType.value)
}

const onBookChange = async () => {
  currentPage.value = 1
  await setBookFilter(selectedBookNumber.value)
}

const onStatusChange = async () => {
  currentPage.value = 1
  await setStatusFilter(selectedStatus.value)
}

const onPageChange = async (event: any) => {
  const newPage = event.page + 1 // PrimeVue uses 0-based indexing
  const newPageSize = event.rows

  // Update page size if it changed
  if (newPageSize !== pageSize.value) {
    pageSize.value = newPageSize
  }

  await loadPage(newPage)
}

const onSort = async (event: DataTableSortEvent) => {
  // Map DataTable field names to API sort_by values
  let sortBy: 'address' | 'type' | 'ratio' = 'ratio'

  if (event.sortField === 'book_number' || event.sortField === 'chapter_number' || event.sortField === 'verse_number') {
    sortBy = 'address'
  } else if (event.sortField === 'anomaly_type') {
    sortBy = 'type'
  } else if (event.sortField === 'ratio') {
    sortBy = 'ratio'
  }

  // Determine sort order from DataTable event
  const sortOrder: 'asc' | 'desc' = event.sortOrder === 1 ? 'asc' : 'desc'

  await setSortBy(sortBy, sortOrder)
}

const refreshData = async () => {
  if (selectedVoice.value) {
    // Refresh translations/voices to update anomaly counts
    await fetchTranslations()
    
    // Refresh books for selected voice to update anomaly counts
    const selectedVoiceData = availableVoices.value.find(v => v.code === selectedVoice.value)
    if (selectedVoiceData) {
      await fetchBooks(selectedVoiceData.translation.code, selectedVoice.value)
    }
    
    // Refresh anomalies table
    await refreshAnomalies()
  }
}

const getVoiceName = (voiceCode: number): string => {
  const voice = availableVoices.value.find(v => v.code === voiceCode)
  return voice ? voice.displayName : `Voice ${voiceCode}`
}

const getBookName = (bookNumber: number): string => {
  const book = books.value.find((b) => b.book_number === bookNumber)
  return book ? book.name : `Book ${bookNumber}`
}

const formatReference = (anomaly: VoiceAnomalyModel): string => {
  const bookName = getBookName(anomaly.book_number)
  return `${bookName} ${anomaly.chapter_number}:${anomaly.verse_number}`
}

const getAnomalyTypeLabel = (type: AnomalyType): string => {
  switch (type) {
    case 'fast_first':
      return 'Fast First'
    case 'fast_last':
      return 'Fast Last'
    case 'fast_middle':
      return 'Fast Middle'
    case 'fast_next_verse':
      return 'Fast Next Verse'
    case 'fast_previous_verse':
      return 'Fast Previous Verse'
    case 'slow_first':
      return 'Slow First'
    case 'slow_last':
      return 'Slow Last'
    case 'slow_middle':
      return 'Slow Middle'
    case 'slow_next_verse':
      return 'Slow Next Verse'
    case 'slow_previous_verse':
      return 'Slow Previous Verse'
    case 'manual':
      return 'Manual'
    case 'ai_likely_false_positive':
      return 'AI: Likely FP'
    case 'ai_review_recommended':
      return 'AI: Review'
    case 'ai_likely_problem':
      return 'AI: Likely Problem'
    case 'ai_problem':
      return 'AI: Problem'
    default:
      return type
  }
}

const getAnomalySeverity = (type: AnomalyType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' => {
  switch (type) {
    // Fast anomalies - Purple shades (using info/secondary for purple-like colors)
    case 'fast_first':
      return 'danger' // Deep purple (darkest)
    case 'fast_last':
      return 'warn' // Medium purple
    case 'fast_middle':
      return 'info' // Light purple
    case 'fast_next_verse':
      return 'secondary' // Lightest purple
    case 'fast_previous_verse':
      return 'secondary' // Lightest purple
    
    // Slow anomalies - Brown shades (using warn/secondary for brown-like colors)
    case 'slow_first':
      return 'warn' // Dark brown
    case 'slow_last':
      return 'warn' // Medium brown
    case 'slow_middle':
      return 'secondary' // Light brown
    case 'slow_next_verse':
      return 'secondary' // Lightest brown
    case 'slow_previous_verse':
      return 'secondary' // Lightest brown
    
    // Manual anomalies - Teal/Cyan
    case 'manual':
      return 'info' // Teal/Cyan color

    // AI Whisper anomalies - severity-based colors
    case 'ai_likely_false_positive':
      return 'success' // Green - low concern
    case 'ai_review_recommended':
      return 'warn' // Orange - needs attention
    case 'ai_likely_problem':
      return 'danger' // Red - likely real issue
    case 'ai_problem':
      return 'danger' // Red - confirmed issue

    default:
      return 'secondary'
  }
}

const getAnomalyTypeClass = (type: AnomalyType): string => {
  switch (type) {
    case 'fast_first':
      return 'fast-first'
    case 'fast_last':
      return 'fast-last'
    case 'fast_middle':
      return 'fast-middle'
    case 'fast_next_verse':
      return 'fast-next'
    case 'fast_previous_verse':
      return 'fast-previous'
    case 'slow_first':
      return 'slow-first'
    case 'slow_last':
      return 'slow-last'
    case 'slow_middle':
      return 'slow-middle'
    case 'slow_next_verse':
      return 'slow-next'
    case 'slow_previous_verse':
      return 'slow-previous'
    case 'manual':
      return 'manual'
    case 'ai_likely_false_positive':
      return 'ai-lfp'
    case 'ai_review_recommended':
      return 'ai-review'
    case 'ai_likely_problem':
      return 'ai-likely-problem'
    case 'ai_problem':
      return 'ai-problem'
    default:
      return ''
  }
}

const getRatioClass = (ratio: number): string => {
  if (ratio > 10) {
    return 'text-red-600 font-bold'
  } else if (ratio > 3) {
    return 'text-orange-600 font-semibold'
  }
  return 'text-gray-600'
}

const getRatioSeverity = (ratio: number): string => {
  if (ratio > 10) {
    return 'danger' // Red for values above 10 - high contrast
  } else if (ratio > 3) {
    return 'warn' // Orange for values above 3 up to 10 - medium contrast
  }
  return 'info' // Blue for values up to 3 - better contrast than gray in dark theme
}

const getInfoTooltip = (anomaly: VoiceAnomalyModel): string => {
  const parts = []
  if (anomaly.duration !== null) {
    parts.push(`Duration: ${anomaly.duration.toFixed(3)}s`)
  }
  if (anomaly.speed !== null) {
    parts.push(`Speed: ${anomaly.speed.toFixed(2)}`)
  }
  if (anomaly.position_in_verse) {
    parts.push(`Position in verse: ${anomaly.position_in_verse}`)
  }
  if (anomaly.position_from_end) {
    parts.push(`Position from end: ${anomaly.position_from_end}`)
  }
  return parts.join('\n')
}

// Status display functions
const getStatusLabel = (status: AnomalyStatus): string => {
  const statusMap = {
    'detected': 'Detected',
    'confirmed': 'Confirmed',
    'disproved': 'Disproved',
    'corrected': 'Corrected',
    'already_resolved': 'Already Resolved',
    'disproved_whisper': 'Disproved (Whisper)'
  }
  return statusMap[status] || status
}

const getStatusSeverity = (status: AnomalyStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' => {
  const severityMap = {
    'detected': 'warn' as const,     // yellow
    'confirmed': 'danger' as const,  // red
    'disproved': 'success' as const, // green
    'corrected': 'success' as const, // green
    'already_resolved': 'success' as const, // green
    'disproved_whisper': 'success' as const  // green
  }
  return severityMap[status] || 'secondary'
}

// Function to handle status change
const handleStatusChange = async (anomaly: VoiceAnomalyModel, newStatus: AnomalyStatus, showToast: boolean = true) => {
  try {
    // Direct API call without global loading state
    const result = await adminApiService.updateAnomalyStatus(anomaly.code, newStatus)
    if (result) {
      // Update the anomaly in the local list
      const index = anomalies.value.findIndex(a => a.code === anomaly.code)
      if (index !== -1) {
        anomalies.value[index] = result
      }
      
      // Update currentVerse if it matches the updated anomaly
      if (currentVerse.value && currentVerse.value.code === anomaly.code) {
        currentVerse.value = result
        console.log('Updated currentVerse.value status to:', result.status)
      }
      if (showToast) {
        toast.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Anomaly status changed to ${getStatusLabel(newStatus)}`,
          life: 3000
        })
      }
    }
  } catch (error: any) {
    console.error('Error updating anomaly status:', error)
    if (showToast) {
      // Extract detailed error message from API response
      let errorMessage = 'Failed to update anomaly status. Please try again.'

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: errorMessage,
        life: 5000
      })
    }
  }
}

// Function to check if current viewport is mobile
const isMobile = ref(false)

// Status popover management
const statusPopovers = ref<Map<number, any>>(new Map())

const setStatusPopoverRef = (el: any, anomalyCode: number) => {
  if (el) {
    statusPopovers.value.set(anomalyCode, el)
  }
}

const toggleStatusPopover = (event: Event, anomalyCode: number) => {
  const popover = statusPopovers.value.get(anomalyCode)
  if (popover) {
    popover.toggle(event)
  }
}

const selectStatus = async (anomaly: VoiceAnomalyModel, newStatus: AnomalyStatus) => {
  // Close the popover
  const popover = statusPopovers.value.get(anomaly.code)
  if (popover) {
    popover.hide()
  }

  // Update the status
  await handleStatusChange(anomaly, newStatus)
}

// Function to highlight currently playing row
const getRowClass = (data: VoiceAnomalyModel) => {
  if (currentPlayingId.value === data.code) {
    return 'p-highlight playing-row'
  }
  return ''
}

// Function to apply inline styles to the currently playing row
const getRowStyle = (data: VoiceAnomalyModel) => {
  if (currentPlayingId.value === data.code) {
    // Determine dark theme by document class
    const isDarkTheme = document.documentElement.classList.contains('dark')

    if (isDarkTheme) {
      return {
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        borderBottom: 'none',
        fontWeight: '500'
      }
    } else {
      return {
        backgroundColor: '#e3f2fd',
        borderBottom: 'none',
        fontWeight: '500'
      }
    }
  }
  return {}
}

// Grouped anomalies by verse
const groupedAnomalies = computed(() => {
  if (!anomalies.value) return []
  
  const groups = new Map()
  const result: any[] = []
  
  anomalies.value.forEach(anomaly => {
    const key = `${anomaly.book_number}-${anomaly.chapter_number}-${anomaly.verse_number}`
    
    if (!groups.has(key)) {
      // Create new group with first anomaly's data
      const group = {
        ...anomaly, // Keep all original fields
        anomalies: [anomaly],
        maxRatio: anomaly.ratio,
        anomalyTypes: [anomaly.anomaly_type],
        anomalyCount: 1
      }
      groups.set(key, group)
      result.push(group)
    } else {
      // Update existing group
      const group = groups.get(key)
      group.anomalies.push(anomaly)
      group.maxRatio = Math.max(group.maxRatio, anomaly.ratio)
      if (!group.anomalyTypes.includes(anomaly.anomaly_type)) {
        group.anomalyTypes.push(anomaly.anomaly_type)
      }
      group.anomalyCount = group.anomalies.length
    }
  })
  
  return result
})

// Adaptive page size based on screen size
const defaultPageSize = computed(() => isMobile.value ? 10 : 15)

// Audio player computed properties
const progressPercentage = computed(() => {
  if (!duration.value || duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

// Navigation computed properties
const canPlayPreviousVerse = computed(() => {
  if (!currentExcerptVerse.value || !adjacentVerses.value.length) return false
  return adjacentVerses.value.some(verse => verse.number < currentExcerptVerse.value!.number)
})

const canPlayNextVerse = computed(() => {
  if (!currentExcerptVerse.value || !adjacentVerses.value.length) return false
  return adjacentVerses.value.some(verse => verse.number > currentExcerptVerse.value!.number)
})

// Correction interface computed properties
const shouldShowCorrectionInterface = computed(() => {
  const result = currentVerse.value?.status === 'confirmed' || currentVerse.value?.status === 'corrected'
  console.log('shouldShowCorrectionInterface:', result, 'currentVerse.status:', currentVerse.value?.status)
  return result
})

const hasTimingChanges = computed(() => {
  return correctionStartTime.value !== originalStartTime.value ||
    correctionEndTime.value !== originalEndTime.value
})

// Check if status can be changed (only if current status is 'detected')
const canChangeStatus = computed(() => {
  return currentVerse.value?.status === 'detected'
})

// Function to truncate text on mobile
const truncateText = (text: string, maxLength: number = 25): string => {
  if (!isMobile.value || !text) return text
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Update mobile state on window resize
const updateMobileState = () => {
  isMobile.value = window.innerWidth < 640
}

// Audio player methods
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatTimeWithMs = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

// Helper function to get anomaly types as array
const getAnomalyTypesArray = (anomaly: any): string[] => {
  if (!anomaly) return []
  
  // Check if it's a grouped anomaly with multiple types
  if (anomaly.anomalyTypes && Array.isArray(anomaly.anomalyTypes)) {
    return anomaly.anomalyTypes
  }
  
  // Single anomaly type
  if (anomaly.anomaly_type) {
    return [anomaly.anomaly_type]
  }
  
  return []
}

const highlightProblematicWord = (verseText: string, problematicWord: string | null, positionInVerse: number | null, positionFromEnd: number | null, anomalyTypes: string[]): string => {
  if (!verseText) return verseText || ''

  // Split the verse text into words
  // We'll use a regex that matches words and non-words to preserve everything
  const parts = verseText.split(/([\p{L}\p{N}]+)/u).filter(p => p !== '')
  const words = parts.filter(p => /[\p{L}\p{N}]/u.test(p))

  // Determine which words need special styling
  const wordStyles = new Map<number, { highlight: boolean, underline: boolean }>()

  // Handle special anomaly types that require underlining or highlighting specific words
  if (anomalyTypes.includes('fast_previous_verse') && words.length > 0) {
    // Underline first word for Fast Previous Verse
    const existingStyle = wordStyles.get(0) || { highlight: false, underline: false }
    wordStyles.set(0, { ...existingStyle, underline: true })
  }
  if (anomalyTypes.includes('fast_next_verse') && words.length > 0) {
    // Underline last word for Fast Next Verse
    const lastWordIndex = words.length - 1
    const existingStyle = wordStyles.get(lastWordIndex) || { highlight: false, underline: false }
    wordStyles.set(lastWordIndex, { ...existingStyle, underline: true })
  }
  if (anomalyTypes.includes('fast_first') && words.length > 0) {
    // Highlight first word for Fast First
    const existingStyle = wordStyles.get(0) || { highlight: false, underline: false }
    wordStyles.set(0, { ...existingStyle, highlight: true })
  }
  if (anomalyTypes.includes('fast_last') && words.length > 0) {
    // Highlight last word for Fast Last
    const lastWordIndex = words.length - 1
    const existingStyle = wordStyles.get(lastWordIndex) || { highlight: false, underline: false }
    wordStyles.set(lastWordIndex, { ...existingStyle, highlight: true })
  }
  if (anomalyTypes.includes('slow_first') && words.length > 0) {
    // Highlight first word for Slow First
    const existingStyle = wordStyles.get(0) || { highlight: false, underline: false }
    wordStyles.set(0, { ...existingStyle, highlight: true })
  }
  if (anomalyTypes.includes('slow_last') && words.length > 0) {
    // Highlight last word for Slow Last
    const lastWordIndex = words.length - 1
    const existingStyle = wordStyles.get(lastWordIndex) || { highlight: false, underline: false }
    wordStyles.set(lastWordIndex, { ...existingStyle, highlight: true })
  }
  if (anomalyTypes.includes('slow_previous_verse') && words.length > 0) {
    // Underline first word for Slow Previous Verse
    const existingStyle = wordStyles.get(0) || { highlight: false, underline: false }
    wordStyles.set(0, { ...existingStyle, underline: true })
  }
  if (anomalyTypes.includes('slow_next_verse') && words.length > 0) {
    // Underline last word for Slow Next Verse
    const lastWordIndex = words.length - 1
    const existingStyle = wordStyles.get(lastWordIndex) || { highlight: false, underline: false }
    wordStyles.set(lastWordIndex, { ...existingStyle, underline: true })
  }

  // Handle problematic word highlighting
  if (problematicWord && (positionInVerse !== null || positionFromEnd !== null)) {
    // Find the correct word index using position information
    let targetIndex = -1

    if (positionInVerse !== null) {
      // Position is 1-indexed in the API
      targetIndex = positionInVerse - 1
    } else if (positionFromEnd !== null && parts.length > 0) {
      // Calculate from the end if position_from_end is available
      // Count only actual words (not spaces/punctuation)
      const wordCount = parts.filter(p => /[\p{L}\p{N}]/u.test(p)).length
      targetIndex = wordCount - positionFromEnd
    }

    if (targetIndex >= 0) {
      // Add or update styling for the problematic word
      const existingStyle = wordStyles.get(targetIndex) || { highlight: false, underline: false }
      wordStyles.set(targetIndex, { ...existingStyle, highlight: true })
    }
  }

  // Apply styling to the text
  let wordIndex = -1
  let resultText = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // If this is a word (not punctuation or space)
    if (/[\p{L}\p{N}]/u.test(part)) {
      wordIndex++
      const style = wordStyles.get(wordIndex)

      if (style) {
        // Build CSS classes based on required styling
        const classes = []
        if (style.highlight) {
          classes.push('text-red-600', 'font-semibold', 'bg-red-50', 'dark:bg-red-900/20', 'px-1', 'rounded')
        }
        if (style.underline) {
          classes.push('underline', 'decoration-2', 'decoration-blue-500')
        }
        
        resultText += `<span class="${classes.join(' ')}">${part}</span>`
      } else {
        resultText += part
      }
    } else {
      // Add non-word parts as is
      resultText += part
    }
  }

  return resultText
}

// Helper function to highlight specific word by index
const highlightSpecificWord = (verseText: string, parts: string[], wordIndex: number, style: 'highlight' | 'underline'): string => {
  let currentWordIndex = -1
  let resultText = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    // If this is a word (not punctuation or space)
    if (/[\p{L}\p{N}]/u.test(part)) {
      currentWordIndex++

      // If this is our target word
      if (currentWordIndex === wordIndex) {
        if (style === 'underline') {
          resultText += `<span class="underline decoration-2 decoration-blue-500">${part}</span>`
        } else {
          resultText += `<span class="text-red-600 font-semibold bg-red-50 dark:bg-red-900/20 px-1 rounded">${part}</span>`
        }
      } else {
        resultText += part
      }
    } else {
      // Add non-word parts as is
      resultText += part
    }
  }

  return resultText
}

// Function to get alternative audio URL from structured API error response
const getAlternativeAudioUrl = async (originalUrl: string): Promise<string | null> => {
  try {
    const response = await fetchWithAuth(originalUrl)
    if (response.status === 404) {
      const errorData = await response.json()
      if (errorData.detail && errorData.detail.alternative_url) {
        return errorData.detail.alternative_url
      }
    }
    return null
  } catch (error) {
    return null
  }
}

// Function to get excerpt data with adjacent verses
const getExcerptData = async (anomaly: VoiceAnomalyModel): Promise<{ excerpt: ExcerptResponse, targetVerse: ExcerptVerseModel, audioUrl: string } | null> => {
  try {
    // Get translation code from selected voice
    const selectedVoiceData = availableVoices.value.find(v => v.code === anomaly.voice)
    if (!selectedVoiceData) {
      console.error('Voice not found for code:', anomaly.voice)
      return null
    }

    // Get book alias from books data
    const book = books.value.find(b => b.book_number === anomaly.book_number)
    if (!book) {
      console.error('Book not found for number:', anomaly.book_number)
      return null
    }

    // Calculate verse range (current verse ± 1)
    const startVerse = Math.max(1, anomaly.verse_number - 1)
    const endVerse = anomaly.verse_number + 1

    // Build excerpt string: "gen 1:3-5" format
    const excerptString = `${book.alias} ${anomaly.chapter_number}:${startVerse}-${endVerse}`

    console.log('Requesting excerpt:', excerptString)

    // Request excerpt data
    const excerptData = await adminApiService.getExcerptWithAlignment({
      translation: selectedVoiceData.translation.code,
      excerpt: excerptString,
      voice: anomaly.voice
    })

    if (!excerptData.parts || excerptData.parts.length === 0) {
      console.error('No parts in excerpt response')
      return null
    }

    const part = excerptData.parts[0]

    // Find the target verse in the response
    const targetVerse = part.verses.find(v => v.number === anomaly.verse_number)
    if (!targetVerse) {
      console.error('Target verse not found in excerpt response')
      return null
    }

    console.log('Excerpt data received:', {
      title: excerptData.title,
      audioUrl: part.audio_link,
      versesCount: part.verses.length,
      targetVerse: targetVerse.number
    })

    return {
      excerpt: excerptData,
      targetVerse,
      audioUrl: part.audio_link
    }

  } catch (error) {
    console.error('Error fetching excerpt data:', error)
    return null
  }
}

// Web Audio API helper functions for precise timing control

// Initialize AudioContext (lazy initialization)
const getAudioContext = (): AudioContext => {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  // Resume if suspended (browser autoplay policy)
  if (audioContext.value.state === 'suspended') {
    audioContext.value.resume()
  }
  return audioContext.value
}

// Load audio file into AudioBuffer
const loadAudioBuffer = async (url: string): Promise<AudioBuffer> => {
  const ctx = getAudioContext()
  const authUrl = createAudioUrlWithAuth(url)

  const response = await fetch(authUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = await ctx.decodeAudioData(arrayBuffer)
  return buffer
}

// Play audio segment with precise timing using Web Audio API
const playAudioSegment = (
  buffer: AudioBuffer,
  startTime: number,
  endTime: number,
  onEnded?: () => void
): AudioBufferSourceNode => {
  const ctx = getAudioContext()

  // Stop any existing source
  if (sourceNode.value) {
    try {
      sourceNode.value.stop()
      sourceNode.value.disconnect()
    } catch (e) {
      // Ignore errors if already stopped
    }
  }

  // Create new source node
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)

  // Calculate duration
  const segmentDuration = endTime - startTime

  // Set up onended callback - this fires EXACTLY when playback ends
  source.onended = () => {
    // Robust check: Ignore if this source is no longer the active one
    if (source !== sourceNode.value) {
      return
    }

    if (onEnded) {
      onEnded()
    }
  }

  // Start playback: start(when, offset, duration)
  // - when: 0 = start immediately
  // - offset: startTime = position in buffer to start from
  // - duration: segmentDuration = how long to play
  source.start(0, startTime, segmentDuration)

  // Store reference and timing info
  sourceNode.value = source
  audioStartTime.value = ctx.currentTime
  audioOffset.value = startTime

  return source
}

// Stop current playback
const stopAudioPlayback = () => {
  if (sourceNode.value) {
    try {
      sourceNode.value.stop()
      sourceNode.value.disconnect()
    } catch (e) {
      // Ignore errors if already stopped
    }
    sourceNode.value = null
  }

  // Cancel animation frame
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }
}

// Start requestAnimationFrame loop for updating currentTime display (60 FPS)
const startTimeUpdateInterval = (verseBegin: number, verseDuration: number) => {
  // Cancel existing animation frame
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }

  const ctx = getAudioContext()

  const updateTime = () => {
    if (!sourceNode.value || !isPlaying.value) {
      animationFrameId.value = null
      return
    }

    // Calculate current position within the verse
    const elapsed = ctx.currentTime - audioStartTime.value
    const currentPosition = audioOffset.value - verseBegin + elapsed
    currentTime.value = Math.max(0, Math.min(currentPosition, verseDuration))

    // Schedule next update
    animationFrameId.value = requestAnimationFrame(updateTime)
  }

  // Start the animation loop
  animationFrameId.value = requestAnimationFrame(updateTime)
}

// Get current playback position
const getCurrentPlaybackPosition = (): number => {
  if (!audioContext.value || !sourceNode.value) {
    return audioOffset.value
  }
  const elapsed = audioContext.value.currentTime - audioStartTime.value
  return audioOffset.value + elapsed
}

const playVerse = async (anomaly: VoiceAnomalyModel) => {
  try {
    // Reset correction interface when switching verses
    showCorrectionInterface.value = false

    // Clear auto-accept timer when starting new verse playback
    clearAutoAcceptTimer()

    // Reset quick check flags
    isQuickCheckActive.value = false
    shouldStopQuickCheck.value = false

    // Ensure translations are loaded
    if (voices.value.length === 0) {
      await fetchTranslations()
    }

    // Stop current playback if any (Web Audio API)
    stopAudioPlayback()

    // Also stop HTMLAudioElement if exists (for backward compatibility during transition)
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }

    // Clear any existing interval
    if (progressUpdateInterval.value) {
      clearInterval(progressUpdateInterval.value)
      progressUpdateInterval.value = null
    }

    // Set current verse and show player immediately to display verse text
    currentVerse.value = anomaly
    currentPlayingId.value = anomaly.code
    currentVerseType.value = 'original' // Set as original verse

    // Store original verse number only if it's not already set (first time playing)
    if (originalVerseNumber.value === null) {
      originalVerseNumber.value = anomaly.verse_number
    }

    showPlayer.value = true // Show player immediately to display verse text
    isPlaying.value = false // Set to false initially

    // Get excerpt data with adjacent verses
    const excerptResult = await getExcerptData(anomaly)
    if (!excerptResult) {
      toast.add({
        severity: 'error',
        summary: 'Audio Error',
        detail: 'Unable to load verse data. Please try again.',
        life: 5000
      })
      stopPlaying()
      return
    }

    // Store excerpt data
    currentExcerpt.value = excerptResult.excerpt
    currentExcerptVerse.value = excerptResult.targetVerse
    adjacentVerses.value = excerptResult.excerpt.parts[0].verses

    // Validate timing data
    if (!currentExcerptVerse.value ||
        typeof currentExcerptVerse.value.begin !== 'number' ||
        typeof currentExcerptVerse.value.end !== 'number' ||
        isNaN(currentExcerptVerse.value.begin) ||
        isNaN(currentExcerptVerse.value.end)) {
      console.error('Invalid verse timing data:', currentExcerptVerse.value)
      toast.add({
        severity: 'error',
        summary: 'Audio Error',
        detail: 'Invalid verse timing data. Cannot play specific verse segment.',
        life: 5000
      })
      stopPlaying()
      return
    }

    console.log('Loading audio via Web Audio API from URL:', excerptResult.audioUrl)

    // Load audio using Web Audio API
    let buffer: AudioBuffer
    try {
      buffer = await loadAudioBuffer(excerptResult.audioUrl)
      audioBuffer.value = buffer
      console.log('Audio buffer loaded successfully, duration:', buffer.duration)
    } catch (loadError) {
      console.error('Failed to load audio buffer:', loadError)

      // Try alternative URL
      console.log('Attempting to fetch alternative audio URL...')
      const alternativeUrl = await getAlternativeAudioUrl(excerptResult.audioUrl)

      if (alternativeUrl) {
        console.log('Found alternative URL:', alternativeUrl)
        try {
          buffer = await loadAudioBuffer(alternativeUrl)
          audioBuffer.value = buffer
          console.log('Alternative audio buffer loaded successfully')
        } catch (altError) {
          console.error('Failed to load alternative audio buffer:', altError)
          toast.add({
            severity: 'error',
            summary: 'Audio Error',
            detail: 'Audio file not available. Please try again later.',
            life: 5000
          })
          stopPlaying()
          return
        }
      } else {
        toast.add({
          severity: 'error',
          summary: 'Audio Error',
          detail: 'Failed to load audio file. Please try again.',
          life: 5000
        })
        stopPlaying()
        return
      }
    }

    // Set duration for UI
    const verseBegin = currentExcerptVerse.value.begin
    const verseEnd = currentExcerptVerse.value.end
    const verseDuration = verseEnd - verseBegin

    currentTime.value = 0
    duration.value = verseDuration

    // Show player and set playing state
    showPlayer.value = true
    isPlaying.value = true

    // If quick check mode is enabled, handle special playback
    if (quickCheckMode.value && verseDuration >= 6) {
      handleQuickCheckPlayback()
    } else {
      // Normal playback: play verse segment with precise timing
      // The onended callback fires EXACTLY when the segment ends (sub-millisecond precision)
      playAudioSegment(buffer, verseBegin, verseEnd, () => {
        // This callback fires exactly when playback ends - no delay!
        onAudioComplete()
      })

      // Start interval for updating currentTime display
      startTimeUpdateInterval(verseBegin, verseDuration)
    }

    // Auto-open correction interface for confirmed and corrected anomalies
    if ((anomaly.status === 'confirmed' || anomaly.status === 'corrected') && currentExcerptVerse.value) {
      initializeCorrectionInterface()
    }

  } catch (error: any) {
    console.error('Error playing verse:', error)

    // Extract detailed error message from API response
    let errorMessage = 'Unable to play verse audio. Please check your connection and try again.'

    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Playback Error',
      detail: errorMessage,
      life: 5000
    })
    stopPlaying()
  }
}

const togglePlayPause = () => {
  // If audio completed and no source node, restart playback from beginning
  if (!sourceNode.value && !audioElement.value && currentVerse.value) {
    showButtonAnimation.value = false
    // Reset timeline before restarting
    currentTime.value = 0
    playVerse(currentVerse.value)
    return
  }

  // Web Audio API doesn't support pause/resume on the same source node
  // We need to stop and recreate for resume functionality
  if (isPlaying.value) {
    // Interrupt quick check playback if active
    if (isQuickCheckActive.value) {
      shouldStopQuickCheck.value = true
      isQuickCheckActive.value = false
    }

    // Store current position before stopping
    if (sourceNode.value && audioContext.value) {
      const elapsed = audioContext.value.currentTime - audioStartTime.value
      audioOffset.value = audioOffset.value + elapsed
    }

    // Stop playback
    stopAudioPlayback()

    // Also stop HTMLAudioElement if exists (backward compatibility)
    if (audioElement.value) {
      audioElement.value.pause()
    }

    isPlaying.value = false
  } else {
    // Resume playback from stored position
    if (audioBuffer.value && currentExcerptVerse.value) {
      const verseBegin = currentExcerptVerse.value.begin
      const verseEnd = currentExcerptVerse.value.end
      const verseDuration = verseEnd - verseBegin

      // Resume from audioOffset (which is absolute position in audio file)
      playAudioSegment(audioBuffer.value, audioOffset.value, verseEnd, () => {
        onAudioComplete()
      })
      startTimeUpdateInterval(verseBegin, verseDuration)
      isPlaying.value = true
    } else if (audioElement.value) {
      // Fallback to HTMLAudioElement if exists
      audioElement.value.play()
      isPlaying.value = true
    }
  }
}

// Function to seek to position when clicking on timeline
const seekToPosition = (event: MouseEvent) => {
  if (!currentExcerptVerse.value || duration.value <= 0) return
  if (!audioBuffer.value && !audioElement.value) return

  const progressBar = event.currentTarget as HTMLElement
  const rect = progressBar.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progressBarWidth = rect.width

  // Calculate the percentage of where the user clicked
  const clickPercentage = Math.max(0, Math.min(1, clickX / progressBarWidth))

  // Calculate the new time position within the verse
  const newTime = clickPercentage * duration.value

  // For verse segments using excerpt data
  const verseStartTime = currentExcerptVerse.value.begin
  const verseEndTime = currentExcerptVerse.value.end
  const actualNewTime = Math.min(verseStartTime + newTime, verseEndTime)

  // Update the current time display immediately
  currentTime.value = newTime

  // Web Audio API: need to stop and restart from new position
  if (audioBuffer.value) {
    const wasPlaying = isPlaying.value

    // Stop current playback
    stopAudioPlayback()

    // Update offset to new position
    audioOffset.value = actualNewTime

    // If was playing, restart from new position
    if (wasPlaying) {
      playAudioSegment(audioBuffer.value, actualNewTime, verseEndTime, () => {
        onAudioComplete()
      })
      startTimeUpdateInterval(verseStartTime, duration.value)
    }
  } else if (audioElement.value) {
    // Fallback to HTMLAudioElement
    audioElement.value.currentTime = actualNewTime
  }
}

// Function to handle quick check playback: first 2s, pause 0.5s, last 2s
// Uses Web Audio API for precise timing
const handleQuickCheckPlayback = async () => {
  if (!currentExcerptVerse.value || !audioBuffer.value) return

  const buffer = audioBuffer.value
  const verseBegin = currentExcerptVerse.value.begin
  const verseEnd = currentExcerptVerse.value.end
  const verseDuration = verseEnd - verseBegin

  // If verse is shorter than 6 seconds, play normally (this check is redundant but kept for safety)
  if (verseDuration < 6) {
    isQuickCheckActive.value = false
    // Play normally
    playAudioSegment(buffer, verseBegin, verseEnd, () => {
      onAudioComplete()
    })
    startTimeUpdateInterval(verseBegin, verseDuration)
    return
  }

  // Mark quick check as active and reset stop flag
  isQuickCheckActive.value = true
  shouldStopQuickCheck.value = false

  try {
    // Play first 2 seconds using Web Audio API with precise timing
    const firstSegmentEnd = verseBegin + 2

    await new Promise<void>((resolve, reject) => {
      if (shouldStopQuickCheck.value) {
        reject(new Error('Quick check interrupted'))
        return
      }

      playAudioSegment(buffer, verseBegin, firstSegmentEnd, () => {
        // This fires exactly when 2 seconds have elapsed
        resolve()
      })

      // Update UI during first segment
      startTimeUpdateInterval(verseBegin, verseDuration)
    })

    // Check if we should stop
    if (shouldStopQuickCheck.value) {
      isQuickCheckActive.value = false
      stopAudioPlayback()
      return
    }

    // Pause for 0.5 seconds
    stopAudioPlayback()
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (shouldStopQuickCheck.value) {
          reject(new Error('Quick check interrupted'))
        } else {
          resolve()
        }
      }, 500)
    })

    // Check if we should stop
    if (shouldStopQuickCheck.value) {
      isQuickCheckActive.value = false
      return
    }

    // Play last 2 seconds
    const lastSegmentStart = Math.max(verseBegin, verseEnd - 2)

    await new Promise<void>((resolve, reject) => {
      if (shouldStopQuickCheck.value) {
        reject(new Error('Quick check interrupted'))
        return
      }

      playAudioSegment(buffer, lastSegmentStart, verseEnd, () => {
        // This fires exactly when playback ends
        resolve()
      })

      // Update UI - show progress from last segment start using requestAnimationFrame
      const ctx = getAudioContext()
      if (animationFrameId.value) {
        cancelAnimationFrame(animationFrameId.value)
      }
      const updateQuickCheckTime = () => {
        if (!sourceNode.value || !isPlaying.value) {
          animationFrameId.value = null
          return
        }
        const elapsed = ctx.currentTime - audioStartTime.value
        const currentPosition = lastSegmentStart - verseBegin + elapsed
        currentTime.value = Math.max(0, Math.min(currentPosition, verseDuration))
        animationFrameId.value = requestAnimationFrame(updateQuickCheckTime)
      }
      animationFrameId.value = requestAnimationFrame(updateQuickCheckTime)
    })

    // Complete playback
    isQuickCheckActive.value = false
    if (!shouldStopQuickCheck.value) {
      onAudioComplete()
    }
  } catch (error) {
    console.error('Error in quick check playback:', error)
    isQuickCheckActive.value = false
    stopAudioPlayback()
    // Only call onAudioComplete if it wasn't interrupted by user action
    if (!shouldStopQuickCheck.value) {
      onAudioComplete()
    }
  }
}

// Function to handle audio completion without closing player
const onAudioComplete = () => {
  // Stop Web Audio API playback
  stopAudioPlayback()

  // Also stop HTMLAudioElement if exists (backward compatibility)
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }

  // Clear source node but keep buffer for potential replay
  sourceNode.value = null

  isPlaying.value = false
  // Set currentTime to duration to ensure 100% progress
  if (duration.value > 0) {
    currentTime.value = duration.value
  }

  // Start button animation to prompt user action
  showButtonAnimation.value = true

  // Start auto-accept timer if enabled
  startAutoAcceptTimer()
}

const stopPlaying = () => {
  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }

  // Stop Web Audio API playback
  stopAudioPlayback()

  // Also stop HTMLAudioElement if exists (backward compatibility)
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }

  if (progressUpdateInterval.value) {
    clearInterval(progressUpdateInterval.value)
    progressUpdateInterval.value = null
  }

  // Clear auto-accept timer
  clearAutoAcceptTimer()

  showPlayer.value = false
  isPlaying.value = false
  currentVerse.value = null
  currentPlayingId.value = null
  currentTime.value = 0
  duration.value = 0
  showButtonAnimation.value = false
  shouldStopQuickCheck.value = false
  currentVerseType.value = 'original' // Reset to original verse type
  originalVerseNumber.value = null // Clear original verse number

  // Clear Web Audio API state
  audioBuffer.value = null
  sourceNode.value = null
  audioOffset.value = 0

  // Clear excerpt data
  currentExcerpt.value = null
  currentExcerptVerse.value = null
  adjacentVerses.value = []

  // Close navigation menu
  showNavigationMenu.value = false
}

// Function to find next anomaly in the list with status 'detected'
const findNextAnomaly = (): VoiceAnomalyModel | null => {
  if (!currentVerse.value || !groupedAnomalies.value.length) {
    return null
  }

  // Get current verse coordinates
  const currentVerseKey = `${currentVerse.value.book_number}-${currentVerse.value.chapter_number}-${currentVerse.value.verse_number}`
  
  // Find current verse group in grouped anomalies
  const currentGroupIndex = groupedAnomalies.value.findIndex(group => {
    const groupKey = `${group.book_number}-${group.chapter_number}-${group.verse_number}`
    return groupKey === currentVerseKey
  })

  if (currentGroupIndex >= 0) {
    // Search for next verse group with at least one anomaly with status 'detected'
    for (let i = currentGroupIndex + 1; i < groupedAnomalies.value.length; i++) {
      const group = groupedAnomalies.value[i]
      
      // Check if this group has any anomalies with status 'detected'
      if (group.anomalies && Array.isArray(group.anomalies)) {
        const hasDetectedAnomaly = group.anomalies.some((a: VoiceAnomalyModel) => a.status === 'detected')
        if (hasDetectedAnomaly) {
          // Return the first anomaly from this group (or the group itself)
          return group
        }
      } else if (group.status === 'detected') {
        // Single anomaly (not grouped)
        return group
      }
    }
  }

  return null
}

// Function to advance to next verse if auto-advance is enabled
const advanceToNextVerse = async () => {
  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }
  
  if (autoAdvanceToNext.value) {
    const nextAnomaly = findNextAnomaly()
    if (nextAnomaly) {
      // Small delay to show the status change before advancing
      setTimeout(() => {
        playVerse(nextAnomaly)
      }, 500)
    } else {
      // No more anomalies, just stop playing
      stopPlaying()
    }
  } else {
    stopPlaying()
  }
}

// Auto-accept timer functions
const startAutoAcceptTimer = () => {
  // Clear any existing timer
  clearAutoAcceptTimer()
  
  // Only start timer if auto-accept is enabled, auto-advance is enabled, and verse status is 'detected'
  if (!autoAcceptOnTimer.value || !autoAdvanceToNext.value || !currentVerse.value || currentVerse.value.status !== 'detected') {
    return
  }
  
  // Initialize remaining time in deciseconds (tenths of a second)
  // Multiply by 10 to get smooth animation with 100ms intervals
  autoAcceptTimeRemaining.value = autoAcceptTimerDuration.value * 10
  autoAcceptTimerPaused.value = false
  
  // Start countdown timer with 100ms intervals
  autoAcceptTimerId.value = window.setInterval(() => {
    // Skip countdown if paused
    if (autoAcceptTimerPaused.value) {
      return
    }
    
    autoAcceptTimeRemaining.value -= 1
    
    if (autoAcceptTimeRemaining.value <= 0) {
      clearAutoAcceptTimer()
      // Auto-accept the verse as correct
      disproveAnomaly()
    }
  }, 100)
}

const toggleAutoAcceptTimer = () => {
  // Toggle pause state
  autoAcceptTimerPaused.value = !autoAcceptTimerPaused.value
}

const clearAutoAcceptTimer = () => {
  if (autoAcceptTimerId.value !== null) {
    clearInterval(autoAcceptTimerId.value)
    autoAcceptTimerId.value = null
  }
  autoAcceptTimeRemaining.value = 0
  autoAcceptTimerPaused.value = false
}

// Navigation menu functions
const toggleNavigationMenu = () => {
  showNavigationMenu.value = !showNavigationMenu.value
}

// Function to determine verse type based on verse number
const determineVerseType = (verseNumber: number): 'original' | 'previous' | 'next' => {
  if (originalVerseNumber.value === null) {
    return 'original'
  }
  
  if (verseNumber === originalVerseNumber.value) {
    return 'original'
  } else if (verseNumber < originalVerseNumber.value) {
    return 'previous'
  } else {
    return 'next'
  }
}

const playPreviousVerse = async () => {
  if (!canPlayPreviousVerse.value || !currentExcerptVerse.value) return

  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }

  // Find previous verse in adjacent verses
  const previousVerse = adjacentVerses.value
    .filter(verse => verse.number < currentExcerptVerse.value!.number)
    .sort((a, b) => b.number - a.number)[0] // Get the highest number that's less than current

  if (previousVerse && currentVerse.value) {
    // Create a mock anomaly for the previous verse to play it
    const previousAnomalyMock: VoiceAnomalyModel = {
      ...currentVerse.value,
      verse_number: previousVerse.number
    }

    showNavigationMenu.value = false
    await playVerse(previousAnomalyMock)
    // Small delay to ensure playVerse is complete
    await new Promise(resolve => setTimeout(resolve, 100))
    // Determine verse type based on verse number
    currentVerseType.value = determineVerseType(previousVerse.number)
  }
}

const playNextVerse = async () => {
  if (!canPlayNextVerse.value || !currentExcerptVerse.value) return

  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }

  // Find next verse in adjacent verses
  const nextVerse = adjacentVerses.value
    .filter(verse => verse.number > currentExcerptVerse.value!.number)
    .sort((a, b) => a.number - b.number)[0] // Get the lowest number that's greater than current

  if (nextVerse && currentVerse.value) {
    // Create a mock anomaly for the next verse to play it
    const nextAnomalyMock: VoiceAnomalyModel = {
      ...currentVerse.value,
      verse_number: nextVerse.number
    }

    showNavigationMenu.value = false
    await playVerse(nextAnomalyMock)
    // Small delay to ensure playVerse is complete
    await new Promise(resolve => setTimeout(resolve, 100))
    // Determine verse type based on verse number
    currentVerseType.value = determineVerseType(nextVerse.number)
  }
}

// Helper function to update status for all anomalies in a group
const handleGroupStatusChange = async (anomalyOrGroup: any, newStatus: AnomalyStatus, showToast: boolean = true) => {
  // Check if this is a grouped anomaly (has 'anomalies' array)
  if (anomalyOrGroup.anomalies && Array.isArray(anomalyOrGroup.anomalies) && anomalyOrGroup.anomalies.length > 1) {
    // Update status for all anomalies in the group
    for (const anomaly of anomalyOrGroup.anomalies) {
      await handleStatusChange(anomaly, newStatus, false) // Don't show toast for each one
    }
    
    // Update the group object itself to reflect the new status
    anomalyOrGroup.status = newStatus
    if (anomalyOrGroup.anomalies) {
      anomalyOrGroup.anomalies.forEach((a: VoiceAnomalyModel) => {
        a.status = newStatus
      })
    }
    
    // Show single toast for the group
    if (showToast) {
      toast.add({
        severity: 'success',
        summary: 'Status Updated',
        detail: `${anomalyOrGroup.anomalies.length} anomalies status changed to ${getStatusLabel(newStatus)}`,
        life: 3000
      })
    }
  } else {
    // Single anomaly - update normally
    await handleStatusChange(anomalyOrGroup, newStatus, showToast)
  }
}

// Functions for anomaly status change from mini-player
const confirmAnomaly = async () => {
  if (currentVerse.value) {
    showButtonAnimation.value = false
    
    // Clear auto-accept timer when user manually confirms
    clearAutoAcceptTimer()
    
    // Interrupt quick check playback if active
    if (isQuickCheckActive.value) {
      shouldStopQuickCheck.value = true
      isQuickCheckActive.value = false
    }

    // Stop Web Audio API playback
    stopAudioPlayback()

    // Also stop HTMLAudioElement if exists (backward compatibility)
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
    if (progressUpdateInterval.value) {
      clearInterval(progressUpdateInterval.value)
      progressUpdateInterval.value = null
    }
    if (isPlaying.value) {
      isPlaying.value = false
    }

    console.log('Before handleStatusChange - currentVerse.status:', currentVerse.value.status)
    await handleGroupStatusChange(currentVerse.value, 'confirmed', !autoAdvanceToNext.value)
    console.log('After handleStatusChange - currentVerse.status:', currentVerse.value.status)
    // Initialize correction interface after confirming anomaly
    console.log('confirmAnomaly: currentExcerptVerse exists:', !!currentExcerptVerse.value)
    console.log('confirmAnomaly: currentVerse exists:', !!currentVerse.value)
    console.log('shouldShowCorrectionInterface value:', currentVerse.value?.status === 'confirmed')
    initializeCorrectionInterface()
    // Don't advance to next verse - keep the player open with correction interface
  }
}

const disproveAnomaly = async () => {
  if (currentVerse.value) {
    showButtonAnimation.value = false
    
    // Clear auto-accept timer when user manually disproves
    clearAutoAcceptTimer()
    
    // Interrupt quick check playback if active
    if (isQuickCheckActive.value) {
      shouldStopQuickCheck.value = true
      isQuickCheckActive.value = false
    }

    // Stop Web Audio API playback
    stopAudioPlayback()

    // Also stop HTMLAudioElement if exists (backward compatibility)
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value = null
    }
    if (progressUpdateInterval.value) {
      clearInterval(progressUpdateInterval.value)
      progressUpdateInterval.value = null
    }
    if (isPlaying.value) {
      isPlaying.value = false
    }

    await handleGroupStatusChange(currentVerse.value, 'disproved', !autoAdvanceToNext.value)
    await advanceToNextVerse()
  }
}

// Verse correction functions
const initializeCorrectionInterface = () => {
  if (currentExcerptVerse.value) {
    // Store original values
    originalStartTime.value = currentExcerptVerse.value.begin
    originalEndTime.value = currentExcerptVerse.value.end
    // Set current values
    correctionStartTime.value = currentExcerptVerse.value.begin
    correctionEndTime.value = currentExcerptVerse.value.end
    
    showCorrectionInterface.value = true
  }
}

const adjustStartTime = (delta: number) => {
  const newValue = correctionStartTime.value + delta
  if (newValue >= 0 && newValue < correctionEndTime.value) {
    correctionStartTime.value = newValue
  }
}

const adjustEndTime = (delta: number) => {
  const newValue = correctionEndTime.value + delta
  if (newValue > correctionStartTime.value) {
    correctionEndTime.value = newValue
  }
}

// Functions for automatic overlap correction
const correctBeginOverlap = () => {
  if (!currentExcerptVerse.value || !adjacentVerses.value) return
  
  const currentVerseNumber = currentExcerptVerse.value.number
  const previousVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber - 1)
  
  if (previousVerse && correctionStartTime.value < previousVerse.end) {
    // Set begin time to previous verse end + small gap (0.01s)
    correctionStartTime.value = previousVerse.end + 0.01
    
    // Ensure end time is still after begin time
    if (correctionEndTime.value <= correctionStartTime.value) {
      correctionEndTime.value = correctionStartTime.value + 0.1
    }
  }
}

const correctEndOverlap = () => {
  if (!currentExcerptVerse.value || !adjacentVerses.value) return
  
  const currentVerseNumber = currentExcerptVerse.value.number
  const nextVerse = adjacentVerses.value.find(v => v.number === currentVerseNumber + 1)
  
  if (nextVerse && correctionEndTime.value > nextVerse.begin) {
    // Set end time to next verse begin - small gap (0.01s)
    correctionEndTime.value = nextVerse.begin - 0.01
    
    // Ensure begin time is still before end time
    if (correctionStartTime.value >= correctionEndTime.value) {
      correctionStartTime.value = correctionEndTime.value - 0.1
    }
  }
}

const applyCorrectionChanges = async () => {
  if (!currentVerse.value) {
    console.error('No current verse selected')
    return
  }

  try {
    console.log('Applying corrections:', {
      anomalyCode: currentVerse.value.code,
      status: 'corrected',
      startTime: correctionStartTime.value,
      endTime: correctionEndTime.value
    })

    // Update anomaly status to 'corrected' with current timing values
    const result = await updateAnomalyStatus(
      currentVerse.value.code,
      'corrected',
      correctionStartTime.value,
      correctionEndTime.value
    )

    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Timing corrections applied successfully',
        life: 3000
      })

      // Close correction interface
      showCorrectionInterface.value = false

      // Refresh the anomalies list to reflect the status change
      await refreshAnomalies()
      
      // Advance to next verse if auto-advance is enabled
      await advanceToNextVerse()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to apply timing corrections',
        life: 5000
      })
    }
  } catch (error: any) {
    console.error('Error applying corrections:', error)

    // Extract detailed error message from API response
    let errorMessage = 'An error occurred while applying corrections'

    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  }
}

const resetCorrectionChanges = () => {
  // Reset to original values
  correctionStartTime.value = originalStartTime.value
  correctionEndTime.value = originalEndTime.value
}

// Preview functions for timing corrections using Web Audio API for precise timing
const previewStartTime = async () => {
  console.log('=== START TIME PREVIEW (Web Audio API) ===')

  if (!currentExcerptVerse.value || !currentExcerpt.value) {
    console.log('Early return: missing currentExcerptVerse or currentExcerpt')
    return
  }

  // Load audio buffer if not already loaded
  if (!audioBuffer.value) {
    console.log('Loading audio buffer for preview')
    const audioUrl = currentExcerpt.value.parts[0]?.audio_link
    if (!audioUrl) {
      console.log('No audio URL available')
      return
    }
    try {
      audioBuffer.value = await loadAudioBuffer(audioUrl)
    } catch (error) {
      console.error('Failed to load audio buffer:', error)
      return
    }
  }

  try {
    // Stop current playback
    stopAudioPlayback()
    isPlaying.value = false

    // For start time correction: play from corrected start for 2 seconds
    const startTime = correctionStartTime.value
    const endTime = Math.min(correctionStartTime.value + 2, correctionEndTime.value)
    console.log(`Preview start time: ${startTime}s to ${endTime}s (duration: ${endTime - startTime}s)`)

    // Play segment with precise timing - stops exactly at endTime
    isPlaying.value = true
    playAudioSegment(audioBuffer.value, startTime, endTime, () => {
      console.log('Preview playback ended precisely')
      isPlaying.value = false
    })

  } catch (error) {
    console.error('Error during start time preview:', error)
  }
}

const previewEndTime = async () => {
  console.log('=== END TIME PREVIEW (Web Audio API) ===')

  if (!currentExcerptVerse.value || !currentExcerpt.value) {
    console.log('Early return: missing currentExcerptVerse or currentExcerpt')
    return
  }

  // Load audio buffer if not already loaded
  if (!audioBuffer.value) {
    console.log('Loading audio buffer for preview')
    const audioUrl = currentExcerpt.value.parts[0]?.audio_link
    if (!audioUrl) {
      console.log('No audio URL available')
      return
    }
    try {
      audioBuffer.value = await loadAudioBuffer(audioUrl)
    } catch (error) {
      console.error('Failed to load audio buffer:', error)
      return
    }
  }

  try {
    // Stop current playback
    stopAudioPlayback()
    isPlaying.value = false

    // For end time correction: play 2 seconds before corrected end until end
    const startTime = Math.max(correctionEndTime.value - 2, correctionStartTime.value)
    const endTime = correctionEndTime.value
    console.log(`Preview end time: ${startTime}s to ${endTime}s (duration: ${endTime - startTime}s)`)

    // Play segment with precise timing - stops exactly at endTime
    isPlaying.value = true
    playAudioSegment(audioBuffer.value, startTime, endTime, () => {
      console.log('Preview playback ended precisely')
      isPlaying.value = false
    })

  } catch (error) {
    console.error('Error during end time preview:', error)
  }
}

// Keyboard event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    // Close navigation menu first, then player
    if (showNavigationMenu.value) {
      showNavigationMenu.value = false
    } else if (showPlayer.value) {
      stopPlaying()
    }
  }
}

// Handle click outside navigation menu
const handleClickOutside = (event: MouseEvent) => {
  if (showNavigationMenu.value) {
    const target = event.target as HTMLElement
    const menuContainer = target.closest('.navigation-menu-container')
    if (!menuContainer) {
      showNavigationMenu.value = false
    }
  }
}

// Watch for changes in currentExcerptVerse and update correction values if interface is open
watch(currentExcerptVerse, (newVerse) => {
  if (newVerse && showCorrectionInterface.value) {
    // Update correction values with new verse timing
    originalStartTime.value = newVerse.begin
    originalEndTime.value = newVerse.end
    correctionStartTime.value = newVerse.begin
    correctionEndTime.value = newVerse.end
  }
}, { deep: true })

// Watch for changes in autoAdvanceToNext and disable autoAcceptOnTimer if it's turned off
watch(autoAdvanceToNext, (newValue) => {
  if (!newValue) {
    autoAcceptOnTimer.value = false
    clearAutoAcceptTimer()
  }
})

// Initialize data on mount
onMounted(async () => {
  if (voices.value.length === 0) {
    await fetchTranslations()
  }

  // Initialize mobile state
  updateMobileState()
  window.addEventListener('resize', updateMobileState)

  // Set up keyboard event listener
  window.addEventListener('keydown', handleKeydown)

  // Set up click outside handler for navigation menu
  document.addEventListener('click', handleClickOutside)
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)

  // Clean up Web Audio API resources
  stopAudioPlayback()

  // Close AudioContext to free resources
  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
  audioBuffer.value = null

  // Clean up HTMLAudioElement if exists (backward compatibility)
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }

  if (progressUpdateInterval.value) {
    clearInterval(progressUpdateInterval.value)
    progressUpdateInterval.value = null
  }

  // Clear auto-accept timer
  clearAutoAcceptTimer()
})

// Functions for adding anomalies to adjacent verses
const addAnomalyToPreviousVerse = async () => {
  if (!currentVerse.value || !currentExcerptVerse.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to add anomaly: missing verse information',
      life: 5000
    })
    return
  }

  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }

  // Stop Web Audio API playback
  stopAudioPlayback()

  // Also stop HTMLAudioElement if exists (backward compatibility)
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
  if (progressUpdateInterval.value) {
    clearInterval(progressUpdateInterval.value)
    progressUpdateInterval.value = null
  }
  if (isPlaying.value) {
    isPlaying.value = false
  }

  try {
    // Add anomaly to the currently playing verse (which is the "previous" verse relative to original)
    const targetVerseNumber = currentExcerptVerse.value.number
    
    // Create anomaly data for current playing verse
    const anomalyData: CreateAnomalyRequest = {
      voice: currentVerse.value.voice,
      translation: currentVerse.value.translation,
      book_number: currentVerse.value.book_number,
      chapter_number: currentVerse.value.chapter_number,
      verse_number: targetVerseNumber,
      word: currentExcerptVerse.value.text.split(' ')[0] || 'Unknown', // First word of the verse
      position_in_verse: 1,
      position_from_end: currentExcerptVerse.value.text.split(' ').length,
      duration: currentExcerptVerse.value.end - currentExcerptVerse.value.begin,
      speed: 1.0, // Default speed
      ratio: 1.0, // Default ratio
      anomaly_type: 'manual',
      status: 'detected'
    }

    const result = await createAnomaly(anomalyData)
    
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Anomaly added to verse (${currentVerse.value.book_number}:${currentVerse.value.chapter_number}:${targetVerseNumber})`,
        life: 3000
      })

      // Close the player to ensure fresh state
      stopPlaying()
      
      // Refresh the anomalies list to include the new one
      await refreshAnomalies()
      
      // Re-open player with the new anomaly after a short delay to allow state to reset
      setTimeout(() => {
        playVerse(result)
      }, 300)
    }
  } catch (error: any) {
    console.error('Error adding anomaly to previous verse:', error)
    
    let errorMessage = 'Failed to add anomaly to previous verse'
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  }
}

const addAnomalyToNextVerse = async () => {
  if (!currentVerse.value || !currentExcerptVerse.value) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Unable to add anomaly: missing verse information',
      life: 5000
    })
    return
  }

  // Interrupt quick check playback if active
  if (isQuickCheckActive.value) {
    shouldStopQuickCheck.value = true
    isQuickCheckActive.value = false
  }

  // Stop Web Audio API playback
  stopAudioPlayback()

  // Also stop HTMLAudioElement if exists (backward compatibility)
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
  if (progressUpdateInterval.value) {
    clearInterval(progressUpdateInterval.value)
    progressUpdateInterval.value = null
  }
  if (isPlaying.value) {
    isPlaying.value = false
  }

  try {
    // Add anomaly to the currently playing verse (which is the "next" verse relative to original)
    const targetVerseNumber = currentExcerptVerse.value.number
    
    // Create anomaly data for current playing verse
    const anomalyData: CreateAnomalyRequest = {
      voice: currentVerse.value.voice,
      translation: currentVerse.value.translation,
      book_number: currentVerse.value.book_number,
      chapter_number: currentVerse.value.chapter_number,
      verse_number: targetVerseNumber,
      word: currentExcerptVerse.value.text.split(' ')[0] || 'Unknown', // First word of the verse
      position_in_verse: 1,
      position_from_end: currentExcerptVerse.value.text.split(' ').length,
      duration: currentExcerptVerse.value.end - currentExcerptVerse.value.begin,
      speed: 1.0, // Default speed
      ratio: 1.0, // Default ratio
      anomaly_type: 'manual',
      status: 'detected'
    }

    const result = await createAnomaly(anomalyData)
    
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `Anomaly added to verse (${currentVerse.value.book_number}:${currentVerse.value.chapter_number}:${targetVerseNumber})`,
        life: 3000
      })

      // Close the player to ensure fresh state
      stopPlaying()
      
      // Refresh the anomalies list to include the new one
      await refreshAnomalies()
      
      // Re-open player with the new anomaly after a short delay to allow state to reset
      setTimeout(() => {
        playVerse(result)
      }, 300)
    }
  } catch (error: any) {
    console.error('Error adding anomaly to next verse:', error)
    
    let errorMessage = 'Failed to add anomaly to next verse'
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  }
}

// Create anomaly dialog functions
const openCreateAnomalyDialog = () => {
  if (!selectedVoice.value) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please select a voice first',
      life: 3000
    })
    return
  }
  
  // Set voice and translation from selected voice
  const selectedVoiceData = availableVoices.value.find(v => v.code === selectedVoice.value)
  if (selectedVoiceData) {
    newAnomaly.value.voice = selectedVoice.value
    newAnomaly.value.translation = selectedVoiceData.translation.code
  }
  
  showCreateAnomalyDialog.value = true
}

const resetCreateAnomalyForm = () => {
  newAnomaly.value = {
    voice: selectedVoice.value || undefined,
    translation: undefined,
    book_number: undefined,
    chapter_number: undefined,
    verse_number: undefined,
    word: 'N/A', // Default value since field is removed
    position_in_verse: 1, // Default value since field is removed
    position_from_end: 1, // Default value since field is removed
    duration: 1.0, // Default value since field is removed
    speed: 1.0, // Default value since field is removed
    ratio: 1.0,
    anomaly_type: 'manual',
    status: 'detected'
  }
  
  // Set voice and translation again if voice is selected
  const selectedVoiceData = availableVoices.value.find(v => v.code === selectedVoice.value)
  if (selectedVoiceData && selectedVoice.value !== null) {
    newAnomaly.value.voice = selectedVoice.value
    newAnomaly.value.translation = selectedVoiceData.translation.code
  }
}

const createNewAnomaly = async () => {
  try {
    // Validate required fields
    if (!newAnomaly.value.voice || !newAnomaly.value.translation || 
        !newAnomaly.value.book_number || !newAnomaly.value.chapter_number || 
        !newAnomaly.value.verse_number || !newAnomaly.value.ratio ||
        !newAnomaly.value.anomaly_type || !newAnomaly.value.status) {
      toast.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields',
        life: 5000
      })
      return
    }
    
    creatingAnomaly.value = true
    
    const result = await createAnomaly(newAnomaly.value as CreateAnomalyRequest)
    
    if (result) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Anomaly created successfully',
        life: 3000
      })
      
      showCreateAnomalyDialog.value = false
      resetCreateAnomalyForm()
      
      // Refresh the anomalies list
      await refreshData()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create anomaly. Please try again.',
        life: 5000
      })
    }
  } catch (error: any) {
    console.error('Error creating anomaly:', error)
    
    let errorMessage = 'Failed to create anomaly. Please try again.'
    
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    })
  } finally {
    creatingAnomaly.value = false
  }
}

</script>

<style scoped>
/* Compact table styles - reduce vertical padding in rows */
.compact-table :deep(.p-datatable-tbody > tr > td) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.compact-table :deep(.p-datatable-thead > tr > th) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}

/* Animation 1: Pulse effect */
@keyframes pulse-glow {

  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(var(--primary-500), 0.4);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(var(--primary-500), 0);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

/* Styles for highlighting playing row */
.p-datatable .p-datatable-tbody>tr.playing-row {
  position: relative;
  border-bottom: none !important;
  /* Remove standard bottom border */
}

/* Styles for light theme */
:root:not(.dark) .p-datatable .p-datatable-tbody>tr.playing-row {
  background-color: #e3f2fd !important;
  box-shadow: inset 4px 0 0 #2196f3, 0 1px 0 0 #e3f2fd !important;
  /* Left border and bottom shadow */
}

:root:not(.dark) .p-datatable .p-datatable-tbody>tr.playing-row>td {
  background-color: #e3f2fd !important;
  border-bottom-color: #bbdefb !important;
  /* Lighter bottom border */
}

/* Styles for dark theme */
.dark .p-datatable .p-datatable-tbody>tr.playing-row {
  background-color: rgba(25, 118, 210, 0.2) !important;
  /* More saturated blue for dark theme */
  box-shadow: inset 4px 0 0 #42a5f5, 0 1px 0 0 rgba(25, 118, 210, 0.2) !important;
  /* Left border and bottom shadow */
}

.dark .p-datatable .p-datatable-tbody>tr.playing-row>td {
  background-color: rgba(25, 118, 210, 0.2) !important;
  border-bottom-color: rgba(66, 165, 245, 0.3) !important;
  /* Lighter bottom border for dark theme */
}

/* Custom anomaly type colors */
/* Fast anomalies - Purple shades */
.p-tag.p-tag-danger.fast-first {
  background-color: #6B46C1 !important; /* Deep purple */
  color: white !important;
}

.p-tag.p-tag-warn.fast-last {
  background-color: #8B5CF6 !important; /* Medium purple */
  color: white !important;
}

.p-tag.p-tag-info.fast-middle {
  background-color: #A78BFA !important; /* Light purple */
  color: white !important;
}

.p-tag.p-tag-secondary.fast-next,
.p-tag.p-tag-secondary.fast-previous {
  background-color: #C4B5FD !important; /* Lightest purple */
  color: #4C1D95 !important;
}

/* Slow anomalies - Brown shades */
.p-tag.p-tag-warn.slow-first,
.p-tag.p-tag-warn.slow-last {
  background-color: #92400E !important; /* Dark brown */
  color: white !important;
}

.p-tag.p-tag-secondary.slow-middle,
.p-tag.p-tag-secondary.slow-next,
.p-tag.p-tag-secondary.slow-previous {
  background-color: #D97706 !important; /* Light brown */
  color: white !important;
}

/* Manual anomalies - Teal/Cyan */
.p-tag.p-tag-info.manual {
  background-color: #0891B2 !important; /* Teal */
  color: white !important;
}

/* Dark theme adjustments */
.dark .p-tag.p-tag-danger.fast-first {
  background-color: #7C3AED !important;
}

.dark .p-tag.p-tag-warn.fast-last {
  background-color: #9333EA !important;
}

.dark .p-tag.p-tag-info.fast-middle {
  background-color: #A855F7 !important;
}

.dark .p-tag.p-tag-secondary.fast-next,
.dark .p-tag.p-tag-secondary.fast-previous {
  background-color: #DDD6FE !important;
  color: #5B21B6 !important;
}

.dark .p-tag.p-tag-warn.slow-first,
.dark .p-tag.p-tag-warn.slow-last {
  background-color: #A16207 !important;
}

.dark .p-tag.p-tag-secondary.slow-middle,
.dark .p-tag.p-tag-secondary.slow-next,
.dark .p-tag.p-tag-secondary.slow-previous {
  background-color: #EA580C !important;
}

.dark .p-tag.p-tag-info.manual {
  background-color: #0E7490 !important;
}
</style>
