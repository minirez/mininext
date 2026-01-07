<template>
  <div class="h-full flex flex-col">
    <!-- Navigation -->
    <ModuleNavigation :items="navItems" color="purple" />

    <div class="flex-1 overflow-y-auto py-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          v-for="stat in statCards"
          :key="stat.key"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 cursor-pointer transition-all hover:shadow-md"
          :class="{ 'ring-2 ring-purple-500': filters.status === stat.filterValue }"
          @click="setStatusFilter(stat.filterValue)"
        >
          <div class="flex items-center">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              :class="stat.bgClass"
            >
              <span class="material-icons" :class="stat.iconClass">{{ stat.icon }}</span>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Actions Bar -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >search</span
              >
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('booking.searchPlaceholder')"
                class="form-input w-full pl-10"
                @input="debouncedSearch"
              />
            </div>
          </div>

          <!-- Status Tabs -->
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              :class="
                filters.status === tab.value
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              "
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
                :class="
                  filters.status === tab.value
                    ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-slate-400'
                "
              >
                {{ tab.count }}
              </span>
            </button>
          </div>

          <!-- Date Filter -->
          <select v-model="filters.dateRange" class="form-input w-auto" @change="applyFilters">
            <option value="">{{ $t('booking.allDates') }}</option>
            <option value="today">{{ $t('booking.today') }}</option>
            <option value="week">{{ $t('booking.thisWeek') }}</option>
            <option value="month">{{ $t('booking.thisMonth') }}</option>
            <option value="upcoming">{{ $t('booking.upcoming') }}</option>
            <option value="past">{{ $t('booking.past') }}</option>
          </select>
        </div>
      </div>

      <!-- Bookings DataTable -->
      <DataTable
        :data="bookings"
        :columns="columns"
        :loading="isLoading"
        :total="totalItems"
        :page="currentPage"
        :per-page="perPage"
        :show-header="false"
        responsive
        :card-title-key="'bookingNumber'"
        :empty-icon="'event_busy'"
        :empty-text="filters.status ? $t('booking.noBookingsForStatus') : $t('booking.noBookingsDescription')"
        @page-change="handlePageChange"
      >
        <!-- Empty State Action -->
        <template #empty-action>
          <router-link to="/bookings/new" class="mt-4 btn-primary inline-flex items-center">
            <span class="material-icons mr-2">add</span>
            {{ $t('booking.createFirstBooking') }}
          </router-link>
        </template>

        <!-- Booking Number Cell -->
        <template #cell-bookingNumber="{ row }">
          <div class="flex items-center">
            <span
              class="material-icons mr-2 text-sm"
              :class="row.status === 'draft' ? 'text-purple-500' : 'text-gray-400'"
            >
              {{ row.status === 'draft' ? 'edit_note' : 'confirmation_number' }}
            </span>
            <div>
              <div class="flex items-center">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ row.bookingNumber }}
                </span>
                <!-- Amendment indicator with popover -->
                <div
                  v-if="row.modifications?.length > 0"
                  class="relative group/amend ml-1.5"
                >
                  <span class="inline-flex items-center cursor-pointer">
                    <span class="material-icons text-sm text-amber-500">edit_note</span>
                  </span>
                  <!-- Popover -->
                  <div
                    class="absolute left-0 top-full mt-1 z-50 hidden group-hover/amend:block"
                  >
                    <div
                      class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-3 min-w-[280px]"
                    >
                      <div
                        class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center"
                      >
                        <span class="material-icons text-amber-500 text-sm mr-1">history</span>
                        {{ $t('booking.amendmentHistory') }} ({{ row.modifications.length }})
                      </div>
                      <div
                        v-for="(mod, modIdx) in row.modifications.slice().reverse()"
                        :key="modIdx"
                        class="py-2"
                        :class="{ 'border-t border-gray-100 dark:border-slate-700': modIdx > 0 }"
                      >
                        <div class="flex items-start justify-between gap-2">
                          <p class="text-sm text-gray-700 dark:text-slate-300 flex-1">
                            {{ mod.description || $t('booking.amendment.noDescription') }}
                          </p>
                        </div>
                        <p class="text-xs text-gray-400 dark:text-slate-500 mt-1 flex items-center">
                          <span class="material-icons text-xs mr-1">schedule</span>
                          {{ formatDateTime(mod.modifiedAt) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Status Badge -->
              <div class="mt-1 flex items-center gap-1.5">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusClass(row.status)"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-1"
                    :class="getStatusDotClass(row.status)"
                  ></span>
                  {{ getBookingStatusLabel(row.status) }}
                </span>
                <!-- Sales Channel Badge -->
                <span
                  v-if="row.salesChannel || row.searchCriteria?.channel"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                  :class="getSalesChannelClass(row)"
                >
                  {{ getSalesChannelLabel(row) }}
                </span>
                <!-- Expiry warning for drafts -->
                <span
                  v-if="row.status === 'draft' && row.expiresAt"
                  class="text-xs text-orange-500"
                >
                  {{ formatDaysUntil(row.expiresAt) }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- Hotel Cell -->
        <template #cell-hotelName="{ row }">
          <div class="max-w-[200px]">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.hotelName || '-' }}
            </p>
            <p v-if="row.hotelCode" class="text-xs text-gray-500 dark:text-slate-400">
              {{ row.hotelCode }}
            </p>
          </div>
        </template>

        <!-- Guest Cell -->
        <template #cell-leadGuest="{ row }">
          <div v-if="row.leadGuest" class="max-w-[160px]">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.leadGuest.firstName }} {{ row.leadGuest.lastName }}
            </p>
            <div v-if="row.leadGuest.nationality" class="flex items-center gap-1 mt-0.5">
              <span class="text-sm">{{ getCountryFlag(row.leadGuest.nationality) }}</span>
              <span class="text-xs text-gray-500 dark:text-slate-400">{{
                getCountryName(row.leadGuest.nationality)
              }}</span>
            </div>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">
            {{ $t('booking.noGuestInfo') }}
          </span>
        </template>

        <!-- Dates Cell -->
        <template #cell-checkIn="{ row }">
          <div v-if="row.checkIn" class="flex items-center">
            <div class="text-sm">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ formatDate(row.checkIn) }}
              </p>
              <p class="text-gray-500 dark:text-slate-400 flex items-center">
                <span class="material-icons text-xs mr-1">arrow_right_alt</span>
                {{ formatDate(row.checkOut) }}
                <span class="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                  ({{ row.nights }} {{ $t('booking.night') }})
                </span>
              </p>
            </div>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Rooms Cell -->
        <template #cell-rooms="{ row }">
          <!-- Rooms with popover -->
          <div v-if="row.rooms?.length" class="relative group">
            <!-- Trigger: badges -->
            <div class="flex items-center gap-1 cursor-pointer">
              <span
                class="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
              >
                {{ row.rooms[0].roomTypeCode }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                {{ row.rooms[0].mealPlanCode }}
              </span>
              <span
                v-if="row.rooms[0].rateType === 'non_refundable'"
                class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
              >
                NR
              </span>
              <span
                v-if="row.rooms.length > 1"
                class="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded"
              >
                +{{ row.rooms.length - 1 }}
              </span>
            </div>
            <!-- Popover -->
            <div class="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
              <div
                class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 p-3 min-w-[280px]"
              >
                <div
                  class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2"
                >
                  {{ $t('booking.roomDetails') }}
                </div>
                <div
                  v-for="(room, roomIdx) in row.rooms"
                  :key="roomIdx"
                  class="py-2"
                  :class="{ 'border-t border-gray-100 dark:border-slate-700': roomIdx > 0 }"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1">
                      <div class="font-medium text-gray-900 dark:text-white text-sm">
                        {{ getLocalizedName(room.roomTypeName) }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {{ getLocalizedName(room.mealPlanName) }}
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                      <span class="flex items-center" :title="$t('booking.adults')">
                        <span class="material-icons text-sm mr-0.5">person</span>
                        {{ getRoomAdults(room) }}
                      </span>
                      <span
                        v-if="getRoomChildren(room) > 0"
                        class="flex items-center"
                        :title="$t('booking.children')"
                      >
                        <span class="material-icons text-sm mr-0.5">child_care</span>
                        {{ getRoomChildren(room) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 mt-1.5">
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300"
                    >
                      {{ room.roomTypeCode }}
                    </span>
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300"
                    >
                      {{ room.mealPlanCode }}
                    </span>
                    <span
                      v-if="room.rateType === 'non_refundable'"
                      class="px-1.5 py-0.5 text-[10px] font-medium bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >
                      {{ $t('booking.nonRefundableRate') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- No rooms -->
          <div v-else class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400">
            <span class="material-icons text-base">king_bed</span>
            {{ row.totalRooms || '-' }}
          </div>
        </template>

        <!-- Market & Season Cell -->
        <template #cell-market="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-if="row.market"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-default"
              :title="getLocalizedName(row.market.name)"
            >
              {{ row.market.code }}
            </span>
            <span
              v-if="row.season"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-default"
              :style="{
                backgroundColor: row.season.color ? `${row.season.color}20` : '#fef3c7',
                color: row.season.color || '#d97706'
              }"
              :title="getLocalizedName(row.season.name)"
            >
              {{ row.season.code }}
            </span>
            <span v-if="!row.market && !row.season" class="text-gray-400 dark:text-slate-500 text-sm"
              >-</span
            >
          </div>
        </template>

        <!-- Price Cell -->
        <template #cell-pricing="{ row }">
          <div v-if="row.pricing?.grandTotal">
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatPrice(row.pricing.grandTotal, row.pricing.currency) }}
            </span>
            <p
              v-if="row.pricing?.totalCost"
              class="text-xs text-gray-500 dark:text-slate-400 mt-0.5"
            >
              {{ $t('booking.cost') }}:
              {{ formatPrice(row.pricing.totalCost, row.pricing.currency) }}
            </p>
          </div>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Paid Amount Cell -->
        <template #cell-payment="{ row }">
          <button
            v-if="row.pricing?.grandTotal"
            class="group flex flex-col items-start hover:bg-gray-50 dark:hover:bg-slate-700/50 -m-2 p-2 rounded-lg transition-colors"
            @click.stop="openPaymentModal(row)"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ formatPrice(row.payment?.paidAmount || 0, row.pricing.currency) }}
              </span>
              <span class="text-gray-400 dark:text-slate-500">/</span>
              <span class="text-gray-500 dark:text-slate-400 text-sm">
                {{ formatPrice(row.pricing.grandTotal, row.pricing.currency) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <PaymentStatusBadge :status="row.payment?.status || 'pending'" />
              <span
                class="material-icons text-xs text-gray-400 group-hover:text-purple-500 transition-colors"
                >open_in_new</span
              >
            </div>
          </button>
          <span v-else class="text-gray-400 dark:text-slate-500 italic text-sm">-</span>
        </template>

        <!-- Row Actions -->
        <template #row-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <!-- Continue Draft Button -->
            <button
              v-if="row.status === 'draft'"
              class="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              @click.stop="continueDraft(row)"
            >
              <span class="material-icons text-sm mr-1">play_arrow</span>
              {{ $t('booking.continueBooking') }}
            </button>

            <!-- View Button -->
            <button
              v-else
              class="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              @click.stop="viewBooking(row)"
            >
              <span class="material-icons text-sm mr-1">visibility</span>
              {{ $t('common.view') }}
            </button>

            <!-- Amend Button -->
            <button
              v-if="canAmend(row)"
              class="inline-flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors"
              @click.stop="openAmendment(row)"
            >
              <span class="material-icons text-sm mr-1">edit</span>
              {{ $t('booking.amend') }}
            </button>

            <!-- More Actions Menu -->
            <ActionMenu
              v-if="row.status !== 'draft'"
              :items="getActionMenuItems(row)"
              @select="handleActionSelect($event, row)"
            />

            <!-- Delete Draft -->
            <button
              v-if="row.status === 'draft'"
              class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              :title="$t('common.delete')"
              @click.stop="deleteDraft(row)"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Delete Draft Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('booking.deleteDraft')">
      <div class="py-4">
        <p class="text-gray-600 dark:text-slate-400">
          {{ $t('booking.deleteDraftConfirm') }}
        </p>
        <p class="mt-2 font-medium text-gray-900 dark:text-white">
          {{ selectedBooking?.bookingNumber }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showDeleteModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-danger px-4 py-2" @click="confirmDeleteDraft">
            {{ $t('common.delete') }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Hard Delete Booking Modal (Superadmin Only) -->
    <Modal v-model="showHardDeleteModal" :title="$t('booking.deleteBookingTitle')">
      <div class="py-4">
        <div class="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
          <span class="material-icons text-red-500 text-2xl">warning</span>
          <div>
            <p class="font-medium text-red-700 dark:text-red-400">
              {{ $t('booking.deleteWarning') }}
            </p>
            <p class="text-sm text-red-600 dark:text-red-500 mt-1">
              {{ $t('booking.deleteWarningDescription') }}
            </p>
          </div>
        </div>
        <p class="text-gray-600 dark:text-slate-400">
          {{ $t('booking.deleteBookingConfirm') }}
        </p>
        <p class="mt-2 font-medium text-gray-900 dark:text-white">
          {{ bookingToDelete?.bookingNumber }}
        </p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn-secondary px-4 py-2" @click="showHardDeleteModal = false; bookingToDelete = null">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn-danger px-4 py-2" @click="confirmHardDelete">
            <span class="material-icons text-sm mr-1">delete_forever</span>
            {{ $t('booking.deletePermanently') }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Booking Amendment Modal -->
    <BookingAmendmentModal
      v-if="showAmendmentModal"
      :show="true"
      :booking-id="selectedBookingForAmendment?._id"
      @close="showAmendmentModal = false; selectedBookingForAmendment = null"
      @updated="handleAmendmentComplete"
    />

    <!-- Payment Modal -->
    <PaymentModal
      v-if="showPaymentModal"
      v-model="showPaymentModal"
      :booking="selectedBookingForPayment"
      @close="showPaymentModal = false; selectedBookingForPayment = null"
      @updated="handlePaymentUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useAuthStore } from '@/stores/auth'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { useDateFiltering } from '@/composables/useDateFiltering'
import { formatPrice, formatDateTime, formatDaysUntil, getCountryFlag } from '@/utils/formatters'
import { DEFAULT_PAGE_SIZE, BOOKING_STATUSES } from '@/constants'
import bookingService from '@/services/bookingService'
import ModuleNavigation from '@/components/common/ModuleNavigation.vue'
import Modal from '@/components/common/Modal.vue'
import DataTable from '@/components/ui/data/DataTable.vue'
import ActionMenu from '@/components/ui/buttons/ActionMenu.vue'
import BookingAmendmentModal from '@/components/booking/amendment/BookingAmendmentModal.vue'
import PaymentModal from '@/components/booking/payment/PaymentModal.vue'
import PaymentStatusBadge from '@/components/booking/payment/PaymentStatusBadge.vue'

const { locale, t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

// Check if user is superadmin (platform admin)
const isSuperAdmin = computed(() => authStore.isPlatformAdmin)

// Status helpers
const { getStatusClass, getStatusDotClass, getBookingStatusLabel } = useStatusHelpers()

// Navigation items
const navItems = computed(() => [
  {
    name: 'bookings',
    to: '/bookings',
    icon: 'event_note',
    label: t('booking.bookings'),
    matchPattern: '^/bookings(/[a-f0-9]+)?$'
  },
  {
    name: 'new-booking',
    to: '/bookings/new',
    icon: 'add',
    label: t('booking.newBooking'),
    exact: true
  }
])

// DataTable columns
const columns = computed(() => [
  { key: 'bookingNumber', label: t('booking.bookingNumber'), sortable: true },
  { key: 'hotelName', label: t('booking.hotel'), sortable: true },
  { key: 'leadGuest', label: t('booking.guest'), sortable: false },
  { key: 'checkIn', label: t('booking.dates'), sortable: true },
  { key: 'rooms', label: t('booking.rooms'), sortable: false },
  { key: 'market', label: t('booking.marketSeason'), sortable: false },
  { key: 'pricing', label: t('booking.totalPrice'), sortable: true },
  { key: 'payment', label: t('payment.paidAmount'), sortable: false }
])

// Async action composables
const { isLoading, execute: executeLoad } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { execute: executeStats } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })
const { execute: executeAction } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

// State
const bookings = ref([])
const stats = ref({})
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const perPage = DEFAULT_PAGE_SIZE
const openMenuId = ref(null)
const showDeleteModal = ref(false)
const selectedBooking = ref(null)
const showHardDeleteModal = ref(false)
const bookingToDelete = ref(null)
const showAmendmentModal = ref(false)
const selectedBookingForAmendment = ref(null)
const showPaymentModal = ref(false)
const selectedBookingForPayment = ref(null)

// Filters
const filters = ref({
  search: '',
  status: '',
  dateRange: ''
})

// Status tabs
const statusTabs = computed(() => [
  { value: '', label: t('common.all'), count: stats.value.total || 0 },
  { value: 'draft', label: t('booking.status.draft'), count: stats.value.draft || 0 },
  { value: 'pending', label: t('booking.status.pending'), count: stats.value.pending || 0 },
  { value: 'confirmed', label: t('booking.status.confirmed'), count: stats.value.confirmed || 0 },
  { value: 'completed', label: t('booking.status.completed'), count: stats.value.completed || 0 },
  { value: 'cancelled', label: t('booking.status.cancelled'), count: stats.value.cancelled || 0 }
])

// Stat cards
const statCards = computed(() => [
  {
    key: 'total',
    value: stats.value.total || 0,
    label: t('booking.stats.totalBookings'),
    icon: 'calendar_today',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    iconClass: 'text-purple-500',
    filterValue: ''
  },
  {
    key: 'draft',
    value: stats.value.draft || 0,
    label: t('booking.stats.drafts'),
    icon: 'edit_note',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    iconClass: 'text-blue-500',
    filterValue: 'draft'
  },
  {
    key: 'pending',
    value: stats.value.pending || 0,
    label: t('booking.stats.pending'),
    icon: 'schedule',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconClass: 'text-yellow-500',
    filterValue: 'pending'
  },
  {
    key: 'confirmed',
    value: stats.value.confirmed || 0,
    label: t('booking.stats.confirmed'),
    icon: 'check_circle',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    iconClass: 'text-green-500',
    filterValue: 'confirmed'
  },
  {
    key: 'revenue',
    value: formatPrice(stats.value.revenue, 'TRY'),
    label: t('booking.stats.totalRevenue'),
    icon: 'payments',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconClass: 'text-emerald-500',
    filterValue: null
  }
])

// Debounce timer
let searchTimer = null

// Partner context
usePartnerContext({
  onPartnerChange: () => {
    currentPage.value = 1
    fetchBookings()
    fetchStats()
  },
  immediate: true
})

// Click outside to close menu
const handleClickOutside = e => {
  if (openMenuId.value && !e.target.closest('.relative')) {
    openMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchBookings()
  fetchStats()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Fetch bookings
const fetchBookings = async () => {
  const params = {
    page: currentPage.value,
    limit: perPage,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }

  if (filters.value.search) {
    params.search = filters.value.search
  }
  if (filters.value.status) {
    params.status = filters.value.status
  }
  if (filters.value.dateRange) {
    applyDateFilter(params)
  }

  await executeLoad(
    () => bookingService.getBookings(params),
    {
      onSuccess: response => {
        if (response.success) {
          bookings.value = response.data
          totalPages.value = response.pagination?.totalPages || 1
          totalItems.value = response.pagination?.total || 0
        }
      },
      onError: error => {
        console.error('Failed to fetch bookings:', error)
      }
    }
  )
}

// Apply date filter
const applyDateFilter = params => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filters.value.dateRange) {
    case 'today':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
      break
    case 'week':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      break
    case 'month':
      params.checkInFrom = today.toISOString()
      params.checkInTo = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      ).toISOString()
      break
    case 'upcoming':
      params.checkInFrom = today.toISOString()
      break
    case 'past':
      params.checkInTo = today.toISOString()
      break
  }
}

// Fetch stats
const fetchStats = async () => {
  await executeStats(
    () => bookingService.getBookingStats(),
    {
      onSuccess: response => {
        if (response.success) {
          stats.value = response.data
        }
      },
      onError: error => {
        console.error('Failed to fetch stats:', error)
      }
    }
  )
}

// Debounced search
const debouncedSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    fetchBookings()
  }, 300)
}

// Set status filter
const setStatusFilter = status => {
  if (status === null) return // For revenue card
  filters.value.status = status
  applyFilters()
}

// Apply filters
const applyFilters = () => {
  currentPage.value = 1
  fetchBookings()
}

// Handle DataTable page change
const handlePageChange = ({ page }) => {
  currentPage.value = page
  fetchBookings()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Toggle action menu
const toggleMenu = id => {
  openMenuId.value = openMenuId.value === id ? null : id
}


// View booking
const viewBooking = booking => {
  router.push(`/bookings/${booking._id}`)
}

// Continue draft
const continueDraft = booking => {
  router.push(`/bookings/draft/${booking.bookingNumber}`)
}

// Delete draft
const deleteDraft = booking => {
  selectedBooking.value = booking
  showDeleteModal.value = true
}

// Confirm delete draft
const confirmDeleteDraft = async () => {
  if (!selectedBooking.value) return

  await executeAction(
    () => bookingService.deleteDraft(selectedBooking.value.bookingNumber),
    {
      onSuccess: () => {
        showDeleteModal.value = false
        selectedBooking.value = null
        fetchBookings()
        fetchStats()
      },
      onError: error => {
        console.error('Failed to delete draft:', error)
      }
    }
  )
}

// Confirm booking
const confirmBooking = async booking => {
  openMenuId.value = null
  await executeAction(
    () => bookingService.updateBookingStatus(booking._id, 'confirmed'),
    {
      onSuccess: () => {
        fetchBookings()
        fetchStats()
      },
      onError: error => {
        console.error('Failed to confirm booking:', error)
      }
    }
  )
}

// Cancel booking
const cancelBooking = booking => {
  openMenuId.value = null
  router.push(`/bookings/${booking._id}?action=cancel`)
}

// Print booking
const printBooking = booking => {
  openMenuId.value = null
  window.open(`/bookings/${booking._id}/print`, '_blank')
}

// Can confirm
const canConfirm = booking => {
  return booking.status === 'pending'
}

// Can cancel
const canCancel = booking => {
  return ['pending', 'confirmed'].includes(booking.status)
}

// Can amend (modify booking)
const canAmend = booking => {
  return ['pending', 'confirmed', 'checked_in'].includes(booking.status)
}

// Open amendment modal
const openAmendment = booking => {
  selectedBookingForAmendment.value = booking
  showAmendmentModal.value = true
}

// Handle amendment complete
const handleAmendmentComplete = () => {
  showAmendmentModal.value = false
  selectedBookingForAmendment.value = null
  fetchBookings()
  fetchStats()
}

// Open payment modal
const openPaymentModal = booking => {
  selectedBookingForPayment.value = booking
  showPaymentModal.value = true
}

// Handle payment updated
const handlePaymentUpdated = () => {
  fetchBookings()
  fetchStats()
}

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format date
const formatDate = date => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Country names map
const countryNames = {
  TR: 'Türkiye',
  US: 'ABD',
  GB: 'İngiltere',
  DE: 'Almanya',
  FR: 'Fransa',
  IT: 'İtalya',
  ES: 'İspanya',
  NL: 'Hollanda',
  RU: 'Rusya',
  UA: 'Ukrayna',
  PL: 'Polonya',
  CZ: 'Çekya',
  AT: 'Avusturya',
  CH: 'İsviçre',
  BE: 'Belçika',
  GR: 'Yunanistan',
  PT: 'Portekiz',
  SE: 'İsveç',
  NO: 'Norveç',
  DK: 'Danimarka',
  FI: 'Finlandiya',
  IE: 'İrlanda',
  SA: 'Suudi Arabistan',
  AE: 'BAE',
  KW: 'Kuveyt',
  QA: 'Katar',
  EG: 'Mısır',
  IL: 'İsrail',
  IR: 'İran',
  IQ: 'Irak',
  JP: 'Japonya',
  CN: 'Çin',
  KR: 'Güney Kore',
  AU: 'Avustralya',
  NZ: 'Yeni Zelanda',
  CA: 'Kanada',
  BR: 'Brezilya',
  MX: 'Meksika',
  AR: 'Arjantin',
  IN: 'Hindistan',
  PK: 'Pakistan',
  ID: 'Endonezya',
  MY: 'Malezya',
  TH: 'Tayland',
  VN: 'Vietnam',
  SG: 'Singapur',
  PH: 'Filipinler',
  ZA: 'Güney Afrika',
  NG: 'Nijerya',
  KE: 'Kenya',
  MA: 'Fas',
  TN: 'Tunus',
  DZ: 'Cezayir',
  RO: 'Romanya',
  BG: 'Bulgaristan',
  HU: 'Macaristan',
  SK: 'Slovakya',
  SI: 'Slovenya',
  HR: 'Hırvatistan',
  RS: 'Sırbistan',
  BA: 'Bosna Hersek',
  AL: 'Arnavutluk',
  MK: 'Kuzey Makedonya',
  XK: 'Kosova',
  ME: 'Karadağ',
  AZ: 'Azerbaycan',
  GE: 'Gürcistan',
  AM: 'Ermenistan',
  KZ: 'Kazakistan',
  UZ: 'Özbekistan',
  TM: 'Türkmenistan',
  KG: 'Kırgızistan',
  TJ: 'Tacikistan',
  BY: 'Belarus',
  MD: 'Moldova',
  LT: 'Litvanya',
  LV: 'Letonya',
  EE: 'Estonya',
  CY: 'Kıbrıs'
}

// Get country name from ISO code
const getCountryName = countryCode => {
  if (!countryCode) return ''
  return countryNames[countryCode.toUpperCase()] || countryCode.toUpperCase()
}

// Get room adults count
const getRoomAdults = room => {
  if (room.guests) {
    return room.guests.filter(g => g.type === 'adult').length || 1
  }
  return 2 // Default
}

// Get room children count
const getRoomChildren = room => {
  if (room.guests) {
    return room.guests.filter(g => g.type === 'child' || g.type === 'infant').length
  }
  return 0
}

// Get sales channel from booking (salesChannel field or searchCriteria.channel)
const getSalesChannel = booking => {
  if (booking.salesChannel) return booking.salesChannel.toLowerCase()
  if (booking.searchCriteria?.channel) return booking.searchCriteria.channel.toLowerCase()
  return null
}

// Get sales channel label
const getSalesChannelLabel = booking => {
  const channel = getSalesChannel(booking)
  return channel === 'b2b' ? 'B2B' : 'B2C'
}

// Get sales channel badge class
const getSalesChannelClass = booking => {
  const channel = getSalesChannel(booking)
  if (channel === 'b2b') {
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  }
  return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
}

// Get action menu items for a booking row
const getActionMenuItems = row => {
  const items = []

  if (canConfirm(row)) {
    items.push({
      key: 'confirm',
      label: t('booking.confirmBooking'),
      icon: 'check_circle'
    })
  }

  if (canCancel(row)) {
    items.push({
      key: 'cancel',
      label: t('booking.cancelBooking'),
      icon: 'cancel',
      danger: true
    })
  }

  items.push({
    key: 'print',
    label: t('booking.printBooking'),
    icon: 'print'
  })

  // Only superadmin can hard delete bookings
  if (isSuperAdmin.value) {
    items.push({ divider: true })
    items.push({
      key: 'delete',
      label: t('booking.deleteBooking'),
      icon: 'delete_forever',
      danger: true
    })
  }

  return items
}

// Handle action menu selection
const handleActionSelect = (item, row) => {
  switch (item.key) {
    case 'confirm':
      confirmBooking(row)
      break
    case 'cancel':
      cancelBooking(row)
      break
    case 'print':
      printBooking(row)
      break
    case 'delete':
      bookingToDelete.value = row
      showHardDeleteModal.value = true
      break
  }
}

// Hard delete booking (superadmin only)
const confirmHardDelete = async () => {
  if (!bookingToDelete.value) return

  await executeAction(
    () => bookingService.deleteBooking(bookingToDelete.value._id),
    {
      onSuccess: () => {
        showHardDeleteModal.value = false
        bookingToDelete.value = null
        fetchBookings()
        fetchStats()
      },
      onError: error => {
        console.error('Failed to delete booking:', error)
      }
    }
  )
}

</script>
