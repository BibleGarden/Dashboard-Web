<template>
    <div class="h-screen flex relative lg:static bg-surface-50 dark:bg-surface-950">
        <div id="app-sidebar-13"
            class="w-[280px] bg-surface-50 dark:bg-surface-950 h-screen hidden lg:block flex-shrink-0 absolute lg:fixed left-0 top-0 z-10 select-none shadow-lg lg:shadow-none">
            <div class="flex flex-col h-full lg:py-8">
                <div class="flex items-center justify-start px-4 py-4">
                    <div class="flex items-center gap-4">
                        <img src="@/assets/logo.png" alt="Logo" width="32" height="32" class="flex-shrink-0" />
                        <span class="text-lg font-semibold leading-tight text-surface-900 dark:text-surface-0">Forced Alignments</span>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2 flex flex-col gap-4">
                    <ul class="list-none p-0 m-0 flex flex-col gap-1">

                        <!-- Monitoring Group -->
                        <li>
                            <div v-styleclass="{
                                selector: '@next',
                                enterFromClass: 'hidden',
                                enterActiveClass: 'animate-slidedown',
                                leaveToClass: 'hidden',
                                leaveActiveClass: 'animate-slideup'
                            }"
                                class="flex items-center cursor-pointer p-3 gap-4 rounded-md text-surface-900 dark:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700 transition-colors duration-150">
                                <span class="font-semibold text-base leading-tight">Monitoring</span>
                                <ChevronDown class="w-5 h-5 text-surface-500 dark:text-surface-400 ml-auto" />
                            </div>
                            <ul class="list-none p-0 m-0 overflow-hidden flex flex-col gap-1">
                                <li>
                                    <router-link to="/stats" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate" :class="[
                                            'flex items-center cursor-pointer p-3 gap-2 rounded-lg transition-colors duration-150 border group',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700'
                                        ]" data-testid="nav-api-stats">
                                            <BarChart3 :class="[
                                                'w-5 h-5',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                            ]" />
                                            <span class="font-medium text-base leading-tight">API Stats</span>
                                        </a>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/content-reports" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate" :class="[
                                            'flex items-center cursor-pointer p-3 gap-2 rounded-lg transition-colors duration-150 border group',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700'
                                        ]" data-testid="nav-content-reports">
                                            <MessageSquareWarning :class="[
                                                'w-5 h-5',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                            ]" />
                                            <span class="font-medium text-base leading-tight">Content Reports</span>
                                        </a>
                                    </router-link>
                                </li>
                            </ul>
                        </li>

                        <!-- Bibles Group -->
                        <li>
                            <div v-styleclass="{
                                selector: '@next',
                                enterFromClass: 'hidden',
                                enterActiveClass: 'animate-slidedown',
                                leaveToClass: 'hidden',
                                leaveActiveClass: 'animate-slideup'
                            }"
                                class="flex items-center cursor-pointer p-3 gap-4 rounded-md text-surface-900 dark:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700 transition-colors duration-150">
                                <span class="font-semibold text-base leading-tight">Bibles</span>
                                <ChevronDown class="w-5 h-5 text-surface-500 dark:text-surface-400 ml-auto" />
                            </div>
                            <ul class="list-none p-0 m-0 overflow-hidden flex flex-col gap-1">
                                <li>
                                    <router-link to="/voices" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate" :class="[
                                            'flex items-center cursor-pointer p-3 gap-2 rounded-lg transition-colors duration-150 border group',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700'
                                        ]" data-testid="nav-bible-voices">
                                            <VoiceIcon :class="[
                                                'w-5 h-5',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                            ]" />
                                            <span class="font-medium text-base leading-tight">Voices</span>
                                        </a>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/anomalies" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate" :class="[
                                            'flex items-center cursor-pointer p-3 gap-2 rounded-lg transition-colors duration-150 border group',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700'
                                        ]" data-testid="nav-bible-anomalies">
                                            <AlertTriangle :class="[
                                                'w-5 h-5',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                            ]" />
                                            <span class="font-medium text-base leading-tight">Anomalies</span>
                                        </a>
                                    </router-link>
                                </li>
                                <li>
                                    <router-link to="/inspect" custom v-slot="{ href, navigate, isActive }">
                                        <a :href="href" @click="navigate" :class="[
                                            'flex items-center cursor-pointer p-3 gap-2 rounded-lg transition-colors duration-150 border group',
                                            isActive
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                                                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-50 border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700'
                                        ]" data-testid="nav-bible-inspect">
                                            <Search :class="[
                                                'w-5 h-5',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                            ]" />
                                            <span class="font-medium text-base leading-tight">Inspect</span>
                                        </a>
                                    </router-link>
                                </li>
                            </ul>
                        </li>

                    </ul>

                    <!-- Theme Toggle - Mobile Only -->
                    <div class="h-px bg-surface-200 dark:bg-surface-700 lg:hidden" />
                    <ul class="list-none p-0 m-0 flex flex-col gap-1 lg:hidden">
                        <li>
                            <a @click="toggleDarkMode()"
                                class="flex items-center cursor-pointer p-3 gap-2 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 hover:text-surface-900 dark:hover:text-surface-50 border border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700 group"
                                data-testid="mobile-theme-toggle">
                                <i :class="[
                                    'pi !text-base !leading-none',
                                    isDarkMode ? 'pi-sun' : 'pi-moon',
                                    'text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50'
                                ]" />
                                <span class="font-medium text-base leading-tight">
                                    {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
                                </span>
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="p-2 hidden lg:block">
                    <ul class="list-none p-0 m-0 flex flex-col gap-1">
                        <li class="relative settings-menu-container">
                            <a @click="toggleSettingsMenu"
                                class="flex items-center cursor-pointer p-3 gap-2 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 hover:text-surface-900 dark:hover:text-surface-50 border border-transparent hover:border hover:border-surface-200 dark:hover:border-surface-700 group"
                                data-testid="settings-menu-toggle">
                                <Settings
                                    class="w-5 h-5 text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                                <span class="font-medium text-base leading-tight">Settings</span>
                                <ChevronUp
                                    class="w-5 h-5 text-surface-500 dark:text-surface-400 ml-auto transition-transform duration-200"
                                    :class="{ 'rotate-180': !showSettingsMenu }" />
                            </a>

                            <!-- Settings Dropdown Menu -->
                            <div v-show="showSettingsMenu"
                                class="absolute bottom-full left-0 mb-2 w-full bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg z-50">
                                <ul class="list-none p-2 m-0 flex flex-col gap-1">
                                    <li>
                                        <a @click="setTheme('light')"
                                            class="flex items-center cursor-pointer p-2 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 hover:text-surface-900 dark:hover:text-surface-50 group">
                                            <Sun
                                                class="w-5 h-5 text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                                            <span class="ml-2 font-medium text-sm">Light Theme</span>
                                            <Check v-if="!isDarkMode"
                                                class="w-5 h-5 text-primary-600 dark:text-primary-400 ml-auto" />
                                        </a>
                                    </li>
                                    <li>
                                        <a @click="setTheme('dark')"
                                            class="flex items-center cursor-pointer p-2 rounded-lg text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-150 hover:text-surface-900 dark:hover:text-surface-50 group">
                                            <Moon
                                                class="w-4 h-4 text-surface-500 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50" />
                                            <span class="ml-2 font-medium text-sm">Dark Theme</span>
                                            <Check v-if="isDarkMode"
                                                class="w-4 h-4 text-primary-600 dark:text-primary-400 ml-auto" />
                                        </a>
                                    </li>
                                    <li class="h-px bg-surface-200 dark:bg-surface-700 my-1" />
                                    <li>
                                        <a @click="handleLogout"
                                            class="flex items-center cursor-pointer p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 group"
                                            data-testid="settings-logout-button">
                                            <Lock
                                                class="w-4 h-4" />
                                            <span class="ml-2 font-medium text-sm">Logout</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div
            class="h-screen flex flex-col flex-auto bg-surface-50 dark:bg-surface-950 overflow-hidden p-5 md:p-8 lg:pl-2 lg:ml-[280px]">
            
            <!-- Main App Content -->
            <div
                class="bg-surface-0 dark:bg-surface-900 flex flex-col flex-auto rounded-xl shadow-md border border-surface-200 dark:border-surface-700 overflow-hidden">
                <!-- Main Content Area - full height scrollable -->
                <div class="flex-auto overflow-y-auto p-5 md:p-8">
                    <!-- Mobile menu and controls - inside scrollable area -->
                    <div class="flex justify-between items-center mb-8 lg:hidden">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{{ pageTitle.icon }}</span>
                            <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ pageTitle.title }}
                            </h1>
                        </div>
                        <div class="flex items-center gap-2">
                            <a v-styleclass="{
                                selector: '#app-sidebar-13',
                                enterFromClass: 'hidden',
                                enterActiveClass: 'animate-fadeinleft',
                                leaveToClass: 'hidden',
                                leaveActiveClass: 'animate-fadeoutleft',
                                hideOnOutsideClick: true
                            }" class="cursor-pointer text-surface-700 dark:text-surface-100">
                                <Menu class="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    <!-- Desktop header - inside scrollable area -->
                    <div class="hidden lg:flex justify-between items-center mb-8">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{{ pageTitle.icon }}</span>
                            <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-0">{{ pageTitle.title }}
                            </h1>
                        </div>
                        <button @click="toggleDarkMode()"
                            class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors duration-200"
                            data-testid="desktop-theme-toggle">
                            <component :is="isDarkMode ? Sun : Moon"
                                class="w-6 h-6 text-surface-700 dark:text-surface-300" />
                        </button>
                    </div>

                    <router-view />
                </div>
            </div>
        </div>
    </div>
    <Toast />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useToast } from 'primevue/usetoast'

// Lucide imports
import {
    ChevronDown,
    ChevronUp,
    Volume2 as VoiceIcon,
    AlertTriangle,
    Search,
    Clock,
    Settings,
    Sun,
    Moon,
    Check,
    Menu,
    Lock,
    BarChart3,
    MessageSquareWarning
} from 'lucide-vue-next'

const isDarkMode = ref<boolean>(false)
const showSettingsMenu = ref<boolean>(false)

const { logout } = useAuth()
const router = useRouter()
const route = useRoute()
const toast = useToast()

// Dynamic page title based on active route
const pageTitle = computed(() => {
    switch (route.name) {
        case 'home':
            return { icon: '👋', title: 'Welcome!' }
        case 'voices':
            return { icon: '🎧', title: 'Voices' }
        case 'anomalies':
            return { icon: '⚠️', title: 'Anomalies' }
        case 'inspect':
            return { icon: '🔍', title: 'Bible Inspect' }
        case 'alignment_tasks':
            return { icon: '⏱️', title: 'Alignment Tasks' }
        case 'stats':
            return { icon: '📊', title: 'API Statistics' }
        case 'content_reports':
            return { icon: '⚑', title: 'Content Reports' }
        default:
            return { icon: '👋', title: 'Welcome!' }
    }
})

// Handle click outside to close settings menu
const handleClickOutside = (event: Event) => {
    const target = event.target as Element
    if (!target.closest('.settings-menu-container')) {
        showSettingsMenu.value = false
    }
}

onMounted(() => {
    // Check system theme settings
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // If theme is not selected yet, set system theme
    if (prefersDark && !document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    }

    // Update icon state
    isDarkMode.value = document.documentElement.classList.contains('dark');

    // Add system theme change tracking
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!e.matches) {
            document.documentElement.classList.remove('dark');
            isDarkMode.value = false;
        } else {
            document.documentElement.classList.add('dark');
            isDarkMode.value = true;
        }
    });

    // Add click outside listener
    document.addEventListener('click', handleClickOutside)
    
    // Listen for unauthorized access event
    window.addEventListener('auth:unauthorized', () => {
        toast.add({
            severity: 'warn',
            summary: 'Session expired',
            detail: 'Please log in again',
            life: 5000
        })
        router.push('/login')
    })
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
});

function toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark')
    // Update state for icon
    isDarkMode.value = document.documentElement.classList.contains('dark')
}

function toggleSettingsMenu(): void {
    showSettingsMenu.value = !showSettingsMenu.value
}

function setTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.remove('dark')
    }
    isDarkMode.value = document.documentElement.classList.contains('dark')
    showSettingsMenu.value = false // Close menu after selection
}

function handleLogout(): void {
    logout()
    toast.add({
        severity: 'info',
        summary: 'Logout',
        detail: 'You have logged out',
        life: 3000
    })
    router.push('/login')
}

</script>
