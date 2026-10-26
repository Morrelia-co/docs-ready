<script setup>
import { form } from '../../composables/useOnboardingForm'
import { useDocs } from '../../composables/useDocs'
defineProps({ errors: { type: Object, default: () => ({}) } })
const { t } = useDocs()
const desc = (key, help = true) => [help && `h-${key}`, `e-${key}`].join(' ')
</script>

<template>
  <div class="space-y-6">
    <div>
      <label class="field-label" for="f-name">{{ t('obProjectName') }}</label>
      <input id="f-name" v-model="form.name" class="input" type="text" maxlength="80" autocomplete="off" required :aria-invalid="!!errors.name" :aria-describedby="errors.name ? desc('name') : 'h-name'" />
      <p id="h-name" class="field-help">{{ t('obProjectNameHelp') }}</p>
      <p v-if="errors.name" id="e-name" class="field-error" role="alert">{{ t(errors.name) }}</p>
    </div>
    <div>
      <label class="field-label" for="f-description">{{ t('obDescription') }}</label>
      <textarea id="f-description" v-model="form.description" class="input" rows="2" :aria-invalid="!!errors.description" :aria-describedby="errors.description ? desc('description') : 'h-description'" />
      <p id="h-description" class="field-help">{{ t('obDescriptionHelp') }}</p>
      <p v-if="errors.description" id="e-description" class="field-error" role="alert">{{ t(errors.description) }}</p>
    </div>
    <div>
      <label class="field-label" for="f-repoUrl">{{ t('obRepoUrl') }}</label>
      <input id="f-repoUrl" v-model="form.repoUrl" class="input" type="url" placeholder="https://github.com/your-org/your-docs-repo" autocomplete="off" :aria-invalid="!!errors.repoUrl" :aria-describedby="errors.repoUrl ? desc('repoUrl') : 'h-repoUrl'" />
      <p id="h-repoUrl" class="field-help">{{ t('obRepoUrlHelp') }}</p>
      <p v-if="errors.repoUrl" id="e-repoUrl" class="field-error" role="alert">{{ t(errors.repoUrl) }}</p>
    </div>
    <div class="sm:max-w-xs">
      <label class="field-label" for="f-branch">{{ t('obBranch') }}</label>
      <input id="f-branch" v-model="form.branch" class="input font-mono" type="text" autocomplete="off" required :aria-invalid="!!errors.branch" :aria-describedby="errors.branch ? desc('branch') : 'h-branch'" />
      <p id="h-branch" class="field-help">{{ t('obBranchHelp') }}</p>
      <p v-if="errors.branch" id="e-branch" class="field-error" role="alert">{{ t(errors.branch) }}</p>
    </div>
  </div>
</template>
