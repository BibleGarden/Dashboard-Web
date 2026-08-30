<template>
  <div class="w-full">
    <!-- Voice Selection and Filters -->
    <div class="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-surface-800 dark:border-surface-700">
      <!-- Mobile: Stack vertically, Desktop: Horizontal layout -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div class="flex-1 min-w-0" style="flex: 2;">
          <Select id="voiceSelect" v-model="selectedVoice" :options="availableVoices" optionLabel="displayName"
            optionValue="code" :optionDisabled="isVoiceDisabled" placeholder="Select voice" class="w-full"
            @change="onVoiceChange">
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full">
                <span :title="slotProps.option.displayName">
                  {{ slotProps.option.displayName }}
                </span>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center justify-between w-full" v-if="slotProps.value">
                <span :title="getSelectedVoiceDisplayName(slotProps.value)">
                  {{ getSelectedVoiceDisplayName(slotProps.value) }}
                </span>
              </div>
            </template>
          </Select>
        </div>
        <div class="flex-1 min-w-0" style="flex: 1;">
          <Select id="bookFilter" v-model="selectedBookNumber" :options="bookOptions" optionLabel="label"
            optionValue="value" placeholder="All books" class="w-full" :disabled="!selectedVoice"
            :loading="booksState.loading" @change="onBookChange" showClear>
            <template #option="slotProps">
              <div class="flex items-center justify-between w-full">
                <span>
                  {{ slotProps.option.label }}
                </span>
              </div>
            </template>
            <template #value="slotProps">
              <div class="flex items-center justify-between w-full" v-if="slotProps.value">
                <span>
                  {{ getSelectedBookDisplayName(slotProps.value) }}
                </span>
              </div>
              <span v-else-if="slotProps.value">
                {{ getSelectedBookDisplayName(slotProps.value) }}
              </span>
            </template>
          </Select>
        </div>
        <div class="flex-1 min-w-0" style="flex: 1;">
          <InputGroup>
            <InputGroupAddon>
              <Button @click="decrementChapter" :disabled="!selectedBookNumber || (!selectedChapter && selectedChapter !== 0) || selectedChapter <= 1" 
                severity="secondary" size="small" class="!border-0 !bg-transparent" v-tooltip.top="'Previous Chapter'" data-testid="prev-chapter-button">
                <span class="text-lg font-bold leading-none">-</span>
              </Button>
            </InputGroupAddon>
            <InputNumber id="chapterFilter" v-model="selectedChapter" :min="1" :max="150" 
              placeholder="Chapter" :disabled="!selectedBookNumber"
              @blur="onChapterChange" @keyup.enter="onChapterChange"
              class="text-center" />
            <InputGroupAddon>
              <Button @click="incrementChapter" :disabled="!selectedBookNumber" 
                severity="secondary" size="small" class="!border-0 !bg-transparent" v-tooltip.top="'Next Chapter'" data-testid="next-chapter-button">
                <span class="text-lg font-bold leading-none">+</span>
              </Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div class="flex gap-3">
          <Button @click="refreshData" :disabled="!canLoadData" :loading="excerptState.loading" title="Refresh" data-testid="refresh-button">
            <RefreshIcon class="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- Excerpt Table -->
    <DataTable :value="excerptVerses" tableStyle="min-width: 50rem" paginator :rows="defaultPageSize"
      :rowsPerPageOptions="[10, 15, 50, 100]" :loading="excerptState.loading" stripedRows
      :rowClass="getRowClass" class="compact-table">
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span v-if="selectedVoice" class="text-sm text-gray-600">
              Voice: {{ getVoiceName(selectedVoice) }}
            </span>
            <span v-if="selectedBookNumber" class="text-sm text-gray-600">
              Book: {{ getSelectedBookDisplayName(selectedBookNumber) }}
            </span>
            <span v-if="selectedChapter" class="text-sm text-gray-600">
              Chapter: {{ selectedChapter }}
            </span>
          </div>
        </div>
      </template>

      <Column field="number" header="Verse" style="width: 8%">
        <template #body="slotProps">
          <span class="text-sm font-medium">{{ slotProps.data.number }}</span>
        </template>
      </Column>
      <Column field="html" header="Text" style="width: 45%">
        <template #body="slotProps">
          <div class="text-sm" v-html="slotProps.data.html"></div>
        </template>
      </Column>
      <Column field="begin" header="Start" style="width: 11%">
        <template #body="slotProps">
          <span class="text-sm font-mono">
            {{ formatTimeWithFraction(slotProps.data.begin).mainPart }}<span class="opacity-50">{{ formatTimeWithFraction(slotProps.data.begin).fractionPart }}</span>
          </span>
        </template>
      </Column>
      <Column field="end" header="End" style="width: 11%">
        <template #body="slotProps">
          <span class="text-sm font-mono">
            {{ formatTimeWithFraction(slotProps.data.end).mainPart }}<span class="opacity-50">{{ formatTimeWithFraction(slotProps.data.end).fractionPart }}</span>
          </span>
        </template>
      </Column>
      <Column header="Pause" style="width: 11%">
        <template #body="slotProps">
          <span v-if="calculatePauseToNext(slotProps.data) !== null" 
            class="text-sm font-mono text-surface-500 dark:text-surface-400">
            {{ formatPauseTime(calculatePauseToNext(slotProps.data)!).mainPart }}<span class="opacity-50">{{ formatPauseTime(calculatePauseToNext(slotProps.data)!).fractionPart }}</span>
          </span>
          <span v-else class="text-sm text-surface-400 dark:text-surface-500">—</span>
        </template>
      </Column>
      <Column header="Actions" style="width: 10%">
        <template #body="slotProps">
          <div class="flex gap-1">
            <!-- Dynamic Play/Pause button -->
            <Button v-if="currentPlayingId === slotProps.data.code && isPlaying" severity="primary" class="w-9 h-9"
              v-tooltip.top="'Pause'" @click="togglePlayPause()" data-testid="pause-verse-button">
              <PauseIcon class="-m-1" />
            </Button>
            <Button v-else severity="info" class="w-9 h-9" v-tooltip.top="'Play Verse'"
              @click="playVerse(slotProps.data)" data-testid="play-verse-button">
              <PlayIcon class="-m-1" />
            </Button>
            <Button severity="secondary" class="w-9 h-9" v-tooltip.top="'Adjust Timing'"
              @click="initializeCorrectionInterface(slotProps.data)" data-testid="adjust-timing-button">
              <InfoIcon class="-m-1" />
            </Button>
          </div>
        </template>
      </Column>

      <template #footer>
        <div class="flex justify-between items-center">
          <span>Total verses: {{ excerptVerses ? excerptVerses.length : 0 }}</span>
          <span v-if="excerptState.error" class="text-red-500 text-sm">
            {{ excerptState.error }}
          </span>
        </div>
      </template>

      <template #empty>
        <div class="text-center py-8">
          <InfoIcon class="w-12 h-12 text-gray-400 mb-4 mx-auto" />
          <p class="text-gray-600">
            {{ selectedVoice ? 'Select book and chapter to view verses' : 'Select a voice to view verses' }}
          </p>
        </div>
      </template>
    </DataTable>

    <!-- Mini Audio Player Popup -->
    <BaseAudioPlayer
      :visible="showPlayer"
      title="Playing Verse"
      :subtitle="`Book ${selectedBookNumber} Chapter ${selectedChapter}:${currentVerse?.number}`"
      :contentHtml="currentVerse?.html"
      :isPlaying="isPlaying"
      :currentTime="currentTime"
      :duration="duration"
      :progressPercentage="progressPercentage"
      :zIndex="50"
      @toggle-play-pause="togglePlayPause"
      @close="stopPlaying(false)"
      @seek="seekTo"
    >
      <!-- Settings slot: Auto-advance -->
      <template #settings>
        <!-- Correction button -->
        <div v-if="!showCorrectionInterface" class="pt-3 border-t border-surface-200 dark:border-surface-700">
          <Button @click="openCorrectionFromPlayer" severity="info" size="small" class="w-full text-xs">
            <InfoIcon class="w-3 h-3 mr-1" />
            Perform correction
          </Button>
        </div>

        <!-- Auto-advance settings -->
        <div class="pt-4 mt-2 border-t border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-2 mb-3">
            <Checkbox v-model="autoAdvanceToNext" inputId="autoAdvance" binary />
            <label for="autoAdvance" class="text-sm text-surface-700 dark:text-surface-200 cursor-pointer">
              Automatically advance to next verse
            </label>
          </div>

          <div v-if="autoAdvanceToNext" class="flex items-center gap-2">
            <span class="text-sm text-surface-700 dark:text-surface-200">Pause:</span>
            <InputNumber v-model="autoAdvancePause" :min="0.5" :max="10" :step="0.5"
              :minFractionDigits="1" :maxFractionDigits="1"
              class="w-20" size="small" />
            <span class="text-sm text-surface-700 dark:text-surface-200">sec</span>
          </div>
        </div>
      </template>

      <!-- Correction slot -->
      <template #correction>
        <TimingCorrection
          v-if="showCorrectionInterface"
          :startTime="correctionStartTime"
          :endTime="correctionEndTime"
          :originalStartTime="originalStartTime"
          :originalEndTime="originalEndTime"
          @update:startTime="correctionStartTime = $event"
          @update:endTime="correctionEndTime = $event"
          @preview-start="previewStartTime"
          @preview-end="previewEndTime"
          @apply="applyCorrectionChanges"
          @reset="resetCorrectionChanges"
          @close="closeCorrectionInterface"
        />
      </template>
    </BaseAudioPlayer>

    <!-- Toast notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Checkbox from 'primevue/checkbox'
import Toast from 'primevue/toast'
import type { ExcerptResponse, ExcerptVerseModel, BookModel } from '../types/api'
import { useTranslations, useBooks, type VoiceWithTranslation } from '../composables/useApi'
import { useAudioPlayback } from '../composables/useAudioPlayback'
import { adminApiService } from '../services/api'
import { useToast } from 'primevue/usetoast'
import { createAudioUrlWithAuth } from '../utils/audio'
import BaseAudioPlayer from './BaseAudioPlayer.vue'
import TimingCorrection from './TimingCorrection.vue'
// Lucide imports
import {
  RotateCcw as RefreshIcon,
  Info as InfoIcon,
  Play as PlayIcon,
  Pause as PauseIcon
} from 'lucide-vue-next'

// Composables
const { state: voicesState, voices, fetchTranslations } = useTranslations()
const { state: booksState, books, fetchBooks, clearBooks } = useBooks()
const toast = useToast()

// Local state
const selectedVoice = ref<number | null>(null)
const selectedBookNumber = ref<number | null>(null)
const selectedChapter = ref<number | null>(null)

// Track last loaded data to avoid unnecessary reloads
const lastLoadedData = ref<{
  voice: number | null
  book: number | null
  chapter: number | null
}>({
  voice: null,
  book: null,
  chapter: null
})

// Excerpt data state
const excerptState = ref({
  loading: false,
  error: null as string | null
})
const currentExcerpt = ref<ExcerptResponse | null>(null)
const excerptVerses = ref<ExcerptVerseModel[]>([])

// Error handling state
let lastErrorTime = 0
const ERROR_DEBOUNCE_TIME = 1000 // 1 second

// Audio playback composable
const {
  isPlaying,
  currentTime,
  duration,
  progressPercentage,
  loadAudio,
  playSegment,
  togglePlayPause,
  stop: stopAudio,
  seekTo,
  formatTime
} = useAudioPlayback({
  onPlaybackEnd: () => handlePlaybackEnd(),
  onError: (err) => showError('Audio Error', err.message)
})

// Audio player state
const showPlayer = ref(false)
const currentVerse = ref<ExcerptVerseModel | null>(null)
const currentPlayingId = ref<number | null>(null)
const currentAudioUrl = ref<string | null>(null)
const closePlayerTimerId = ref<number | null>(null) // Timer for delayed player close

// Auto-advance settings
const autoAdvanceToNext = ref(false)
const autoAdvancePause = ref(1) // seconds

// Verse correction state
const showCorrectionInterface = ref(false)
const correctionStartTime = ref(0)
const correctionEndTime = ref(0)
const originalStartTime = ref(0)
const originalEndTime = ref(0)

// Table settings
const defaultPageSize = 15

// Computed properties
const availableVoices = computed(() => {
  if (!voices.value) return []
  
  return voices.value.map(voice => ({
    code: voice.code,
    displayName: `${voice.name} (${voice.translation.name} - ${voice.translation.language})`,
    translationCode: voice.translation.code,
    translationName: voice.translation.name,
    voiceName: voice.name,
    disabled: !voice.active
  }))
})

const bookOptions = computed(() => {
  if (!books.value) return []
  
  return books.value.map(book => ({
    value: book.book_number,
    label: `${book.book_number}. ${book.name}`,
    code: book.code,
    name: book.name
  }))
})

const canLoadData = computed(() => {
  return selectedVoice.value && selectedBookNumber.value && selectedChapter.value
})

const hasTimingChanges = computed(() => {
  return correctionStartTime.value !== originalStartTime.value ||
    correctionEndTime.value !== originalEndTime.value
})

// Methods
const truncateText = (text: string, maxLength = 30) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const isVoiceDisabled = (voice: any) => {
  return voice.disabled
}

const getSelectedVoiceDisplayName = (voiceCode: number) => {
  const voice = voices.value.find(v => v.code === voiceCode)
  return voice ? `${voice.name} (${voice.translation.name} - ${voice.translation.language})` : ''
}

const getSelectedBookDisplayName = (bookNumber: number) => {
  const book = bookOptions.value.find(b => b.value === bookNumber)
  return book ? book.label : ''
}

const getVoiceName = (voiceCode: number) => {
  const voice = voices.value.find(v => v.code === voiceCode)
  return voice ? `${voice.name} (${voice.translation.name} - ${voice.translation.language})` : ''
}

const formatTimeWithFraction = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const wholeSecs = Math.floor(seconds % 60)
  const fractionalPart = Math.round((seconds % 1) * 100)
  const mainPart = `${mins}:${wholeSecs.toString().padStart(2, '0')}`
  const fractionPart = `.${fractionalPart.toString().padStart(2, '0')}`
  return { mainPart, fractionPart }
}

const formatPauseTime = (seconds: number) => {
  const fractionalPart = Math.round((seconds % 1) * 100)
  const mainPart = seconds.toFixed(0)
  const fractionPart = `.${fractionalPart.toString().padStart(2, '0')}`
  return { mainPart, fractionPart }
}

const getRowClass = (data: ExcerptVerseModel) => {
  const classes = []
  if (data.start_paragraph) {
    classes.push('start-paragraph-row')
  }
  if (currentPlayingId.value === data.code) {
    classes.push('playing-row')
  }
  return classes.join(' ')
}

const findNextVerse = (currentVerseCode: number): ExcerptVerseModel | null => {
  if (!excerptVerses.value || excerptVerses.value.length === 0) return null
  
  const currentIndex = excerptVerses.value.findIndex(v => v.code === currentVerseCode)
  if (currentIndex === -1 || currentIndex >= excerptVerses.value.length - 1) return null
  
  return excerptVerses.value[currentIndex + 1]
}

const calculatePauseToNext = (verse: ExcerptVerseModel): number | null => {
  const nextVerse = findNextVerse(verse.code)
  if (!nextVerse) return null
  
  return nextVerse.begin - verse.end
}

// Show error with debouncing to prevent duplicates
const showError = (summary: string, detail: string) => {
  const now = Date.now()
  if (now - lastErrorTime < ERROR_DEBOUNCE_TIME) {
    return // Skip if too soon after last error
  }
  
  lastErrorTime = now
  toast.add({
    severity: 'error',
    summary,
    detail,
    life: 5000
  })
}

// Verse correction functions
const initializeCorrectionInterface = (verse: ExcerptVerseModel) => {
  // Store original values
  originalStartTime.value = verse.begin
  originalEndTime.value = verse.end
  // Set current values
  correctionStartTime.value = verse.begin
  correctionEndTime.value = verse.end
  
  // Set current verse for correction
  currentVerse.value = verse
  
  showCorrectionInterface.value = true
}

const resetCorrectionChanges = () => {
  correctionStartTime.value = originalStartTime.value
  correctionEndTime.value = originalEndTime.value
}

const previewStartTime = async () => {
  if (!currentExcerpt.value || !currentVerse.value) return

  // Find the part containing this verse
  const part = currentExcerpt.value.parts.find(p =>
    p.verses.some(v => v.code === currentVerse.value!.code)
  )
  if (!part) return

  try {
    // Stop current playback
    stopAudio()

    // Load and play preview using Web Audio API
    const buffer = await loadAudio(part.audio_link)
    const endTime = Math.min(correctionStartTime.value + 2, correctionEndTime.value)
    playSegment(buffer, correctionStartTime.value, endTime)
  } catch (error) {
    console.error('Error previewing start time:', error)
  }
}

const previewEndTime = async () => {
  if (!currentExcerpt.value || !currentVerse.value) return

  // Find the part containing this verse
  const part = currentExcerpt.value.parts.find(p =>
    p.verses.some(v => v.code === currentVerse.value!.code)
  )
  if (!part) return

  try {
    // Stop current playback
    stopAudio()

    // Load and play preview using Web Audio API
    const buffer = await loadAudio(part.audio_link)
    const startTime = Math.max(correctionEndTime.value - 2, correctionStartTime.value)
    playSegment(buffer, startTime, correctionEndTime.value)
  } catch (error) {
    console.error('Error previewing end time:', error)
  }
}

const applyCorrectionChanges = async () => {
  if (!currentVerse.value || !selectedVoice.value || !selectedBookNumber.value || !selectedChapter.value) {
    return
  }

  try {
    const fixData = {
      voice: selectedVoice.value,
      book_number: selectedBookNumber.value,
      chapter_number: selectedChapter.value,
      verse_number: currentVerse.value.number,
      begin: correctionStartTime.value,
      end: correctionEndTime.value,
      info: `Manual timing correction applied via Bible Inspect interface`
    }

    await adminApiService.createManualFix(fixData)
    
    // Update the verse in local data
    if (currentVerse.value) {
      currentVerse.value.begin = correctionStartTime.value
      currentVerse.value.end = correctionEndTime.value
    }
    
    // Update in excerptVerses array
    const verseIndex = excerptVerses.value.findIndex(v => v.code === currentVerse.value!.code)
    if (verseIndex !== -1) {
      excerptVerses.value[verseIndex].begin = correctionStartTime.value
      excerptVerses.value[verseIndex].end = correctionEndTime.value
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Timing correction applied successfully',
      life: 3000
    })

    closeCorrectionInterface()
  } catch (error) {
    console.error('Error applying correction:', error)
    showError('Error', 'Failed to apply timing correction')
  }
}

// Event handlers
const onVoiceChange = async () => {
  if (selectedVoice.value) {
    const voice = voices.value.find(v => v.code === selectedVoice.value)
    if (voice) {
      await fetchBooks(voice.translation.code)
    }
  } else {
    clearBooks()
  }
  selectedBookNumber.value = null
  selectedChapter.value = null
  excerptVerses.value = []
  // Reset cache
  lastLoadedData.value = { voice: null, book: null, chapter: null }
}

const onBookChange = () => {
  selectedChapter.value = null
  excerptVerses.value = []
  // Reset cache
  lastLoadedData.value = { voice: null, book: null, chapter: null }
}

const onChapterChange = () => {
  if (canLoadData.value) {
    loadExcerptData()
  }
}

const decrementChapter = () => {
  if (selectedChapter.value && selectedChapter.value > 1) {
    selectedChapter.value--
    if (canLoadData.value) {
      loadExcerptData()
    }
  }
}

const incrementChapter = () => {
  if (!selectedChapter.value) {
    // If chapter is not entered, set to first
    selectedChapter.value = 1
  } else if (selectedChapter.value < 150) {
    selectedChapter.value++
  }
  
  if (canLoadData.value) {
    loadExcerptData()
  }
}

const refreshData = () => {
  if (canLoadData.value) {
    // Force reload by resetting cache
    lastLoadedData.value = { voice: null, book: null, chapter: null }
    loadExcerptData()
  }
}

const loadExcerptData = async () => {
  if (!canLoadData.value) return

  // Check if data is already loaded for the same combination
  if (lastLoadedData.value.voice === selectedVoice.value &&
      lastLoadedData.value.book === selectedBookNumber.value &&
      lastLoadedData.value.chapter === selectedChapter.value &&
      excerptVerses.value.length > 0) {
    return // Data already loaded, no need to reload
  }

  const voice = voices.value.find(v => v.code === selectedVoice.value)
  if (!voice) return

  excerptState.value.loading = true
  excerptState.value.error = null

  try {
    const response = await adminApiService.getChapterWithAlignment({
      translation: voice.translation.code,
      book_number: selectedBookNumber.value!,
      chapter_number: selectedChapter.value!,
      voice: selectedVoice.value!
    })

    currentExcerpt.value = response
    
    // Extract verses from all parts
    excerptVerses.value = response.parts.flatMap(part => part.verses)
    
    // Update last loaded data
    lastLoadedData.value = {
      voice: selectedVoice.value,
      book: selectedBookNumber.value,
      chapter: selectedChapter.value
    }
    
  } catch (error) {
    console.error('Error loading chapter data:', error)
    excerptState.value.error = 'Failed to load chapter data'
    showError('Error', 'Failed to load chapter data')
  } finally {
    excerptState.value.loading = false
  }
}

// Audio player methods
const playVerse = async (verse: ExcerptVerseModel) => {
  if (!currentExcerpt.value || !selectedVoice.value) return

  // Find the part containing this verse
  const part = currentExcerpt.value.parts.find(p =>
    p.verses.some(v => v.code === verse.code)
  )

  if (!part) return

  // Cancel any pending close timer
  if (closePlayerTimerId.value) {
    clearTimeout(closePlayerTimerId.value)
    closePlayerTimerId.value = null
  }

  // Close correction interface if it's open
  if (showCorrectionInterface.value) {
    showCorrectionInterface.value = false
  }

  currentVerse.value = verse
  currentPlayingId.value = verse.code
  currentAudioUrl.value = part.audio_link
  showPlayer.value = true

  try {
    // Stop current audio if playing
    stopAudio()

    // Load and play using Web Audio API
    const buffer = await loadAudio(part.audio_link)
    playSegment(buffer, verse.begin, verse.end)
  } catch (error) {
    console.error('Error playing verse:', error)
    showError('Playback Error', 'Failed to play verse')
    stopPlaying(false)
  }
}

// Handle playback end callback from composable
const handlePlaybackEnd = () => {
  // If auto-advance is enabled, try to play next verse
  if (autoAdvanceToNext.value && currentVerse.value && !showCorrectionInterface.value) {
    const nextVerse = findNextVerse(currentVerse.value.code)
    if (nextVerse) {
      // Wait for the specified pause duration, then play next verse
      closePlayerTimerId.value = window.setTimeout(() => {
        closePlayerTimerId.value = null
        if (!showCorrectionInterface.value) {
          playVerse(nextVerse)
        }
      }, autoAdvancePause.value * 1000)
      return
    }
  }

  // Player stays open after playback ends - user can replay or close manually
}

const stopPlaying = (verseCompleted = false) => {
  // Cancel any pending close timer
  if (closePlayerTimerId.value) {
    clearTimeout(closePlayerTimerId.value)
    closePlayerTimerId.value = null
  }

  stopAudio()

  if (verseCompleted) {
    handlePlaybackEnd()
  } else {
    // Immediate close for manual stop
    showPlayer.value = false
    currentVerse.value = null
    currentPlayingId.value = null
  }
}

const openCorrectionFromPlayer = () => {
  if (!currentVerse.value) return

  // Stop audio but keep player open
  stopAudio()

  // Initialize correction interface with current verse
  initializeCorrectionInterface(currentVerse.value)
}

const closeCorrectionInterface = () => {
  showCorrectionInterface.value = false
  // Also close the player when correction interface is closed
  stopAudio()
  showPlayer.value = false
  currentVerse.value = null
  currentPlayingId.value = null
}

// Watcher for chapter changes with debounce
let chapterChangeTimeout: number | null = null

watch(selectedChapter, (newChapter) => {
  if (chapterChangeTimeout) {
    clearTimeout(chapterChangeTimeout)
  }
  
  if (newChapter && canLoadData.value) {
    chapterChangeTimeout = window.setTimeout(() => {
      loadExcerptData()
    }, 500) // 500ms delay
  }
})

// Lifecycle
onMounted(async () => {
  await fetchTranslations()
})

onUnmounted(() => {
  stopAudio() // cleanup audio
  if (chapterChangeTimeout) {
    clearTimeout(chapterChangeTimeout)
  }
})
</script>

<style scoped>
.compact-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.5rem;
}

.compact-table :deep(.start-paragraph-row td) {
  padding-top: 3rem !important;
}

/* Center text in chapter input field */
:deep(.p-inputnumber-input) {
  text-align: center;
}

/* Highlight playing row with PrimeVue colors */
:deep(.playing-row) {
  background-color: var(--p-primary-50) !important;
  border-left: 4px solid var(--p-primary-500) !important;
  box-shadow: inset 0 0 0 1px var(--p-primary-200) !important;
}

:deep(.playing-row:hover) {
  background-color: var(--p-primary-100) !important;
}

:deep(.playing-row td) {
  background-color: var(--p-primary-50) !important;
  border-color: var(--p-primary-200) !important;
}

/* Dark theme */
.dark :deep(.playing-row) {
  background-color: var(--p-primary-900) !important;
  border-left: 4px solid var(--p-primary-400) !important;
  box-shadow: inset 0 0 0 1px var(--p-primary-700) !important;
}

.dark :deep(.playing-row:hover) {
  background-color: var(--p-primary-800) !important;
}

.dark :deep(.playing-row td) {
  background-color: var(--p-primary-900) !important;
  border-color: var(--p-primary-700) !important;
}
</style>
