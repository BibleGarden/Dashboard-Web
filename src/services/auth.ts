import axios from 'axios'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface AuthState {
  token: string | null
  isAuthenticated: boolean
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token'
  private readonly TOKEN_EXPIRY_KEY = 'auth_token_expiry'

  /**
   * Get saved token from localStorage
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY)
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY)

    if (!token || !expiry) {
      return null
    }

    // Check if token has expired
    if (Date.now() > parseInt(expiry)) {
      this.clearToken()
      return null
    }

    return token
  }

  /**
   * Save token to localStorage
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token)
    // Token is valid for 24 hours
    const expiry = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString())
  }

  /**
   * Remove token from localStorage
   */
  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY)
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null
  }

  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        '/admin-api/auth/login',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // Save token
      this.setToken(response.data.access_token)

      return response.data
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password')
      }
      throw new Error(error.response?.data?.detail || 'Authorization error')
    }
  }

  /**
   * Logout
   */
  logout(): void {
    this.clearToken()
  }

  /**
   * Get authorization header for requests
   */
  getAuthHeader(): string | null {
    const token = this.getToken()
    return token ? `Bearer ${token}` : null
  }
}

export const authService = new AuthService()
export default authService
