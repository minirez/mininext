<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 mb-6">{{ $t('booking.guestInfo') }}</h2>

    <form @submit.prevent="goToPayment" class="space-y-6">
      <!-- Contact info -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <div class="flex items-center gap-2 mb-4">
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
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <h3 class="font-semibold text-gray-800">{{ $t('booking.contactInfo') }}</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.firstName') }} *</label
            >
            <input
              v-model="bookingStore.contact.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
              :class="{ 'border-red-300': errors.firstName }"
            />
            <p v-if="errors.firstName" class="text-xs text-red-500 mt-1">
              {{ $t('booking.errors.firstNameRequired') }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.lastName') }} *</label
            >
            <input
              v-model="bookingStore.contact.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
              :class="{ 'border-red-300': errors.lastName }"
            />
            <p v-if="errors.lastName" class="text-xs text-red-500 mt-1">
              {{ $t('booking.errors.lastNameRequired') }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              <svg
                class="w-3.5 h-3.5 inline mr-1 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
              {{ $t('booking.email') }} *
            </label>
            <input
              v-model="bookingStore.contact.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
              :class="{ 'border-red-300': errors.email }"
            />
            <p v-if="errors.email" class="text-xs text-red-500 mt-1">
              {{ $t('booking.errors.emailInvalid') }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"
              >{{ $t('booking.phone') }} *</label
            >
            <PhoneInput
              v-model="bookingStore.contact.phone"
              :error="errors.phone ? $t('booking.errors.phoneInvalid') : ''"
            />
          </div>
        </div>
      </div>

      <!-- Room guests -->
      <div v-if="bookingStore.cart.length" class="space-y-4">
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
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          <h3 class="font-semibold text-gray-800">{{ $t('booking.guestDetails') }}</h3>
        </div>

        <div
          v-for="(item, idx) in bookingStore.cart"
          :key="item.id"
          class="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <!-- Room header -->
          <div class="bg-gray-50 px-4 py-3 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium text-sm text-gray-900">{{ item.roomTypeName }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ item.mealPlanName }}</span>
              </div>
              <span v-if="bookingStore.cart.length > 1" class="text-xs text-gray-400">
                {{ $t('booking.roomGuests', { n: idx + 1 }) }}
              </span>
            </div>
          </div>

          <!-- Guest rows -->
          <div class="p-4 space-y-4">
            <div
              v-for="(guest, gIdx) in bookingStore.roomGuests[item.id]"
              :key="gIdx"
              class="space-y-3"
            >
              <!-- Guest badge -->
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="
                    guest.type === 'adult'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-purple-50 text-purple-700'
                  "
                >
                  {{
                    guest.type === 'adult'
                      ? `${$t('booking.adult')} ${gIdx + 1}`
                      : $t('booking.childWithAge', { age: guest.age })
                  }}
                </span>
                <span
                  v-if="guest.isLead"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
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
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    />
                  </svg>
                  {{ $t('booking.leadGuest') }}
                </span>
              </div>

              <!-- Guest fields -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <!-- Title -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">{{
                    $t('booking.title')
                  }}</label>
                  <select
                    v-model="guest.title"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-site-primary focus:border-site-primary bg-white"
                  >
                    <option value="">{{ $t('booking.selectTitle') }}</option>
                    <option value="mr">{{ $t('booking.mr') }}</option>
                    <option value="mrs">{{ $t('booking.mrs') }}</option>
                  </select>
                </div>
                <!-- First Name -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >{{ $t('booking.firstName') }} *</label
                  >
                  <input
                    v-model="guest.firstName"
                    type="text"
                    :disabled="guest.isLead"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-site-primary focus:border-site-primary disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
                <!-- Last Name -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1"
                    >{{ $t('booking.lastName') }} *</label
                  >
                  <input
                    v-model="guest.lastName"
                    type="text"
                    :disabled="guest.isLead"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-site-primary focus:border-site-primary disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <!-- Separator between guests -->
              <div
                v-if="gIdx < (bookingStore.roomGuests[item.id]?.length || 0) - 1"
                class="border-b border-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Special requests -->
      <div class="bg-white border border-gray-200 rounded-xl p-6">
        <label class="block text-sm font-medium text-gray-700 mb-1">{{
          $t('booking.specialRequests')
        }}</label>
        <textarea
          v-model="bookingStore.specialRequests"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-site-primary focus:border-site-primary text-sm"
        />
      </div>

      <!-- Navigation -->
      <div class="flex justify-between">
        <button
          type="button"
          @click="bookingStore.goToStep(1)"
          class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {{ $t('common.back') }}
        </button>
        <button
          type="submit"
          class="px-6 py-2 bg-site-primary text-white rounded-lg text-sm font-medium hover:bg-site-primary-dark transition-colors"
        >
          {{ $t('common.next') }}: {{ $t('booking.payment') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { t: $t } = useI18n()
const bookingStore = useBookingStore()

const errors = ref<Record<string, boolean>>({})

// Sync lead guest name from contact
watch(
  () => [bookingStore.contact.firstName, bookingStore.contact.lastName] as const,
  ([fn, ln]) => {
    const firstItem = bookingStore.cart[0]
    if (!firstItem) return
    const guests = bookingStore.roomGuests[firstItem.id]
    if (!guests) return
    const lead = guests.find(g => g.isLead)
    if (lead) {
      lead.firstName = fn || ''
      lead.lastName = ln || ''
    }
  }
)

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function goToPayment() {
  errors.value = {}

  if (!bookingStore.contact.firstName) errors.value.firstName = true
  if (!bookingStore.contact.lastName) errors.value.lastName = true
  if (!bookingStore.contact.email || !validateEmail(bookingStore.contact.email))
    errors.value.email = true
  if (!bookingStore.contact.phone || bookingStore.contact.phone.replace(/\D/g, '').length < 10)
    errors.value.phone = true

  // Validate room guests
  let hasGuestError = false
  for (const item of bookingStore.cart) {
    const guests = bookingStore.roomGuests[item.id]
    if (!guests) continue
    for (const guest of guests) {
      if (!guest.firstName || !guest.lastName) {
        hasGuestError = true
        break
      }
    }
    if (hasGuestError) break
  }
  if (hasGuestError) errors.value.guests = true

  if (Object.keys(errors.value).length > 0) return

  bookingStore.goToStep(3)
}
</script>
