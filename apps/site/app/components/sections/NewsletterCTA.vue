<template>
  <section class="py-12 sm:py-16 bg-slate-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8">
        <!-- Left: Text -->
        <div class="text-center md:text-left flex-1">
          <h2 class="text-xl sm:text-2xl font-bold text-white mb-2">
            {{ $t('sections.newsletter') }}
          </h2>
          <p class="text-white/60 text-sm">{{ $t('sections.newsletterDesc') }}</p>
        </div>

        <!-- Center: TURSAB badge (if available) -->
        <div v-if="partner.tursab?.photo?.link" class="shrink-0">
          <img :src="partner.tursab.photo.link" alt="TURSAB" class="h-12 opacity-60" />
        </div>

        <!-- Right: Email form -->
        <form
          @submit.prevent="handleSubscribe"
          class="flex gap-2 w-full md:w-auto md:min-w-[340px]"
        >
          <input
            v-model="email"
            type="email"
            :placeholder="$t('sections.emailPlaceholder')"
            required
            class="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors text-sm"
          />
          <button
            type="submit"
            class="px-5 py-3 bg-site-primary hover:bg-site-primary-dark text-white font-semibold rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            {{ $t('sections.subscribe') }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const email = ref('')

function handleSubscribe() {
  email.value = ''
}
</script>
