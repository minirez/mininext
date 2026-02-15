<template>
  <div class="h-[520px] overflow-y-auto px-6 py-4">
    <div v-if="purchases?.length" class="space-y-2">
      <div
        v-for="purchase in purchases"
        :key="purchase._id"
        class="group flex items-center justify-between p-4 border rounded-xl transition-all duration-200 hover:shadow-sm"
        :class="purchaseCardClass(purchase)"
      >
        <div class="flex items-center gap-4 min-w-0">
          <!-- Ikon -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="purchaseIconClass(purchase)"
          >
            <span class="material-icons text-lg">{{ purchaseIcon(purchase) }}</span>
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getPurchaseName(purchase) }}
              </span>
              <span
                class="badge text-[10px]"
                :class="{
                  'badge-warning': purchase.status === 'pending',
                  'badge-success': purchase.status === 'active',
                  'badge-secondary': purchase.status === 'expired',
                  'badge-danger': purchase.status === 'cancelled'
                }"
              >
                {{ $t(`partners.subscription.purchaseStatus.${purchase.status}`) }}
              </span>
            </div>
            <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {{ formatDate(purchase.period?.startDate) }} -
              {{ formatDate(purchase.period?.endDate) }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Fiyat -->
          <div class="text-right">
            <div class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(purchase.price?.amount, purchase.price?.currency) }}
            </div>
            <div
              v-if="purchase.payment?.date"
              class="text-[10px] text-gray-500 dark:text-slate-400"
            >
              {{ $t(`partners.subscription.methods.${purchase.payment?.method}`) }}
            </div>
            <div v-else class="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
              {{ $t('partners.subscription.awaitingPayment') }}
            </div>
          </div>

          <!-- Aksiyonlar (hover'da gorunur) -->
          <div
            class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              v-if="purchase.status === 'pending'"
              class="text-green-600 hover:text-green-700 p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              :title="$t('partners.subscription.markAsPaid')"
              @click="$emit('mark-paid', purchase)"
            >
              <span class="material-icons text-base">check_circle</span>
            </button>
            <button
              v-if="['pending', 'active'].includes(purchase.status)"
              class="text-gray-600 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              :title="$t('partners.subscription.editPurchase')"
              @click="$emit('edit', purchase)"
            >
              <span class="material-icons text-base">edit</span>
            </button>
            <button
              v-if="getInvoice(purchase._id)"
              class="text-blue-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              :title="$t('partners.subscription.downloadInvoice')"
              @click="$emit('download-invoice', getInvoice(purchase._id))"
            >
              <span class="material-icons text-base">receipt</span>
            </button>
            <button
              v-if="['pending', 'active'].includes(purchase.status)"
              class="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              :title="$t('partners.subscription.cancelPurchase')"
              @click="$emit('cancel', purchase._id)"
            >
              <span class="material-icons text-base">cancel</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bos durum -->
    <div
      v-else
      class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500"
    >
      <span class="material-icons text-5xl mb-3">receipt_long</span>
      <span class="text-sm">{{ $t('partners.subscription.noPurchases') }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  purchases: { type: Array, default: () => [] },
  invoices: { type: Array, default: () => [] }
})

defineEmits(['mark-paid', 'edit', 'download-invoice', 'cancel'])

function getPurchaseName(purchase) {
  if (purchase.plan) {
    // Will be resolved by parent via i18n
    return purchase.planDisplayName || purchase.plan
  }
  if (purchase.lineItems?.length > 0) {
    return purchase.lineItems.map(li => li.name).join(' + ')
  }
  return purchase.purchaseType || '-'
}

function getInvoice(purchaseId) {
  const purchase = props.purchases?.find(p => p._id === purchaseId)
  if (purchase?.invoice) {
    return typeof purchase.invoice === 'object' ? purchase.invoice : { _id: purchase.invoice }
  }
  return props.invoices.find(inv => inv.purchase?.toString() === purchaseId)
}

function purchaseCardClass(purchase) {
  switch (purchase.status) {
    case 'pending':
      return 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
    case 'active':
      return 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50'
    case 'expired':
      return 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700'
    case 'cancelled':
      return 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
    default:
      return 'border-gray-200 dark:border-slate-700'
  }
}

function purchaseIconClass(purchase) {
  switch (purchase.status) {
    case 'pending':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
    case 'active':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    case 'expired':
      return 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
    case 'cancelled':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    default:
      return 'bg-gray-100 dark:bg-slate-700 text-gray-500'
  }
}

function purchaseIcon(purchase) {
  switch (purchase.status) {
    case 'pending':
      return 'hourglass_empty'
    case 'active':
      return 'check_circle'
    case 'expired':
      return 'schedule'
    case 'cancelled':
      return 'cancel'
    default:
      return 'receipt'
  }
}
</script>
