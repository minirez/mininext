<template>
  <div class="bg-gray-800/50 border-b border-gray-700/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <!-- Left: Newsletter text -->
        <div class="text-center md:text-left shrink-0">
          <h3 class="text-white font-semibold text-base">{{ $t('sections.newsletter') }}</h3>
          <p class="text-gray-400 text-sm mt-0.5">{{ $t('sections.newsletterDesc') }}</p>
        </div>

        <!-- Center: TURSAB badge -->
        <div v-if="partner.tursab?.photo?.link" class="shrink-0">
          <a
            v-if="partner.tursab.link"
            :href="partner.tursab.link"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <img :src="partner.tursab.photo.link" alt="TURSAB" class="h-10" />
            <span v-if="partner.tursab.documentNumber" class="text-xs text-gray-400">
              TURSAB {{ partner.tursab.documentNumber }}
            </span>
          </a>
          <div v-else class="flex items-center gap-2 opacity-70">
            <img :src="partner.tursab.photo.link" alt="TURSAB" class="h-10" />
            <span v-if="partner.tursab.documentNumber" class="text-xs text-gray-400">
              TURSAB {{ partner.tursab.documentNumber }}
            </span>
          </div>
        </div>

        <!-- Right: Email form -->
        <form
          v-if="!subscribed"
          @submit.prevent="handleSubscribe"
          class="flex gap-2 w-full md:w-auto md:min-w-[320px]"
        >
          <input
            v-model="email"
            type="email"
            :placeholder="$t('sections.emailPlaceholder')"
            required
            class="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-site-primary/50 transition-colors text-sm"
          />
          <button
            type="submit"
            class="px-5 py-2.5 bg-site-primary hover:bg-site-primary-dark text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            {{ $t('sections.subscribe') }}
          </button>
        </form>
        <p v-else class="text-green-400 font-medium text-sm">
          {{ $t('sections.subscribeSuccess') || 'Subscribed successfully!' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const partner = usePartnerStore()
const api = useApi()
const email = ref('')
const subscribed = ref(false)

async function handleSubscribe() {
  if (!email.value) return
  try {
    await api.post('/api/public/storefront/newsletter/subscribe', { email: email.value })
    email.value = ''
    subscribed.value = true
    setTimeout(() => {
      subscribed.value = false
    }, 4000)
  } catch {
    // silent
  }
}
</script>
