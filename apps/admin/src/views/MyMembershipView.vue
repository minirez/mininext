<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      {{ $t('membership.myMembership.title') }}
    </h1>

    <div v-if="loading" class="flex justify-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"
      ></div>
    </div>

    <div v-else>
      <!-- Current Package & Period -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Current Package Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
            {{ $t('membership.myMembership.currentPackage') }}
          </h3>
          <div v-if="membership.package" class="flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center"
              :style="{ backgroundColor: (membership.package.color || '#6366f1') + '20' }"
            >
              <span
                class="material-icons text-xl"
                :style="{ color: membership.package.color || '#6366f1' }"
                >{{ membership.package.icon || 'inventory_2' }}</span
              >
            </div>
            <div>
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                {{ membership.package.name?.tr }}
              </div>
              <span class="badge badge-success">{{
                $t(`membership.statuses.${membership.status}`)
              }}</span>
            </div>
          </div>
          <div v-else class="text-gray-400 dark:text-slate-500">
            <span class="material-icons text-3xl mb-1">inventory_2</span>
            <p class="text-sm">{{ $t('membership.myMembership.noPackage') }}</p>
          </div>
        </div>

        <!-- Subscription Period Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
            {{ $t('membership.myMembership.subscriptionPeriod') }}
          </h3>
          <div v-if="membership.startDate">
            <div class="text-sm text-gray-600 dark:text-slate-300 mb-2">
              {{ formatDate(membership.startDate) }} — {{ formatDate(membership.endDate) }}
            </div>
            <div v-if="membership.remainingDays > 0" class="mt-2">
              <div class="flex items-center justify-between text-sm mb-1">
                <span class="text-gray-500 dark:text-slate-400">{{
                  $t('membership.myMembership.remainingDays')
                }}</span>
                <span
                  class="font-bold"
                  :class="membership.remainingDays < 30 ? 'text-orange-500' : 'text-green-500'"
                >
                  {{ membership.remainingDays }}
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  class="bg-purple-600 h-2 rounded-full transition-all"
                  :style="{ width: progressPercent + '%' }"
                ></div>
              </div>
            </div>
            <div v-else class="text-red-500 font-medium text-sm mt-2">
              {{ $t('membership.myMembership.expired') }}
            </div>
          </div>
          <div v-else class="text-gray-400 text-sm">-</div>
        </div>

        <!-- Usage Card -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
        >
          <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">
            {{ $t('membership.myMembership.usage') }}
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-slate-300">PMS</span>
              <span class="text-sm font-medium">
                {{ membership.usage?.pmsHotels || 0 }} /
                {{ membership.usage?.pmsLimit === -1 ? '∞' : membership.usage?.pmsLimit || 0 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Included Services -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('membership.myMembership.includedServices') }}
        </h3>
        <div
          v-if="membership.services?.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div
            v-for="svc in membership.services"
            :key="svc._id"
            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50"
          >
            <div
              class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-purple-500">{{ svc.icon || 'cube' }}</span>
            </div>
            <div>
              <div class="font-medium text-sm text-gray-900 dark:text-white">
                {{ svc.name?.tr }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t(`membership.categories.${svc.category}`) }}
                <span v-if="svc.source === 'individual'" class="text-purple-500 ml-1"
                  >({{ $t('membership.assignments.purchaseTypes.service') }})</span
                >
              </div>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-400 dark:text-slate-500 text-sm">{{ $t('common.noData') }}</p>
      </div>

      <!-- Available Packages (Catalog) -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 mb-6"
      >
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ $t('membership.myMembership.availablePackages') }}
        </h3>
        <div
          v-if="catalog.packages?.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="pkg in catalog.packages"
            :key="pkg._id"
            class="border border-gray-200 dark:border-slate-700 rounded-xl p-4 relative"
            :class="{ 'ring-2 ring-purple-500': membership.package?._id === pkg._id }"
          >
            <div
              v-if="pkg.badge"
              class="absolute -top-2 right-3 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full"
            >
              {{ pkg.badge }}
            </div>
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: (pkg.color || '#6366f1') + '20' }"
              >
                <span class="material-icons" :style="{ color: pkg.color || '#6366f1' }">{{
                  pkg.icon || 'inventory_2'
                }}</span>
              </div>
              <div>
                <div class="font-bold text-gray-900 dark:text-white">{{ pkg.name?.tr }}</div>
                <div v-if="pkg.description?.tr" class="text-xs text-gray-500 dark:text-slate-400">
                  {{ pkg.description.tr }}
                </div>
              </div>
            </div>
            <!-- Services list -->
            <div class="space-y-1 mb-3">
              <div
                v-for="svc in pkg.services"
                :key="svc._id"
                class="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300"
              >
                <span class="material-icons text-green-500 text-sm">check</span>
                {{ svc.name?.tr }}
              </div>
            </div>
            <!-- Price -->
            <div
              class="border-t border-gray-200 dark:border-slate-700 pt-3 flex items-center justify-between"
            >
              <div>
                <div
                  v-for="price in pkg.pricing?.prices"
                  :key="price.currency"
                  class="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(price.amount, price.currency) }}
                  <span class="text-xs font-normal text-gray-500"
                    >/ {{ $t(`membership.intervals.${pkg.pricing?.interval}`) }}</span
                  >
                </div>
              </div>
              <button
                v-if="membership.package?._id !== pkg._id"
                class="btn-primary text-sm"
                @click="handlePurchasePackage(pkg._id)"
                :disabled="purchasing"
              >
                {{ $t('membership.myMembership.purchase') }}
              </button>
              <span v-else class="text-sm text-green-600 dark:text-green-400 font-medium">
                <span class="material-icons text-sm align-middle">check_circle</span>
                {{ $t('membership.statuses.active') }}
              </span>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-400 text-sm">{{ $t('common.noData') }}</p>
      </div>

      <!-- Purchase History -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ $t('membership.myMembership.purchaseHistory') }}
          </h3>
        </div>
        <div v-if="membership.purchases?.length">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
                >
                  {{ $t('common.type') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
                >
                  {{ $t('membership.assignments.period') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
                >
                  {{ $t('membership.assignments.price') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
                >
                  {{ $t('membership.assignments.status') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
              <tr
                v-for="p in membership.purchases"
                :key="p._id"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <td class="px-4 py-3 text-sm">{{ p.planName || p.plan || '-' }}</td>
                <td class="px-4 py-3 text-sm">
                  {{ formatDate(p.period?.startDate) }} - {{ formatDate(p.period?.endDate) }}
                </td>
                <td class="px-4 py-3 text-sm font-medium">
                  {{ formatCurrency(p.price?.amount, p.price?.currency) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="badge"
                    :class="{
                      'badge-warning': p.status === 'pending',
                      'badge-success': p.status === 'active',
                      'badge-secondary': p.status === 'expired',
                      'badge-danger': p.status === 'cancelled'
                    }"
                  >
                    {{ $t(`membership.statuses.${p.status}`) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-8 text-center text-gray-400 dark:text-slate-500">
          {{ $t('common.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const purchasing = ref(false)
const membership = ref({})
const catalog = ref({ packages: [], services: [] })

const progressPercent = computed(() => {
  if (!membership.value.startDate || !membership.value.endDate) return 0
  const start = new Date(membership.value.startDate).getTime()
  const end = new Date(membership.value.endDate).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatCurrency = (amount, currency = 'TRY') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [membershipRes, catalogRes] = await Promise.all([
      api.get('/api/my/membership').then(r => r.data),
      api.get('/api/my/membership/catalog').then(r => r.data)
    ])
    membership.value = membershipRes.data || {}
    catalog.value = catalogRes.data || { packages: [], services: [] }
  } catch (error) {
    console.error('Failed to load membership:', error)
    toast.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

const handlePurchasePackage = async packageId => {
  if (!confirm(t('common.confirmAction'))) return
  purchasing.value = true
  try {
    await api.post('/api/my/membership/purchase', {
      type: 'package',
      packageId
    })
    toast.success(t('common.success'))
    await fetchData()
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.error'))
  } finally {
    purchasing.value = false
  }
}

onMounted(fetchData)
</script>
