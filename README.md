# Forced Alignments Dashboard

Web application for managing and analyzing forced alignment data of Bible audio and text. Supports working with voices, anomalies, alignment tasks, and authorization.

## Quick Start

```bash
# Install dependencies
npm install

# Setup API key
cp .env.example .env
# Edit .env and specify VITE_ADMIN_API_KEY

# Start dev server
npm run dev
```

The application will be available at `http://localhost:5173`

## Main Features

- **Voice Management** - view and manage translation voices
- **Anomaly Handling** - analyze and correct alignment anomalies
- **Bible Inspector** - view chapters with audio and timing
- **Alignment Tasks** - create and monitor MFA tasks
- **Authorization** - API key for reading, JWT for changes
- **Dark Theme** - automatic system theme detection

## Technologies

- Vue 3 + TypeScript
- Vite 5.4.19
- PrimeVue 4 + TailwindCSS
- Axios for API
- Lucide for icons

## Build

```bash
# Production build
npm run build

# Preview build
npm run preview
```

## Structure

```
/src
  /Components       - Vue components
  /composables      - Composables (useApi, useAuth, useAlignmentTasks)
  /services         - API services (api.ts, auth.ts)
  /config           - Configuration (api.ts)
  /utils            - Utilities (audio.ts)
  /types            - TypeScript types
/docs               - Documentation
```

## Documentation

Full documentation is located in the **[docs/](docs/)** folder:

- **[AUTH.md](docs/AUTH.md)** - Authorization (API key and JWT)
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development and project structure
- **[CHANGELOG.md](docs/CHANGELOG.md)** - Change history
- **[EXCERPT_API.md](docs/EXCERPT_API.md)** - Excerpt API

## Authorization

Two access levels:
- **API key** — read data (languages, translations, audio)
- **JWT token** — modify data (voices, anomalies)

Setup: create `.env` and specify `VITE_ADMIN_API_KEY`

## License

[GPLv3](LICENSE)
