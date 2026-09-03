# CLAUDE.md — Dashboard-Web

Admin dashboard for Bible Garden: manage voices, alignment anomalies, alignment tasks, and inspect Bible text/audio.

## Stack & Conventions

- Vue 3, `<script setup lang="ts">` everywhere
- PrimeVue 4 components (`@primevue/themes`) + Tailwind CSS (`tailwindcss-primeui`)
- Icons: Lucide (`lucide-vue-next`); `@heroicons/vue` also present
- Vite 5, `vue-router`, `axios` for API calls, `chart.js` for charts
- Path alias `@` → `src/`

## Structure

```
src/
  Components/     Vue components
  composables/    useApi, useAuth, useAlignmentTasks, ...
  services/       api.ts, auth.ts
  config/         api.ts
  router/
  utils/          audio.ts
  types/
```

Key files:
- `src/Components/BaseLayout.vue` — sidebar layout, navigation
- `src/Components/ApiStats.vue` — API statistics page

## Auth

Two levels: API key for reads, JWT for writes. See `docs/AUTH.md`.

## Local Development

```bash
cd Dashboard-Web && docker compose up -d
```

Dev container: `dashboard-web`, port **9086** (Vite dev server, hot reload via mounted volumes). Talks to the local Dashboard-API at `http://localhost:8085/api` (`VITE_ADMIN_API_TARGET`, proxied under `/admin-api`). The public Bible-API is not used by this dashboard at all — everything goes to the admin API.

Prod-config variant runs from the repo root, not here:

```bash
cd /root/cep && docker compose up -d dashboard-web-prod   # port 9087
```

`dashboard-web-prod` points at `https://api.bible.garden/admin-api`.

Env vars: copy `.env.example` → `.env` (`VITE_ADMIN_API_TARGET`, `VITE_ADMIN_API_KEY`, `VITE_ALIGNMENT_API_TARGET`).

`VITE_ADMIN_API_KEY` has no fallback: if it is missing or empty, the app refuses to
mount and renders a "Configuration error" page naming the variable
(`src/config/api.ts` → `assertApiConfigured`, called from `src/main.ts`).

## Git

Local branch `main` tracks `origin/main`.
