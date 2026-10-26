import { reactive } from 'vue'
import { defaultForm } from '../utils/onboarding'

// Module-level state: the wizard's selections (including uploads, held in memory) survive step changes and even a language switch.
export const form = reactive(defaultForm())
export const wizard = reactive({ step: 0, maxStep: 0, status: 'idle', result: null })
let seeded = false

export function useOnboardingForm(seed) {
  if (!seeded) { Object.assign(form, defaultForm(seed)); seeded = true }
  return { form, wizard }
}
