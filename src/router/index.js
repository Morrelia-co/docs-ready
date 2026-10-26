import { createRouter, createWebHistory } from 'vue-router'
import { languages, defaultLanguage } from 'virtual:docs-manifest'
import { langDocs, homeOf, onboardingPathFor, aboutPathFor, site } from '../composables/useDocs'

// "/" and "/<code>" redirect to the first page of that language.
const homes = languages
  .filter((l) => langDocs(l.code).length)
  .map((l) => ({ path: l.code === defaultLanguage ? '/' : '/' + l.code, redirect: homeOf(l.code) }))

// Built-in pages, one route per language, declared before the catch-all docs route.
const pages = []
// __ONBOARDING__ is a build-time constant (vite.config.js), so the wizard is dropped from builds that disable it.
if (__ONBOARDING__ && site.features.onboarding) {
  pages.push(...languages.map((l) => ({ path: onboardingPathFor(l.code), meta: { lang: l.code, onboarding: true }, component: () => import('../views/OnboardingPage.vue') })))
}
if (site.features.about) {
  pages.push(...languages.map((l) => ({ path: aboutPathFor(l.code), meta: { lang: l.code, about: true }, component: () => import('../views/AboutPage.vue') })))
}

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...homes, ...pages, { path: '/:path(.*)', component: () => import('../views/DocsPage.vue') }],
  // Hash targets are handled by DocsPage once the (lazy) content has rendered.
  scrollBehavior: (to, from, saved) => saved || (to.path !== from.path ? { top: 0 } : false),
})
