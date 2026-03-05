<template>
  <div id="room-availability">
    <h2 class="text-xl font-bold text-gray-900 mb-4">{{ $t('hotel.roomAvailability') }}</h2>

    <!-- Promo code toggle -->
    <div v-if="searchStore.hasDates" class="mb-4">
      <button
        v-if="!showPromo"
        @click="showPromo = true"
        class="text-sm text-site-primary hover:underline"
      >
        {{ $t('booking.havePromoCode') }}
      </button>
      <div v-else class="max-w-md">
        <PromoCodeInput :hotel-code="hotelCode" @applied="doSearch" />
      </div>
    </div>

    <!-- No dates hint -->
    <div
      v-if="!searchStore.hasDates"
      class="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center"
    >
      <svg
        class="w-10 h-10 text-gray-300 mx-auto mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
      <p class="text-gray-500 text-sm">{{ $t('search.selectDatesHint') }}</p>
    </div>

    <!-- Loading -->
    <div v-else-if="searching" class="space-y-4">
      <div v-for="i in 3" :key="i" class="border border-gray-200 rounded-xl p-4 animate-pulse">
        <div class="flex gap-4">
          <div class="w-32 h-24 bg-gray-200 rounded-lg shrink-0" />
          <div class="flex-1 space-y-3">
            <div class="h-5 bg-gray-200 rounded w-1/3" />
            <div class="h-4 bg-gray-200 rounded w-2/3" />
            <div class="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="availableRooms.length" class="space-y-4">
      <div
        v-for="room in availableRooms"
        :key="room.roomType?.code"
        class="border border-gray-200 rounded-xl overflow-hidden"
      >
        <!-- Room header -->
        <div class="flex flex-col sm:flex-row">
          <!-- Room image -->
          <div
            class="sm:w-48 shrink-0 relative group cursor-pointer"
            @click="openLightbox(room.roomType)"
          >
            <img
              v-if="room.roomType?.images?.[0]"
              :src="room.roomType.images[0].url || room.roomType.images[0]"
              :alt="mlText(room.roomType.name)"
              class="w-full h-36 sm:h-full object-cover"
            />
            <div
              v-else
              class="w-full h-36 sm:h-full bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1"
                  d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0H21"
                />
              </svg>
            </div>
            <!-- Image count badge -->
            <div
              v-if="getRoomImages(room.roomType).length > 1"
              class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-md flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
            >
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v10.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              {{ getRoomImages(room.roomType).length }}
            </div>
          </div>

          <!-- Room info + options -->
          <div class="flex-1 p-4">
            <h3 class="font-semibold text-gray-900 mb-1">{{ mlText(room.roomType?.name) }}</h3>
            <div v-if="room.roomType?.description" class="text-sm text-gray-500 mb-3">
              <div
                class="room-desc max-w-none [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_br]:content-[''] [&_br]:block [&_br]:mb-1"
                :class="{ 'line-clamp-3': !expandedDescs[room.roomType.code] }"
                v-html="sanitizeHtml(mlText(room.roomType.description))"
              />
              <button
                v-if="isDescLong(room.roomType)"
                @click="expandedDescs[room.roomType.code] = !expandedDescs[room.roomType.code]"
                class="text-xs text-site-primary hover:underline mt-1"
              >
                {{
                  expandedDescs[room.roomType.code] ? $t('common.close') : $t('common.viewDetails')
                }}
              </button>
            </div>

            <!-- Options (meal plans) -->
            <div class="space-y-2">
              <template v-for="option in room.options" :key="option.mealPlan?.code">
                <!-- Available option -->
                <div
                  v-if="isOptionAvailable(option)"
                  class="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 gap-2"
                >
                  <div class="flex-1">
                    <span class="text-sm font-medium text-gray-800">{{
                      mlText(option.mealPlan?.name)
                    }}</span>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        v-if="option.campaigns?.length"
                        class="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded"
                      >
                        {{ option.campaigns[0].discountText || mlText(option.campaigns[0].name) }}
                      </span>
                      <span
                        v-if="option.cancellationPolicy?.freeCancellation"
                        class="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {{ $t('hotel.freeCancellation') }}
                      </span>
                      <!-- Cancellation policy link -->
                      <button
                        v-if="option.cancellationPolicy"
                        @click.stop="openCancellationModal(option.cancellationPolicy)"
                        class="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 hover:text-site-primary transition-colors"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                          />
                        </svg>
                        {{ $t('booking.cancellationPolicy') }}
                      </button>
                      <span
                        v-if="option.availability && option.availability <= 5"
                        class="text-[10px] font-medium text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded"
                      >
                        {{ $t('hotel.lastRooms', { n: option.availability }) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <div
                        v-if="
                          getOptionPricing(option).originalTotal &&
                          getOptionPricing(option).originalTotal !==
                            getOptionPricing(option).finalTotal
                        "
                        class="text-xs text-gray-400 line-through"
                      >
                        {{
                          formatPrice(
                            getOptionPricing(option).originalTotal,
                            getOptionPricing(option).currency || 'TRY'
                          )
                        }}
                      </div>
                      <div class="font-bold text-gray-900">
                        {{
                          formatPrice(
                            getOptionPricing(option).finalTotal,
                            getOptionPricing(option).currency || 'TRY'
                          )
                        }}
                      </div>
                      <div class="text-xs text-gray-400">
                        {{ searchStore.nights }} {{ $t('common.nights') }}
                      </div>
                    </div>
                    <!-- In cart: badge + remove -->
                    <div
                      v-if="bookingStore.isInCart(room.roomType.code, option.mealPlan.code)"
                      class="flex items-center gap-2"
                    >
                      <span
                        class="inline-flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {{ $t('booking.inCart') }}
                      </span>
                      <button
                        @click="removeFromCart(room.roomType.code, option.mealPlan.code)"
                        class="text-xs text-red-500 hover:text-red-700 font-medium underline"
                      >
                        {{ $t('booking.removeFromCart') }}
                      </button>
                    </div>
                    <!-- Not in cart: add button -->
                    <button
                      v-else
                      @click="addRoomToCart(room, option)"
                      class="px-4 py-2 bg-site-primary text-white text-sm font-medium rounded-lg hover:bg-site-primary-dark transition-colors whitespace-nowrap"
                    >
                      {{ $t('booking.addToCart') }}
                    </button>
                  </div>
                </div>

                <!-- Unavailable option -->
                <div
                  v-else
                  class="flex items-center justify-between bg-red-50/50 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <span class="text-sm font-medium text-gray-500">{{
                      mlText(option.mealPlan?.name)
                    }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-red-500">
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span class="text-xs font-medium">{{ getUnavailReason(option) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No results -->
    <div v-else-if="searched" class="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
      <p class="text-gray-500 text-sm">{{ $t('hotel.noRoomsAvailable') }}</p>
    </div>

    <!-- Error -->
    <div
      v-if="searchError"
      class="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600"
    >
      {{ searchError }}
    </div>

    <!-- Image Lightbox Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="lightboxOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          @click.self="lightboxOpen = false"
        >
          <!-- Close button -->
          <button
            @click="lightboxOpen = false"
            class="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Room name -->
          <div
            class="absolute top-4 left-4 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-lg"
          >
            {{ lightboxTitle }}
          </div>

          <!-- Image counter -->
          <div
            v-if="lightboxImages.length > 1"
            class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-lg"
          >
            {{ lightboxIndex + 1 }} / {{ lightboxImages.length }}
          </div>

          <!-- Prev button -->
          <button
            v-if="lightboxImages.length > 1"
            @click.stop="lightboxPrev"
            class="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <!-- Main image -->
          <img
            :src="lightboxImages[lightboxIndex]"
            :alt="lightboxTitle"
            class="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
            @click.stop
          />

          <!-- Next button -->
          <button
            v-if="lightboxImages.length > 1"
            @click.stop="lightboxNext"
            class="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <!-- Thumbnail strip -->
          <div
            v-if="lightboxImages.length > 1"
            class="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto py-2 px-1"
          >
            <button
              v-for="(img, idx) in lightboxImages"
              :key="idx"
              @click.stop="lightboxIndex = idx"
              class="w-14 h-10 rounded-md overflow-hidden shrink-0 border-2 transition-all"
              :class="
                idx === lightboxIndex
                  ? 'border-white opacity-100'
                  : 'border-transparent opacity-50 hover:opacity-80'
              "
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Cancellation Policy Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCancellationModal"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          @click.self="showCancellationModal = false"
        >
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <svg
                  class="w-5 h-5 text-site-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                <h3 class="font-semibold text-gray-900">{{ $t('booking.cancellationPolicy') }}</h3>
              </div>
              <button
                @click="showCancellationModal = false"
                class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  class="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-4 space-y-3">
              <!-- Free cancellation info -->
              <div
                v-if="selectedCancellationPolicy?.freeCancellation"
                class="flex items-start gap-2 p-3 bg-green-50 rounded-lg"
              >
                <svg
                  class="w-5 h-5 text-green-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-green-800">
                    {{ $t('hotel.freeCancellation') }}
                  </p>
                  <p
                    v-if="selectedCancellationPolicy.freeCancellationDate"
                    class="text-xs text-green-600 mt-0.5"
                  >
                    {{
                      $t('booking.freeCancellationUntil', {
                        date: formatDate(selectedCancellationPolicy.freeCancellationDate)
                      })
                    }}
                  </p>
                </div>
              </div>
              <div v-else class="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <svg
                  class="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p class="text-sm font-medium text-red-800">{{ $t('booking.nonRefundable') }}</p>
              </div>

              <!-- Rules list -->
              <div v-if="selectedCancellationPolicy?.rules?.length" class="space-y-2">
                <h4 class="text-sm font-medium text-gray-700">
                  {{ $t('booking.cancellationRules') }}
                </h4>
                <div
                  v-for="(rule, idx) in selectedCancellationPolicy.rules"
                  :key="idx"
                  class="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                >
                  <span class="text-gray-600">{{
                    rule.description ||
                    rule.dateRange ||
                    `${rule.daysBeforeCheckIn}+ ${$t('common.night')}`
                  }}</span>
                  <span
                    class="font-medium"
                    :class="rule.penalty > 0 ? 'text-red-600' : 'text-green-600'"
                  >
                    {{
                      rule.penalty > 0
                        ? `${rule.penaltyText || rule.penalty + '%'}`
                        : $t('booking.noFee')
                    }}
                  </span>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <button
                @click="showCancellationModal = false"
                class="w-full py-2 bg-site-primary text-white rounded-lg text-sm font-medium hover:bg-site-primary-dark transition-colors"
              >
                {{ $t('common.close') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify'

const props = defineProps<{ hotelCode: string }>()

const { t: $t, locale } = useI18n()
const searchStore = useSearchStore()
const bookingStore = useBookingStore()
const { formatPrice } = useCurrency()
const { availableRooms, searching, searchError, searchAvailability } = useAvailabilitySearch()
const searched = ref(false)
const showPromo = ref(false)

// Description expand state
const expandedDescs = ref<Record<string, boolean>>({})

function isDescLong(roomType: any): boolean {
  const desc = mlText(roomType?.description)
  if (!desc) return false
  // Strip HTML and check length
  const text = desc.replace(/<[^>]*>/g, '')
  return text.length > 120
}

// Lightbox state
const lightboxOpen = ref(false)
const lightboxImages = ref<string[]>([])
const lightboxIndex = ref(0)
const lightboxTitle = ref('')

function getRoomImages(roomType: any): string[] {
  if (!roomType?.images?.length) return []
  return roomType.images.map((img: any) => img.url || img).filter(Boolean)
}

function openLightbox(roomType: any) {
  const images = getRoomImages(roomType)
  if (!images.length) return
  lightboxImages.value = images
  lightboxIndex.value = 0
  lightboxTitle.value = mlText(roomType.name)
  lightboxOpen.value = true
}

function lightboxNext() {
  lightboxIndex.value = (lightboxIndex.value + 1) % lightboxImages.value.length
}

function lightboxPrev() {
  lightboxIndex.value =
    (lightboxIndex.value - 1 + lightboxImages.value.length) % lightboxImages.value.length
}

// Keyboard navigation for lightbox
function handleLightboxKeydown(e: KeyboardEvent) {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') lightboxOpen.value = false
  if (e.key === 'ArrowRight') lightboxNext()
  if (e.key === 'ArrowLeft') lightboxPrev()
}

onMounted(() => {
  document.addEventListener('keydown', handleLightboxKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleLightboxKeydown)
})

// Cancellation modal
const showCancellationModal = ref(false)
const selectedCancellationPolicy = ref<any>(null)

function openCancellationModal(policy: any) {
  selectedCancellationPolicy.value = policy
  showCancellationModal.value = true
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function sanitizeHtml(html: string): string {
  if (!html) return ''
  if (import.meta.server) return html
  return DOMPurify.sanitize(html)
}

function mlText(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  return (
    val[locale.value] ||
    val.en ||
    val.tr ||
    (Object.values(val).find((v: any) => v) as string) ||
    ''
  )
}

function getOptionPricing(option: any) {
  const p = option.pricing || option.prices || {}
  return {
    finalTotal: p.finalTotal || p.total || 0,
    originalTotal: p.originalTotal || 0,
    avgPerNight: p.avgPerNight || p.perNight || 0,
    currency: p.currency || searchStore.currency
  }
}

const unavailReasons: Record<string, string> = {
  minStay: 'hotel.unavailReasons.minStay',
  releaseDays: 'hotel.unavailReasons.releaseDays',
  stopSale: 'hotel.unavailReasons.stopSale',
  noInventory: 'hotel.unavailReasons.noInventory',
  closedToArrival: 'hotel.unavailReasons.closedToArrival',
  closedToDeparture: 'hotel.unavailReasons.closedToDeparture',
  capacityExceeded: 'hotel.unavailReasons.capacityExceeded'
}

function isOptionAvailable(option: any) {
  if (option.available === false) return false
  if (option.issues?.length) return false
  const pricing = option.pricing || option.prices
  if (!pricing) return false
  const total = pricing.finalTotal || pricing.total || 0
  return total > 0
}

function getUnavailReason(option: any) {
  const issue = option.issues?.[0]
  if (!issue) return $t('hotel.notAvailable')
  const key = unavailReasons[issue.type || issue.code]
  if (key) {
    return $t(key, { n: issue.minStay || issue.value || '' })
  }
  return issue.message || $t('hotel.notAvailable')
}

function addRoomToCart(room: any, option: any) {
  const pricing = option.pricing || option.prices
  bookingStore.searchParams = {
    checkIn: searchStore.checkIn,
    checkOut: searchStore.checkOut,
    adults: searchStore.adults,
    children: searchStore.children
  }

  bookingStore.addToCart({
    roomTypeCode: room.roomType.code,
    roomTypeName: mlText(room.roomType.name),
    mealPlanCode: option.mealPlan.code,
    mealPlanName: mlText(option.mealPlan.name),
    price: pricing,
    availability: option.availability,
    images: room.roomType.images || [],
    guests: { adults: searchStore.adults, children: searchStore.children }
  })
}

function removeFromCart(roomTypeCode: string, mealPlanCode: string) {
  const item = bookingStore.cart.find(
    i => i.roomTypeCode === roomTypeCode && i.mealPlanCode === mealPlanCode
  )
  if (item) bookingStore.removeFromCart(item.id)
}

async function doSearch() {
  if (!searchStore.hasDates) return
  searched.value = true
  await searchAvailability(props.hotelCode, {
    checkIn: searchStore.checkIn,
    checkOut: searchStore.checkOut,
    adults: searchStore.adults,
    children: searchStore.children,
    currency: searchStore.currency,
    countryCode: searchStore.countryCode
  })
}

// Watch for search date changes
watch(
  () => [searchStore.checkIn, searchStore.checkOut, searchStore.adults],
  () => {
    if (searchStore.hasDates) {
      doSearch()
    }
  }
)

// Auto-search on mount if dates exist
onMounted(() => {
  if (searchStore.hasDates) {
    doSearch()
  }
})

defineExpose({ doSearch })
</script>
