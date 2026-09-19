import { createRouter, createWebHistory } from 'vue-router'
import { authService } from '../services/auth'
import BaseLayout from '../Components/BaseLayout.vue'
import Login from '../Components/Login.vue'
import Welcome from '../Components/Welcome.vue'
import BibleVoices from '../Components/BibleVoices.vue'
import BibleAnomalies from '../Components/BibleAnomalies.vue'
import BibleInspect from '../Components/BibleInspect.vue'
import AlignmentTasks from '../Components/AlignmentTasks.vue'
import ApiStats from '../Components/ApiStats.vue'
import ContentReports from '../Components/ContentReports.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/',
            component: BaseLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'home',
                    component: Welcome
                },
                {
                    path: 'voices',
                    name: 'voices',
                    component: BibleVoices
                },
                {
                    path: 'anomalies',
                    name: 'anomalies',
                    component: BibleAnomalies
                },
                {
                    path: 'inspect',
                    name: 'inspect',
                    component: BibleInspect
                },
                {
                    path: 'tasks',
                    name: 'alignment_tasks',
                    component: AlignmentTasks
                },
                {
                    path: 'stats',
                    name: 'stats',
                    component: ApiStats
                },
                {
                    path: 'content-reports',
                    name: 'content_reports',
                    component: ContentReports
                }
            ]
        },
        // Catch-all route to redirect 404s to home
        {
            path: '/:pathMatch(.*)*',
            redirect: '/'
        }
    ]
})

router.beforeEach((to, from, next) => {
    const isAuthenticated = authService.isAuthenticated()

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login' })
    } else if (to.name === 'login' && isAuthenticated) {
        next({ name: 'home' })
    } else {
        next()
    }
})

export default router
