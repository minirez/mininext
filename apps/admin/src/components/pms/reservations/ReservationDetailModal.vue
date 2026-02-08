<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 transition-opacity"></div>

        <!-- Modal Container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl transform transition-all"
            @click.stop
          >
            <!-- Loading Overlay -->
            <div
              v-if="loading"
              class="absolute inset-0 bg-white/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center z-10"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <span class="text-sm text-gray-500 dark:text-slate-400">{{
                  t('common.loading')
                }}</span>
              </div>
            </div>

            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span class="material-icons text-white text-2xl">event_note</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-3">
                      <h2 class="text-xl font-bold text-white">{{ reservation?.bookingNumber }}</h2>
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="statusBadgeClasses"
                      >
                        {{ statusLabel }}
                      </span>
                    </div>
                    <p class="text-indigo-200 text-sm mt-0.5">
                      {{ getMainGuestName }}
                      <span class="mx-1">&#8226;</span>
                      {{ reservation?.nights || calculateNights }}
                      {{ t('reservations.detail.nights') }}
                      <span class="mx-1">&#8226;</span>
                      {{ sourceLabel }}
                    </p>
                  </div>
                </div>
                <button
                  class="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  @click="close"
                >
                  <span class="material-icons text-white">close</span>
                </button>
              </div>
            </div>

            <!-- Quick Info Bar -->
            <div
              class="grid grid-cols-4 gap-4 px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700"
            >
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ t('reservations.detail.total') }}
                </p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(grandTotal) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ t('reservations.detail.paid') }}
                </p>
                <p class="text-lg font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(paidAmount) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ t('reservations.detail.remaining') }}
                </p>
                <p
                  class="text-lg font-bold"
                  :class="
                    dueAmount > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                  "
                >
                  {{ formatCurrency(dueAmount) }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                  {{ t('reservations.detail.paymentStatus') }}
                </p>
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="paymentStatusClasses"
                >
                  {{ paymentStatusLabel }}
                </span>
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-gray-200 dark:border-slate-700 px-6">
              <nav class="flex gap-6 -mb-px">
                <button
                  v-for="tab in tabs"
                  :key="tab.key"
                  class="py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
                  :class="
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  "
                  @click="activeTab = tab.key"
                >
                  <span class="material-icons text-sm">{{ tab.icon }}</span>
                  {{ tab.label }}
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6 max-h-[400px] overflow-y-auto">
              <!-- Overview Tab -->
              <div v-if="activeTab === 'overview'" class="space-y-6">
                <!-- Guest & Room Info -->
                <div class="grid grid-cols-2 gap-6">
                  <!-- Guest Info -->
                  <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h3
                      class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                    >
                      <span class="material-icons text-sm text-indigo-600">person</span>
                      {{ t('reservations.detail.guestInfo') }}
                    </h3>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.fullName')
                        }}</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{
                          getMainGuestName
                        }}</span>
                      </div>
                      <div v-if="reservation?.contact?.phone" class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('common.phone')
                        }}</span>
                        <a
                          :href="'tel:' + reservation.contact.phone"
                          class="text-indigo-600 hover:underline"
                        >
                          {{ reservation.contact.phone }}
                        </a>
                      </div>
                      <div v-if="reservation?.contact?.email" class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('common.email')
                        }}</span>
                        <span class="text-gray-900 dark:text-white truncate max-w-[180px]">{{
                          reservation.contact.email
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.guestCount')
                        }}</span>
                        <span class="text-gray-900 dark:text-white">
                          {{ reservation?.totalAdults || 1 }} {{ t('reservations.adults') }}
                          <span v-if="reservation?.totalChildren"
                            >, {{ reservation.totalChildren }}
                            {{ t('reservations.children') }}</span
                          >
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Room Info -->
                  <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h3
                      class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                    >
                      <span class="material-icons text-sm text-indigo-600">meeting_room</span>
                      {{ t('reservations.detail.stayInfo') }}
                    </h3>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.roomType')
                        }}</span>
                        <span class="font-medium text-gray-900 dark:text-white">
                          {{ reservation?.roomTypeName || reservation?.roomTypeId?.name || '-' }}
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.mealPlan')
                        }}</span>
                        <span class="text-gray-900 dark:text-white">
                          {{ reservation?.mealPlanName || reservation?.mealPlanId?.name || '-' }}
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.source')
                        }}</span>
                        <span class="text-gray-900 dark:text-white">{{ sourceLabel }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-slate-400">{{
                          t('reservations.detail.createdAt')
                        }}</span>
                        <span class="text-gray-900 dark:text-white">{{
                          formatDateTime(reservation?.createdAt)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dates -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3
                    class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                  >
                    <span class="material-icons text-sm text-indigo-600">event</span>
                    {{ t('reservations.detail.dates') }}
                  </h3>
                  <div class="grid grid-cols-3 gap-4 text-center">
                    <div
                      class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600"
                    >
                      <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                        {{ t('reservations.detail.checkInDate') }}
                      </p>
                      <p class="font-semibold text-gray-900 dark:text-white">
                        {{ formatDate(reservation?.checkIn) }}
                      </p>
                    </div>
                    <div
                      class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600"
                    >
                      <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                        {{ t('reservations.detail.checkOutDate') }}
                      </p>
                      <p class="font-semibold text-gray-900 dark:text-white">
                        {{ formatDate(reservation?.checkOut) }}
                      </p>
                    </div>
                    <div
                      class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600"
                    >
                      <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">
                        {{ t('reservations.detail.nightCount') }}
                      </p>
                      <p class="font-semibold text-gray-900 dark:text-white">
                        {{ reservation?.nights || calculateNights }}
                        {{ t('reservations.detail.nights') }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Special Requests -->
                <div
                  v-if="reservation?.specialRequests"
                  class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4"
                >
                  <h3
                    class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2"
                  >
                    <span class="material-icons text-sm">star</span>
                    {{ t('reservations.detail.specialRequests') }}
                  </h3>
                  <p class="text-sm text-amber-700 dark:text-amber-400">
                    {{ reservation.specialRequests }}
                  </p>
                </div>
              </div>

              <!-- Payments Tab -->
              <div v-if="activeTab === 'payments'" class="space-y-6">
                <!-- Quick Payment -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <h3
                    class="text-sm font-semibold text-green-800 dark:text-green-300 mb-4 flex items-center gap-2"
                  >
                    <span class="material-icons text-sm">payments</span>
                    {{ t('reservations.detail.quickPayment') }}
                  </h3>

                  <!-- Quick Amount Buttons -->
                  <div class="flex flex-wrap gap-2 mb-4">
                    <button
                      v-if="dueAmount > 0"
                      class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                      @click="paymentForm.amount = dueAmount"
                    >
                      {{ t('reservations.detail.payAll') }} ({{ formatCurrency(dueAmount) }})
                    </button>
                    <button
                      v-for="amount in quickAmounts"
                      :key="amount"
                      class="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium border border-gray-300 dark:border-slate-600 transition-colors"
                      @click="paymentForm.amount = amount"
                    >
                      {{ formatCurrency(amount) }}
                    </button>
                  </div>

                  <!-- Payment Form -->
                  <div class="grid grid-cols-4 gap-3">
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1"
                        >{{ t('reservations.detail.amount') }}</label
                      >
                      <input
                        v-model.number="paymentForm.amount"
                        type="number"
                        min="0"
                        step="0.01"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1"
                        >{{ t('reservations.detail.method') }}</label
                      >
                      <select
                        v-model="paymentForm.method"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                      >
                        <option v-for="m in paymentMethods" :key="m.value" :value="m.value">
                          {{ m.label }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label
                        class="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1"
                        >{{ t('reservations.detail.reference') }}</label
                      >
                      <input
                        v-model="paymentForm.reference"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
                        :placeholder="t('common.optional')"
                      />
                    </div>
                    <div class="flex items-end">
                      <button
                        :disabled="!paymentForm.amount || paymentForm.amount <= 0 || saving"
                        class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        @click="addPayment"
                      >
                        <span v-if="saving" class="animate-spin material-icons text-sm">sync</span>
                        <span class="material-icons text-sm" v-else>add</span>
                        {{ t('reservations.detail.addPayment') }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Payments History -->
                <div>
                  <h3
                    class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                  >
                    <span class="material-icons text-sm text-gray-500">history</span>
                    {{ t('reservations.detail.paymentHistory') }}
                  </h3>

                  <div v-if="reservation?.payment?.transactions?.length" class="space-y-2">
                    <div
                      v-for="(tx, index) in reservation.payment.transactions"
                      :key="index"
                      class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-8 h-8 rounded-lg flex items-center justify-center"
                          :class="
                            tx.type === 'refund'
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : 'bg-green-100 dark:bg-green-900/30'
                          "
                        >
                          <span
                            class="material-icons text-sm"
                            :class="
                              tx.type === 'refund'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            "
                          >
                            {{ tx.type === 'refund' ? 'remove' : 'add' }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900 dark:text-white text-sm">
                            {{ getPaymentMethodLabel(tx.method) || tx.type }}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-slate-400">
                            {{ formatDateTime(tx.date) }}
                            <span v-if="tx.reference"> - {{ tx.reference }}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        class="font-semibold"
                        :class="
                          tx.type === 'refund'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-green-600 dark:text-green-400'
                        "
                      >
                        {{ tx.type === 'refund' ? '-' : '+' }}{{ formatCurrency(tx.amount) }}
                      </span>
                    </div>
                  </div>

                  <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
                    <span class="material-icons text-4xl mb-2 opacity-50">payments</span>
                    <p class="text-sm">{{ t('reservations.detail.noPayments') }}</p>
                  </div>
                </div>
              </div>

              <!-- Notes Tab -->
              <div v-if="activeTab === 'notes'" class="space-y-6">
                <!-- Add Note -->
                <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <h3
                    class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"
                  >
                    <span class="material-icons text-sm text-indigo-600">add_comment</span>
                    {{ t('reservations.detail.addNote') }}
                  </h3>
                  <textarea
                    v-model="noteForm.content"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                    :placeholder="t('reservations.detail.addNotePlaceholder')"
                  ></textarea>
                  <button
                    :disabled="!noteForm.content || saving"
                    class="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    @click="addNote"
                  >
                    <span v-if="saving" class="animate-spin material-icons text-sm">sync</span>
                    <span class="material-icons text-sm" v-else>send</span>
                    {{ t('reservations.detail.addNote') }}
                  </button>
                </div>

                <!-- Notes List -->
                <div v-if="reservation?.notes?.length" class="space-y-3">
                  <div
                    v-for="(note, index) in reservation.notes"
                    :key="index"
                    class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <p class="text-sm text-gray-900 dark:text-white">{{ note.content }}</p>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      {{ formatDateTime(note.createdAt) }}
                      <span v-if="note.createdBy"> - {{ note.createdBy }}</span>
                    </p>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
                  <span class="material-icons text-4xl mb-2 opacity-50">notes</span>
                  <p class="text-sm">{{ t('reservations.detail.noNotes') }}</p>
                </div>
              </div>

              <!-- History Tab -->
              <div v-if="activeTab === 'history'" class="space-y-4">
                <div v-if="reservation?.modifications?.length" class="space-y-3">
                  <div
                    v-for="(mod, index) in reservation.modifications"
                    :key="index"
                    class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                  >
                    <div
                      class="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"
                    >
                      <span class="material-icons text-sm text-gray-500 dark:text-slate-400"
                        >history</span
                      >
                    </div>
                    <div>
                      <p class="text-sm text-gray-900 dark:text-white">{{ mod.description }}</p>
                      <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {{ formatDateTime(mod.modifiedAt) }}
                      </p>
                    </div>
                  </div>
                </div>

                <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
                  <span class="material-icons text-4xl mb-2 opacity-50">history</span>
                  <p class="text-sm">{{ t('reservations.detail.noHistory') }}</p>
                </div>
              </div>
            </div>

            <!-- Actions Bar -->
            <div
              class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 rounded-b-2xl border-t border-gray-200 dark:border-slate-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <!-- Confirm -->
                  <button
                    v-if="reservation?.status === 'pending'"
                    class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    @click="confirmReservation"
                  >
                    <span class="material-icons text-sm">check_circle</span>
                    {{ t('reservations.confirm') }}
                  </button>

                  <!-- Check-in -->
                  <button
                    v-if="reservation?.status === 'confirmed' && canCheckIn"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    @click="goToCheckIn"
                  >
                    <span class="material-icons text-sm">login</span>
                    {{ t('reservations.detail.checkIn') }}
                  </button>

                  <!-- No-Show -->
                  <button
                    v-if="['pending', 'confirmed'].includes(reservation?.status)"
                    class="px-4 py-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    @click="markNoShow"
                  >
                    <span class="material-icons text-sm">person_off</span>
                    {{ t('reservations.detail.noShow') }}
                  </button>

                  <!-- Cancel -->
                  <button
                    v-if="['pending', 'confirmed'].includes(reservation?.status)"
                    class="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    @click="$emit('cancel', reservation)"
                  >
                    <span class="material-icons text-sm">cancel</span>
                    {{ t('reservations.cancelAction') }}
                  </button>
                </div>

                <button
                  class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                  @click="close"
                >
                  {{ t('common.close') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
import reservationService, {
  RESERVATION_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  PAYMENT_METHODS,
  BOOKING_SOURCES
} from '@/services/pms/reservationService'

const { t, locale } = useI18n()
const localeMap = { tr: 'tr-TR', en: 'en-US' }

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  reservation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated', 'cancel'])

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('overview')

const paymentMethods = PAYMENT_METHODS
const quickAmounts = [100, 500, 1000, 2000]

const paymentForm = ref({
  amount: null,
  method: 'cash',
  reference: ''
})

const noteForm = ref({
  content: ''
})

const tabs = computed(() => [
  { key: 'overview', label: t('reservations.detail.tabs.overview'), icon: 'info' },
  { key: 'payments', label: t('reservations.detail.tabs.payments'), icon: 'payments' },
  { key: 'notes', label: t('reservations.detail.tabs.notes'), icon: 'notes' },
  { key: 'history', label: t('reservations.detail.tabs.history'), icon: 'history' }
])

// Computed
const getMainGuestName = computed(() => {
  const guest = props.reservation?.leadGuest || props.reservation?.guests?.[0]
  if (guest) {
    return (
      `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || t('reservations.detail.guest')
    )
  }
  return t('reservations.detail.guest')
})

const calculateNights = computed(() => {
  if (!props.reservation?.checkIn || !props.reservation?.checkOut) return 0
  const diff = new Date(props.reservation.checkOut) - new Date(props.reservation.checkIn)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const grandTotal = computed(() => {
  return (
    props.reservation?.pricing?.grandTotal ||
    props.reservation?.pricing?.totalAmount ||
    props.reservation?.totalAmount ||
    0
  )
})

const paidAmount = computed(() => {
  return props.reservation?.payment?.paidAmount || 0
})

const dueAmount = computed(() => {
  // Always calculate to avoid showing stale/corrupted data
  return grandTotal.value - paidAmount.value
})

const statusLabel = computed(() => {
  return RESERVATION_STATUS_INFO[props.reservation?.status]?.label || props.reservation?.status
})

const statusBadgeClasses = computed(() => {
  const status = props.reservation?.status
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-100',
    confirmed: 'bg-green-500/20 text-green-100',
    cancelled: 'bg-red-500/20 text-red-100',
    completed: 'bg-blue-500/20 text-blue-100',
    no_show: 'bg-gray-500/20 text-gray-100'
  }
  return colors[status] || 'bg-white/20 text-white'
})

// Calculate payment status based on computed values (more reliable than API status)
const calculatedPaymentStatus = computed(() => {
  if (paidAmount.value >= grandTotal.value && grandTotal.value > 0) return 'paid'
  if (paidAmount.value > 0) return 'partial'
  return 'pending'
})

const paymentStatusLabel = computed(() => {
  return PAYMENT_STATUS_INFO[calculatedPaymentStatus.value]?.label || 'Bekliyor'
})

const paymentStatusClasses = computed(() => {
  const status = calculatedPaymentStatus.value
  const colors = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    partial: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    refunded: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
  }
  return colors[status] || colors.pending
})

const sourceLabel = computed(() => {
  const source = props.reservation?.source?.type || props.reservation?.salesChannel
  if (source === 'b2b') return props.reservation?.agencyName || 'Acenta'
  if (source === 'direct') return 'Walk-in'
  return BOOKING_SOURCES[source]?.label || 'Online'
})

const canCheckIn = computed(() => {
  if (!props.reservation) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkIn = new Date(props.reservation.checkIn)
  checkIn.setHours(0, 0, 0, 0)
  return checkIn <= today
})

// Methods
const getPaymentMethodLabel = method => {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method
}

const confirmReservation = async () => {
  saving.value = true
  try {
    const response = await reservationService.confirm(props.hotelId, props.reservation._id)
    toast.success(t('reservations.messages.reservationConfirmed'))
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || t('reservations.messages.confirmError'))
  } finally {
    saving.value = false
  }
}

const markNoShow = async () => {
  saving.value = true
  try {
    const response = await reservationService.markNoShow(props.hotelId, props.reservation._id)
    toast.success(t('reservations.messages.markedNoShow'))
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || t('reservations.messages.actionError'))
  } finally {
    saving.value = false
  }
}

const addPayment = async () => {
  if (!paymentForm.value.amount || paymentForm.value.amount <= 0) return

  saving.value = true
  try {
    const response = await reservationService.addPayment(
      props.hotelId,
      props.reservation._id,
      paymentForm.value
    )
    toast.success(
      t('reservations.messages.paymentRecorded', {
        amount: formatCurrency(paymentForm.value.amount)
      })
    )
    paymentForm.value = { amount: null, method: 'cash', reference: '' }
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || t('reservations.messages.paymentError'))
  } finally {
    saving.value = false
  }
}

const addNote = async () => {
  if (!noteForm.value.content) return

  saving.value = true
  try {
    const response = await reservationService.addNote(
      props.hotelId,
      props.reservation._id,
      noteForm.value
    )
    toast.success(t('reservations.messages.noteAdded'))
    noteForm.value = { content: '' }
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || t('reservations.messages.noteError'))
  } finally {
    saving.value = false
  }
}

const goToCheckIn = () => {
  close()
  router.push({ name: 'pms-front-desk', query: { booking: props.reservation._id } })
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleString(localeMap[locale.value] || 'tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = amount => {
  return new Intl.NumberFormat(localeMap[locale.value] || 'tr-TR', {
    style: 'currency',
    currency: props.reservation?.pricing?.currency || 'TRY'
  }).format(amount || 0)
}

const close = () => {
  emit('update:modelValue', false)
  activeTab.value = 'overview'
}

// Watch
watch(
  () => props.modelValue,
  val => {
    if (val) {
      activeTab.value = 'overview'
      paymentForm.value = { amount: null, method: 'cash', reference: '' }
      noteForm.value = { content: '' }
    }
  }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
