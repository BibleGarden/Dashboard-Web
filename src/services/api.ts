import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type {
  TranslationModel,
  LanguageModel,
  BookModel,
  TranslationListParams,
  VoiceAnomalyModel,
  VoiceAnomalyListParams,
  VoiceAnomaliesResponse,
  BibleError,
  ErrorListParams,
  PaginatedResponse,
  AnomalyStatus,
  ExcerptResponse,
  ExcerptParams,
  CreateAnomalyRequest,
  AlignmentTaskResponse,
  AlignmentTaskUpdate,
  CreateAlignmentTaskRequest,
  AlignmentTaskListParams,
  AlignmentStatus,
  MFAModelResponse,
  LanguageResponse,
  ModelType,
  ModelsUpdateResponse,
  StatsSummaryResponse,
  RecentRequestsResponse
} from '../types/api'
import { authService } from './auth'
import { API_CONFIG, isPublicEndpoint, isAdminEndpoint, requireApiKey } from '../config/api'

// Exported to allow creating multiple API instances (e.g., admin API and alignment API)
export class ApiService {
  private api: AxiosInstance
  private isAdminApi: boolean

  constructor(baseURL: string = API_CONFIG.ALIGNMENT_API_URL) {
    this.isAdminApi = baseURL === API_CONFIG.ADMIN_API_URL

    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add authorization headers only for the admin API
        if (this.isAdminApi) {
          const url = config.url || ''

          // Add API key for public endpoints (throws if not configured)
          if (isPublicEndpoint(url)) {
            config.headers['X-API-Key'] = requireApiKey()
          }

          // Add JWT token for administrative endpoints
          if (isAdminEndpoint(url)) {
            const authHeader = authService.getAuthHeader()
            if (authHeader) {
              config.headers['Authorization'] = authHeader
            }
          }
        }

        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // API Response logging removed
        return response
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message)

        // Handle authorization errors
        if (error.response?.status === 401) {
          // Token expired or missing
          authService.clearToken()
          // Can add redirect to login page
          window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        } else if (error.response?.status === 403) {
          // Invalid API key
          console.error('Invalid or missing API Key')
        } else if (error.response?.status === 422) {
          console.error('422 Error Details:', {
            status: error.response.status,
            data: error.response.data,
            config: {
              method: error.config?.method,
              url: error.config?.url,
              data: error.config?.data
            }
          })
        }

        return Promise.reject(error)
      }
    )
  }

  // Translation endpoints
  async getTranslations(params?: TranslationListParams): Promise<TranslationModel[]> {
    const response = await this.api.get<TranslationModel[]>('/translations', { params })
    return response.data
  }

  // Languages endpoint
  async getLanguages(): Promise<LanguageModel[]> {
    const response = await this.api.get<LanguageModel[]>('/languages')
    return response.data
  }

  // Books endpoint
  async getTranslationBooks(translationCode: number, voiceCode?: number): Promise<BookModel[]> {
    const params = voiceCode ? { voice_code: voiceCode } : {}
    const response = await this.api.get<BookModel[]>(`/translations/${translationCode}/books`, { params })
    return response.data
  }

  // Voice anomalies endpoint
  async getVoiceAnomalies(voiceCode: number, params?: VoiceAnomalyListParams): Promise<VoiceAnomaliesResponse> {
    const response = await this.api.get<VoiceAnomaliesResponse>(`/voices/${voiceCode}/anomalies`, { params })
    return response.data
  }

  // Update voice endpoint
  async updateVoice(voiceCode: number, data: { active: boolean }): Promise<any> {
    const response = await this.api.put(`/voices/${voiceCode}`, data)
    return response.data
  }

  // Update anomaly status endpoint
  async updateAnomalyStatus(
    anomalyCode: number,
    status: AnomalyStatus,
    begin?: number,
    end?: number
  ): Promise<VoiceAnomalyModel> {
    const payload: { status: AnomalyStatus; begin?: number; end?: number } = { status }

    // Add begin and end parameters for corrected status
    if (status === 'corrected' && begin !== undefined && end !== undefined) {
      payload.begin = begin
      payload.end = end
    }

    const response = await this.api.patch<VoiceAnomalyModel>(`/voices/anomalies/${anomalyCode}/status`, payload)
    return response.data
  }

  // Create new anomaly endpoint
  async createAnomaly(anomalyData: CreateAnomalyRequest): Promise<VoiceAnomalyModel> {
    const response = await this.api.post<VoiceAnomalyModel>('/voices/anomalies', anomalyData)
    return response.data
  }

  // Get excerpt with alignment endpoint
  async getExcerptWithAlignment(params: ExcerptParams): Promise<ExcerptResponse> {
    const response = await this.api.get<ExcerptResponse>('/excerpt_with_alignment', { params })
    return response.data
  }

  // Get chapter with alignment endpoint
  async getChapterWithAlignment(params: {
    translation: number
    book_number: number
    chapter_number: number
    voice?: number
  }): Promise<ExcerptResponse> {
    const response = await this.api.get<ExcerptResponse>('/chapter_with_alignment', { params })
    return response.data
  }

  // Manual timing fixes endpoint
  async createManualFix(fixData: {
    voice: number
    book_number: number
    chapter_number: number
    verse_number: number
    begin: number
    end: number
    info: string
  }): Promise<any> {
    const response = await this.api.post('/voices/manual-fixes', fixData)
    return response.data
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get<{ status: string; timestamp: string }>('/health')
    return response.data
  }

  // Alignment tasks endpoints
  async getAlignmentTasks(params?: AlignmentTaskListParams): Promise<AlignmentTaskResponse[]> {
    const response = await this.api.get<AlignmentTaskResponse[]>('/alignment/', { params })
    return response.data
  }

  async getAlignmentTask(taskId: number): Promise<AlignmentTaskResponse> {
    const response = await this.api.get<AlignmentTaskResponse>(`/alignment/${taskId}`)
    return response.data
  }

  async createAlignmentTask(taskData: CreateAlignmentTaskRequest): Promise<AlignmentTaskResponse> {
    const formData = new FormData()
    formData.append('audio_file', taskData.audio_file)
    formData.append('text_file', taskData.text_file)
    formData.append('acoustic_model_name', taskData.acoustic_model_name)
    formData.append('acoustic_model_version', taskData.acoustic_model_version)
    formData.append('dictionary_model_name', taskData.dictionary_model_name)
    formData.append('dictionary_model_version', taskData.dictionary_model_version)

    if (taskData.g2p_model_name) {
      formData.append('g2p_model_name', taskData.g2p_model_name)
    }
    if (taskData.g2p_model_version) {
      formData.append('g2p_model_version', taskData.g2p_model_version)
    }

    const response = await this.api.post<AlignmentTaskResponse>('/alignment/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async updateAlignmentTask(taskId: number, updateData: AlignmentTaskUpdate): Promise<AlignmentTaskResponse> {
    const response = await this.api.put<AlignmentTaskResponse>(`/alignment/${taskId}`, updateData)
    return response.data
  }

  async deleteAlignmentTask(taskId: number): Promise<void> {
    await this.api.delete(`/alignment/${taskId}`)
  }

  async getAlignmentTasksByStatus(status: AlignmentStatus): Promise<AlignmentTaskResponse[]> {
    const response = await this.api.get<AlignmentTaskResponse[]>(`/alignment/status/${status}`)
    return response.data
  }

  // MFA Models endpoints
  async getMFAModels(params?: { skip?: number; limit?: number; language?: string }): Promise<MFAModelResponse[]> {
    const response = await this.api.get<MFAModelResponse[]>('/models/', { params })
    return response.data
  }

  async getMFAModelsByType(modelType: ModelType, language?: string): Promise<MFAModelResponse[]> {
    const params = language ? { language } : {}
    const response = await this.api.get<MFAModelResponse[]>(`/models/by-type/${modelType}`, { params })
    return response.data
  }

  async getSupportedLanguages(params?: { skip?: number; limit?: number }): Promise<LanguageResponse[]> {
    const response = await this.api.get<LanguageResponse[]>('/models/languages', { params })
    return response.data
  }

  async updateModelsFromGitHub(): Promise<ModelsUpdateResponse> {
    const response = await this.api.post<ModelsUpdateResponse>('/models/update')
    return response.data
  }

  // Stats endpoints
  async getStatsSummary(days: number = 30): Promise<StatsSummaryResponse> {
    const response = await this.api.get<StatsSummaryResponse>('/stats/summary', { params: { days } })
    return response.data
  }

  async getRecentRequests(limit: number = 50): Promise<RecentRequestsResponse> {
    const response = await this.api.get<RecentRequestsResponse>('/stats/recent', { params: { limit } })
    return response.data
  }
}

// Export singleton instances
export const alignmentApiService = new ApiService(API_CONFIG.ALIGNMENT_API_URL)
export const adminApiService = new ApiService(API_CONFIG.ADMIN_API_URL)
export default alignmentApiService
