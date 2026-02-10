<template>
  <div class="space-y-6">
    <!-- Empty State for New Agencies -->
    <div v-if="!stats.bookings?.total" class="space-y-6">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-12 text-center">
        <div
          class="w-24 h-24 mx-auto bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <span class="material-icons text-5xl text-green-600 dark:text-green-400"
            >waving_hand</span
          >
        </div>
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {{ $t('dashboard.agency.welcome') }}
        </h2>
        <p class="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-8">
          {{ $t('dashboard.agency.welcomeDescription') }}
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <span class="material-icons text-3xl text-blue-600 dark:text-blue-400 mb-2"
              >search</span
            >
            <p class="text-sm font-medium text-gray-800 dark:text-white">
              {{ $t('dashboard.agency.step1') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('dashboard.agency.step1Desc') }}
            </p>
          </div>
          <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <span class="material-icons text-3xl text-purple-600 dark:text-purple-400 mb-2"
              >book_online</span
            >
            <p class="text-sm font-medium text-gray-800 dark:text-white">
              {{ $t('dashboard.agency.step2') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('dashboard.agency.step2Desc') }}
            </p>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <span class="material-icons text-3xl text-green-600 dark:text-green-400 mb-2"
              >trending_up</span
            >
            <p class="text-sm font-medium text-gray-800 dark:text-white">
              {{ $t('dashboard.agency.step3') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('dashboard.agency.step3Desc') }}
            </p>
          </div>
        </div>
        <router-link
          to="/bookings/new"
          class="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
        >
          <span class="material-icons">add</span>
          {{ $t('dashboard.agency.createFirstBooking') }}
        </router-link>
      </div>
    </div>

    <!-- Full Dashboard (when there are bookings) -->
    <template v-else>
      <!-- Commission Summary Banner -->
      <div class="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-medium opacity-90">
              {{ $t('dashboard.agency.monthlyCommission') }}
            </h2>
            <p class="text-4xl font-bold mt-2">
              ₺{{ (stats.commission?.monthly || 0).toLocaleString('tr-TR') }}
            </p>
            <p class="text-sm opacity-75 mt-1">
              {{ $t('dashboard.agency.fromBookings', { count: stats.bookings?.monthly || 0 }) }}
            </p>
          </div>
          <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <span class="material-icons text-4xl">account_balance_wallet</span>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          :title="$t('dashboard.agency.monthlyRevenue')"
          :value="stats.revenue?.monthly || 0"
          icon="payments"
          color="blue"
          format="currency"
        />
        <StatCard
          :title="$t('dashboard.agency.monthlyBookings')"
          :value="stats.bookings?.monthly || 0"
          icon="calendar_month"
          color="purple"
          :sub-label="$t('dashboard.agency.total')"
          :sub-value="stats.bookings?.total || 0"
        />
        <StatCard
          :title="$t('dashboard.agency.pendingBookings')"
          :value="stats.bookings?.pending || 0"
          icon="pending_actions"
          color="orange"
        />
        <StatCard
          :title="$t('dashboard.agency.confirmedBookings')"
          :value="stats.bookings?.confirmed || 0"
          icon="check_circle"
          color="green"
        />
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow">
          <span class="material-icons text-3xl text-purple-600">event_available</span>
          <p class="text-2xl font-bold text-gray-800 dark:text-white mt-2">
            {{ stats.bookings?.weekly || 0 }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('dashboard.agency.weeklyBookings') }}
          </p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow">
          <span class="material-icons text-3xl text-blue-600">people</span>
          <p class="text-2xl font-bold text-gray-800 dark:text-white mt-2">
            {{ stats.users?.total || 0 }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('dashboard.agency.teamMembers') }}
          </p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow">
          <span class="material-icons text-3xl text-green-600">trending_up</span>
          <p class="text-2xl font-bold text-gray-800 dark:text-white mt-2">
            {{
              stats.bookings?.monthly && stats.bookings?.total
                ? Math.round((stats.bookings.monthly / stats.bookings.total) * 100)
                : 0
            }}%
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('dashboard.agency.monthlyGrowth') }}
          </p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 text-center shadow">
          <span class="material-icons text-3xl text-orange-600">hotel</span>
          <p class="text-2xl font-bold text-gray-800 dark:text-white mt-2">
            {{ topHotels?.length || 0 }}
          </p>
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('dashboard.agency.activeHotels') }}
          </p>
        </div>
      </div>

      <!-- Charts and Tables Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Bookings -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <span class="material-icons text-blue-600 mr-2">history</span>
              {{ $t('dashboard.recentBookings') }}
            </h3>
            <router-link
              to="/bookings"
              class="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              {{ $t('dashboard.viewAll') }} →
            </router-link>
          </div>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <div
              v-for="booking in recentBookings"
              :key="booking._id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              @click="$router.push('/bookings/' + booking._id)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-800 dark:text-white">
                    {{ booking.bookingNumber }}
                  </p>
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      getStatusClass(booking.status)
                    ]"
                  >
                    {{ $t('booking.statuses.' + booking.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 dark:text-slate-400 truncate">
                  {{ booking.guest?.name }} • {{ booking.hotel?.name }}
                </p>
                <p class="text-xs text-gray-400 dark:text-slate-500">
                  {{ formatDate(booking.checkIn) }} - {{ formatDate(booking.checkOut) }}
                </p>
              </div>
              <div class="text-right ml-4">
                <p class="font-semibold text-gray-800 dark:text-white">
                  {{ formatPrice(booking.pricing?.grandTotal, booking.pricing?.currency) }}
                </p>
                <p class="text-xs text-green-600 dark:text-green-400">
                  +₺{{ (booking.pricing?.commission || 0).toLocaleString('tr-TR') }}
                </p>
              </div>
            </div>
            <p
              v-if="!recentBookings?.length"
              class="text-center text-gray-500 dark:text-slate-400 py-4"
            >
              {{ $t('dashboard.noRecentBookings') }}
            </p>
          </div>
        </div>

        <!-- Top Hotels -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <span class="material-icons text-orange-600 mr-2">star</span>
            {{ $t('dashboard.agency.favoriteHotels') }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="(hotel, index) in topHotels"
              :key="hotel._id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center">
                <span
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold mr-3',
                    index === 0
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                      : index === 1
                        ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        : index === 2
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                  ]"
                >
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="font-medium text-gray-800 dark:text-white">{{ hotel.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">
                    {{ hotel.count }} {{ $t('dashboard.bookings') }}
                  </p>
                </div>
              </div>
              <p class="font-semibold text-green-600 dark:text-green-400">
                ₺{{ hotel.revenue?.toLocaleString('tr-TR') }}
              </p>
            </div>
            <p v-if="!topHotels?.length" class="text-center text-gray-500 dark:text-slate-400 py-4">
              {{ $t('dashboard.noData') }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import StatCard from './StatCard.vue'

defineProps({
  stats: { type: Object, default: () => ({}) },
  recentBookings: { type: Array, default: () => [] },
  topHotels: { type: Array, default: () => [] },
  dailyTrend: { type: Array, default: () => [] }
})

const getStatusClass = status => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[status] || classes.pending
}

const formatDate = date => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
}

const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>
