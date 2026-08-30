# Development

## Requirements

- Node.js v18.19.1
- npm

## Installation

```bash
npm install
```

## Configuration

Create `.env` file:
```env
cp .env.example .env
```
and configure it.

## Running

```bash
# Development server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

## Project Structure

```
/src
  /Components       - Vue components
  /composables      - Vue composables (useApi, useAuth, useAlignmentTasks)
  /services         - API services (api.ts, auth.ts)
  /config           - Configuration (api.ts)
  /utils            - Utilities (audio.ts)
  /types            - TypeScript types
  /assets           - Static assets
```

## Technologies

- **Vue 3** - framework
- **TypeScript** - typing
- **Vite** - bundler (v5.4.19)
- **PrimeVue** - UI components
- **TailwindCSS** - styling
- **Axios** - HTTP client
- **Lucide** - icons

## API Endpoints

### Admin API (`/admin-api`)
- Translations, languages, books
- Chapters and excerpts with alignment
- Audio files
- Voice and anomaly management

### Alignment API (`/alignment-api`)
- Alignment tasks
- MFA models
- Supported languages

## Components

- **BaseLayout** - main layout with navigation
- **Login** - authorization page
- **BibleVoices** - voice management
- **BibleAnomalies** - anomaly handling
- **BibleInspect** - chapter inspection
- **AlignmentTasks** - alignment tasks
- **AlignmentTaskDialog** - task creation

## Authorization

See [AUTH.md](./AUTH.md)

## Known Features

- Audio files use query parameter for API key (browser limitation)
- JWT tokens are stored in localStorage
- Dark theme is automatically determined by system settings
