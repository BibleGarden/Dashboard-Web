// Voice model from API
export interface VoiceModel {
  code: number
  alias: string
  name: string
  description: string | null
  is_music: boolean
  active: boolean
  anomalies_count: number
  anomalies_open_count?: number
}

// Translation model from API
export interface TranslationModel {
  code: number
  alias: string
  name: string
  description: string | null
  language: string
  voices: VoiceModel[]
  active: boolean
}

// Language model from API
export interface LanguageModel {
  alias: string
  name_en: string
  name_national: string
}

// Book model from API
export interface BookModel {
  code: number
  book_number: number
  name: string
  alias: string
  chapters_count: number
  anomalies_count?: number
  anomalies_open_count?: number
}

// Voice anomaly status types
export type AnomalyStatus = 'detected' | 'confirmed' | 'disproved' | 'corrected' | 'already_resolved' | 'disproved_whisper'

// Voice anomaly types
export type AnomalyType = 'fast_first' | 'fast_last' | 'fast_middle' | 'fast_next_verse' | 'fast_previous_verse' | 'manual' | 'slow_first' | 'slow_last' | 'slow_middle' | 'slow_next_verse' | 'slow_previous_verse' | 'ai_likely_false_positive' | 'ai_review_recommended' | 'ai_likely_problem' | 'ai_problem'

// Voice anomaly model from API
export interface VoiceAnomalyModel {
  code: number
  voice: number
  translation: number
  book_number: number
  chapter_number: number
  verse_number: number // NOT NULL now
  anomaly_type: AnomalyType // NOT NULL
  word: string | null // nullable now
  position_in_verse: number | null
  position_from_end: number | null
  duration: number | null // nullable now
  speed: number | null // nullable now
  ratio: number
  verse_text: string
  status: AnomalyStatus
}

// Create anomaly request body
export interface CreateAnomalyRequest {
  voice: number
  translation: number
  book_number: number
  chapter_number: number
  verse_number: number
  word: string
  position_in_verse: number
  position_from_end: number
  duration: number
  speed: number
  ratio: number
  anomaly_type: AnomalyType
  status: AnomalyStatus
}

// API response types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface BibleError {
  id: string
  bible_id: string
  bible_name?: string
  error_type: 'parsing' | 'validation' | 'processing' | 'network'
  message: string
  details?: string
  created_at: string
  resolved: boolean
}

// API endpoints types
export interface TranslationListParams {
  language?: string
  only_active?: number // 0 or 1
}

export interface VoiceAnomalyListParams {
  page?: number
  limit?: number
  anomaly_type?: AnomalyType
  book_number?: number
  status?: AnomalyStatus
  sort_by?: 'address' | 'type' | 'ratio'
  sort_order?: 'asc' | 'desc'
}

export interface ErrorListParams {
  page?: number
  limit?: number
  error_type?: BibleError['error_type']
  resolved?: boolean
  bible_id?: string
}

// Voice anomalies response
export interface VoiceAnomaliesResponse {
  items: VoiceAnomalyModel[]
  total_count: number
}

// Pagination response
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

// Alignment API types
export type AlignmentStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type ModelType = 'acoustic' | 'g2p' | 'dictionary'

export interface ModelParameter {
  name: string
  version: string
}

export interface LanguageResponse {
  code: string
  name: string
  id: number
  created_at: string
  updated_at: string
}

export interface MFAModelResponse {
  name: string
  model_type: ModelType
  version: string
  variant?: string | null
  description?: string | null
  id: number
  language_id: number
  language: LanguageResponse
  created_at: string
  updated_at: string
}

export interface AlignmentTaskResponse {
  original_audio_filename: string
  original_text_filename: string
  id: number
  audio_file_path: string
  text_file_path: string
  acoustic_model: ModelParameter
  dictionary_model: ModelParameter
  g2p_model?: ModelParameter | null
  status: AlignmentStatus
  result_path?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

export interface AlignmentTaskUpdate {
  status?: AlignmentStatus | null
  result_path?: string | null
  error_message?: string | null
}

export interface CreateAlignmentTaskRequest {
  audio_file: File
  text_file: File
  acoustic_model_name: string
  acoustic_model_version: string
  dictionary_model_name: string
  dictionary_model_version: string
  g2p_model_name?: string
  g2p_model_version?: string
}

export interface AlignmentTaskListParams {
  skip?: number
  limit?: number
  status?: AlignmentStatus
}

export interface ModelsUpdateResponse {
  message: string
  updated_models: number
  updated_languages: number
}

// API Stats types
export interface StatsTotals {
  total_requests: number
  total_errors: number
  avg_response_time_ms: number
  unique_ips: number
}

export interface StatsToday {
  requests: number
  unique_ips: number
  avg_response_time_ms: number
  errors: number
}

export interface StatsDailyRow {
  date: string
  requests: number
  unique_ips: number
  avg_response_time_ms: number
  errors: number
}

export interface StatsEndpointRow {
  endpoint: string
  requests: number
  unique_ips: number
  avg_response_time_ms: number
  errors: number
}

export interface StatsSummaryResponse {
  period_days: number
  totals: StatsTotals
  today: StatsToday
  daily: StatsDailyRow[]
  top_endpoints: StatsEndpointRow[]
}

export interface RecentRequestRow {
  id: number
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  client_ip: string
  user_agent: string
  created_at: string
}

export interface RecentRequestsResponse {
  items: RecentRequestRow[]
  count: number
}

export type ContentReportType = 'question' | 'scripture'

export interface ContentReport {
  id: number
  content_type: ContentReportType
  content_text: string
  user_comment: string | null
  language: 'ru' | 'en' | 'uk'
  created_at: string
}

export interface ContentReportsResponse {
  items: ContentReport[]
  count: number
}

export interface ContentReportListParams {
  limit?: number
  after_id?: number
  before_id?: number
}

// Excerpt API types
export interface ExcerptBookModel {
  code: number
  number: number
  alias: string
  name: string
  chapters_count: number
}

export interface ExcerptVerseModel {
  code: number
  number: number
  join: number
  text: string
  html: string
  begin: number
  end: number
  start_paragraph: boolean
}

export interface ExcerptNoteModel {
  code: number
  number: number
  text: string
  verse_code: number
  title_code: number | null
  position_text: number
  position_html: number
}

export interface ExcerptTitleModel {
  code: number
  text: string
  before_verse_code: number
  metadata: any | null
  reference: string | null
}

export interface ExcerptPartModel {
  book: ExcerptBookModel
  chapter_number: number
  audio_link: string
  prev_excerpt: string
  next_excerpt: string
  verses: ExcerptVerseModel[]
  notes: ExcerptNoteModel[]
  titles: ExcerptTitleModel[]
}

export interface ExcerptResponse {
  title: string
  is_single_chapter: boolean
  parts: ExcerptPartModel[]
}

export interface ExcerptParams {
  translation: number
  excerpt: string
  voice?: number
}
