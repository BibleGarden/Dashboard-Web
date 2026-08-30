# Documentation

## For Developers

### 🚀 Getting Started
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Installation, running, project structure

### 🔐 Authorization
- **[AUTH.md](AUTH.md)** - API key and JWT token configuration

### 📝 Changelog
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## Reference Information

### 📡 API
- **[EXCERPT_API.md](EXCERPT_API.md)** - Excerpt API documentation

## Quick Links

### Environment Setup
```bash
# 1. Installation
npm install

# 2. Configuration
cp .env.example .env
# Specify VITE_ADMIN_API_KEY in .env

# 3. Running
npm run dev
```

### Main Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run format   # Format code
```

### Technologies
- Vue 3 + TypeScript
- Vite 5.4.19
- PrimeVue 4 + TailwindCSS
- Axios + Lucide

### Structure
```
/src
  /Components   - Vue components
  /composables  - Composables
  /services     - API services
  /config       - Configuration
  /utils        - Utilities
  /types        - TypeScript types
```
