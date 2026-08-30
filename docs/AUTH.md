# Authorization

## Quick Start

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Specify API Key:**
   ```env
   VITE_ADMIN_API_KEY=your_api_key_here
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

## Authorization Types

### Public Endpoints (Read Data)
Require **API Key**:
- Languages, translations, books
- Chapters and excerpts with alignment
- Audio files

**Key Transmission:**
- Standard requests: `X-API-Key` header
- Audio files: `?api_key=xxx` query parameter

### Administrative Endpoints (Modify Data)
Require **JWT Token**:
- Voice and anomaly management
- Manual timing corrections
- Translation verification

**Obtaining a Token:**
1. Log in via Settings → "Login"
2. Enter credentials
3. Token is saved automatically (valid for 24 hours)

## Working Without Authorization

Click "Continue without authorization" — all viewing functions are available.

## Error Handling

- **401 Unauthorized** → Token expired, automatic redirect to login
- **403 Forbidden** → Invalid API key, check `.env`

## Architecture

```
/src/services/auth.ts       - JWT token management
/src/config/api.ts          - API key configuration
/src/utils/audio.ts         - Audio utilities with authorization
/src/composables/useAuth.ts - Vue composable for authorization
/src/Components/Login.vue   - Login page
```

**Interceptors in ApiService:**
- Automatically adds necessary headers
- Handles 401/403 errors
- Generates events for redirects
