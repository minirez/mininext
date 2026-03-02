<template>
  <div class="text-center py-12 px-4">
    <div class="text-4xl mb-4 text-gray-300">
      <slot name="icon">🔍</slot>
    </div>
    <h3 class="text-lg font-medium text-gray-700 mb-2">
      <slot name="title">{{ $t('common.noResults') }}</slot>
    </h3>
    <p v-if="$slots.description" class="text-gray-500 text-sm">
      <slot name="description" />
    </p>
  </div>
</template>
