<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ $t('mySubscription.title') }}
        </h1>
        <p class="text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('mySubscription.description') }}
        </p>
      </div>
      <button
        class="btn-secondary flex items-center gap-2 text-sm"
        :disabled="loading"
        @click="loadAll"
      >
        <span class="material-icons text-base" :class="{ 'animate-spin': loading }">refresh</span>
        {{ $t('common.refresh') }}
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading && !subscription" class="space-y-6">
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 animate-pulse"
      >
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-xl bg-gray-200 dark:bg-slate-700"></div>
          <div class="space-y-2 flex-1">
            <div class="h-6 bg-gray-200 dark:bg-slate-700 rounded w-48"></div>
            <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 animate-pulse"
        >
          <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-3"></div>
          <div class="h-8 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <template v-if="!loading || subscription">
      <!-- Current Plan Status + Quick Stats Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Plan Status Card (2/3 width) -->
        <div class="lg:col-span-2 rounded-2xl border p-6 md:p-8" :class="statusHeroClass">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <!-- Plan Info -->
            <div class="flex items-start gap-4">
              <div
                class="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                :style="{
                  backgroundColor: planColor + '20'
                }"
              >
                <span class="material-icons text-2xl md:text-3xl" :style="{ color: planColor }">
                  {{ planIcon }}
                </span>
              </div>
              <div>
                <div class="flex items-center gap-3 flex-wrap">
                  <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {{ planName }}
                  </h2>
                  <span
                    class="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase"
                    :class="statusBadgeClass"
                  >
                    {{ $t(`mySubscription.status.${subscription?.status || 'trial'}`) }}
                  </span>
                </div>
                <p
                  v-if="subscription?.statusLabel"
                  class="text-gray-500 dark:text-slate-400 text-sm mt-1"
                >
                  {{ subscription.statusLabel }}
                </p>
                <!-- Period Info -->
                <div
                  v-if="subscription?.startDate"
                  class="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-slate-300"
                >
                  <div class="flex items-center gap-1.5">
                    <span class="material-icons text-sm opacity-50">calendar_today</span>
                    {{ formatDate(subscription.startDate) }} —
                    {{ formatDate(subscription.endDate) }}
                  </div>
                  <div v-if="subscription?.remainingDays > 0" class="flex items-center gap-1.5">
                    <span class="material-icons text-sm opacity-50">schedule</span>
                    <span
                      :class="
                        subscription.remainingDays < 30
                          ? 'text-orange-600 dark:text-orange-400 font-semibold'
                          : ''
                      "
                    >
                      {{ subscription.remainingDays }} {{ $t('common.days') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap gap-2 sm:flex-col flex-shrink-0">
              <button
                v-if="['expired', 'cancelled', 'suspended'].includes(subscription?.status)"
                class="btn-primary flex items-center gap-2 text-sm"
                @click="scrollToPackages"
              >
                <span class="material-icons text-base">rocket_launch</span>
                {{ $t('mySubscription.selectPlan') }}
              </button>
              <button
                v-else-if="subscription?.status === 'trial'"
                class="btn-primary flex items-center gap-2 text-sm"
                @click="scrollToPackages"
              >
                <span class="material-icons text-base">upgrade</span>
                {{ $t('mySubscription.upgrade') }}
              </button>
              <button
                v-else-if="subscription?.status === 'grace_period'"
                class="btn-primary flex items-center gap-2 text-sm !bg-amber-600 hover:!bg-amber-700"
                @click="scrollToPackages"
              >
                <span class="material-icons text-base">payment</span>
                {{ $t('mySubscription.renew') }}
              </button>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="subscription?.startDate && subscription?.endDate" class="mt-5">
            <div
              class="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 mb-1.5"
            >
              <span>{{ formatDate(subscription.startDate) }}</span>
              <span>{{ formatDate(subscription.endDate) }}</span>
            </div>
            <div class="w-full bg-gray-200/50 dark:bg-slate-700/50 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-700 ease-out"
                :class="progressBarClass"
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Quick Stats Sidebar (1/3 width) -->
        <div class="flex flex-col gap-4">
          <!-- Active Services Count -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex-1"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-indigo-500 text-lg">extension</span>
              <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400">
                {{ $t('mySubscription.includedServices') }}
              </h3>
            </div>
            <div class="flex items-end gap-1.5">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ membership.services?.length || 0 }}
              </span>
              <span class="text-sm text-gray-400 dark:text-slate-500 mb-0.5">
                {{ $t('mySubscription.includedServices').toLowerCase() }}
              </span>
            </div>
            <div v-if="membership.services?.length" class="mt-3 space-y-1">
              <div
                v-for="svc in membership.services.slice(0, 3)"
                :key="svc._id"
                class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5 truncate"
              >
                <span class="material-icons text-green-500 text-xs">check</span>
                {{ svc.name?.tr || svc.name?.en }}
              </div>
              <div
                v-if="membership.services.length > 3"
                class="text-xs text-indigo-500 dark:text-indigo-400 font-medium"
              >
                +{{ membership.services.length - 3 }} more
              </div>
            </div>
          </div>

          <!-- Purchase Stats -->
          <div
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 flex-1"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="material-icons text-purple-500 text-lg">receipt_long</span>
              <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400">
                {{ $t('mySubscription.purchaseHistory') }}
              </h3>
            </div>
            <div class="flex items-end gap-1.5">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ subscription?.purchases?.length || 0 }}
              </span>
              <span class="text-sm text-gray-400 dark:text-slate-500 mb-0.5">{{
                $t('common.total')
              }}</span>
            </div>
            <div v-if="pendingPurchasesCount > 0" class="mt-2">
              <span
                class="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full"
              >
                {{ pendingPurchasesCount }}
                {{ $t('mySubscription.purchaseStatus.pending').toLowerCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Trial Banner -->
      <div
        v-if="subscription?.status === 'trial' && subscription?.trial"
        class="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0"
          >
            <span class="material-icons text-blue-600 dark:text-blue-400">timer</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-blue-900 dark:text-blue-200">
              {{ $t('mySubscription.trialActive') }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {{ $t('mySubscription.trialRemainingDays', { days: subscription.remainingDays }) }}
            </p>
          </div>
          <button
            class="btn-primary text-sm !bg-blue-600 hover:!bg-blue-700 flex-shrink-0"
            @click="scrollToPackages"
          >
            {{ $t('mySubscription.upgrade') }}
          </button>
        </div>
      </div>

      <!-- Grace Period Warning -->
      <div
        v-if="subscription?.status === 'grace_period'"
        class="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5"
      >
        <div class="flex items-start gap-4">
          <div
            class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0"
          >
            <span class="material-icons text-amber-600 dark:text-amber-400">warning</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-amber-900 dark:text-amber-200">
              {{ $t('mySubscription.gracePeriodWarning') }}
            </p>
            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {{
                $t('mySubscription.gracePeriodDays', {
                  days: subscription.gracePeriodRemainingDays
                })
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- Usage Stats (only show when data available) -->
      <div
        v-if="subscription?.pmsStatus || subscription?.webDesignStatus"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <!-- PMS Usage -->
        <div
          v-if="subscription?.pmsStatus"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2"
            >
              <span class="material-icons text-blue-500 text-lg">apartment</span>
              PMS
            </h3>
            <span
              class="text-xs font-medium px-2.5 py-1 rounded-full"
              :class="
                subscription.pmsStatus?.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{ subscription.pmsStatus?.enabled ? $t('common.active') : $t('common.inactive') }}
            </span>
          </div>
          <template v-if="subscription.pmsStatus?.enabled">
            <div class="flex items-end gap-1 mb-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ subscription.pmsStatus.used ?? 0 }}
              </span>
              <span class="text-gray-400 dark:text-slate-500 text-sm mb-0.5">
                / {{ subscription.pmsStatus.maxHotelsDisplay }}
              </span>
            </div>
            <div class="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all"
                :class="
                  pmsUsagePercent >= 90
                    ? 'bg-red-500'
                    : pmsUsagePercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                "
                :style="{ width: Math.min(100, pmsUsagePercent) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
              {{ $t('mySubscription.hotelsUsed') }}
            </p>
          </template>
        </div>

        <!-- Web Design -->
        <div
          v-if="subscription?.webDesignStatus"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <h3
              class="text-sm font-medium text-gray-500 dark:text-slate-400 flex items-center gap-2"
            >
              <span class="material-icons text-purple-500 text-lg">language</span>
              Web Design
            </h3>
            <span
              class="text-xs font-medium px-2.5 py-1 rounded-full"
              :class="
                subscription.webDesignStatus?.enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
              "
            >
              {{
                subscription.webDesignStatus?.enabled ? $t('common.active') : $t('common.inactive')
              }}
            </span>
          </div>
          <div v-if="subscription.webDesignStatus?.enabled" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 dark:text-slate-400">{{
                $t('mySubscription.maxSites')
              }}</span>
              <span class="font-medium text-gray-900 dark:text-white">
                {{ subscription.webDesignStatus.maxSitesDisplay }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Services -->
      <div
        v-if="membership.services?.length"
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6"
      >
        <h3
          class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"
        >
          <span class="material-icons text-green-500">verified</span>
          {{ $t('mySubscription.includedServices') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="svc in membership.services"
            :key="svc._id"
            class="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-transparent dark:from-slate-700/30 dark:to-transparent border border-gray-100 dark:border-slate-700/50"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="
                svc.source === 'individual'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-blue-100 dark:bg-blue-900/30'
              "
            >
              <span
                class="material-icons text-sm"
                :class="svc.source === 'individual' ? 'text-purple-500' : 'text-blue-500'"
              >
                {{ svc.icon || 'check_circle' }}
              </span>
            </div>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                {{ svc.name?.tr || svc.name?.en }}
              </div>
              <div
                class="text-[11px] font-medium"
                :class="
                  svc.source === 'individual'
                    ? 'text-purple-500 dark:text-purple-400'
                    : 'text-blue-500 dark:text-blue-400'
                "
              >
                {{
                  svc.source === 'individual'
                    ? $t('mySubscription.addon')
                    : $t('mySubscription.currentPlan')
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ PACKAGES CATALOG ============ -->
      <div ref="packagesSection" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="material-icons text-purple-500">inventory_2</span>
            {{ $t('mySubscription.availablePackages') }}
          </h3>
        </div>

        <div v-if="loadingCatalog" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 animate-pulse"
          >
            <div class="h-10 bg-gray-200 dark:bg-slate-700 rounded w-10 mb-4"></div>
            <div class="h-5 bg-gray-200 dark:bg-slate-700 rounded w-32 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
            <div class="space-y-2 mb-4">
              <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-36"></div>
              <div class="h-3 bg-gray-200 dark:bg-slate-700 rounded w-28"></div>
            </div>
            <div class="h-10 bg-gray-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>

        <div
          v-else-if="catalog.packages?.length"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <div
            v-for="pkg in catalog.packages"
            :key="pkg._id"
            class="relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300 overflow-hidden group"
            :class="
              isCurrentPackage(pkg._id)
                ? 'border-green-400 dark:border-green-600 shadow-lg shadow-green-500/10'
                : 'border-gray-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5'
            "
          >
            <!-- Current Plan Indicator -->
            <div
              v-if="isCurrentPackage(pkg._id)"
              class="bg-green-500 text-white text-center py-1.5 text-xs font-bold tracking-wider uppercase"
            >
              {{ $t('mySubscription.currentPlan') }}
            </div>
            <!-- Badge -->
            <div
              v-else-if="pkg.badge"
              class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-1.5 text-xs font-bold tracking-wider uppercase"
            >
              {{ pkg.badge }}
            </div>

            <div class="p-6 flex-1 flex flex-col">
              <!-- Icon + Name -->
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  :style="{ backgroundColor: (pkg.color || '#6366f1') + '15' }"
                >
                  <span class="material-icons text-2xl" :style="{ color: pkg.color || '#6366f1' }">
                    {{ pkg.icon || 'inventory_2' }}
                  </span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-900 dark:text-white text-lg">
                    {{ pkg.name?.tr || pkg.name?.en }}
                  </h4>
                </div>
              </div>

              <!-- Description -->
              <p
                v-if="pkg.description?.tr || pkg.description?.en"
                class="text-sm text-gray-500 dark:text-slate-400 mb-4 line-clamp-2"
              >
                {{ pkg.description?.tr || pkg.description?.en }}
              </p>

              <!-- Included Services -->
              <div v-if="pkg.services?.length" class="space-y-2 mb-4 flex-1">
                <div
                  v-for="svc in pkg.services"
                  :key="svc._id"
                  class="flex items-center gap-2.5 text-sm"
                >
                  <span class="material-icons text-green-500 text-base flex-shrink-0"
                    >check_circle</span
                  >
                  <span class="text-gray-700 dark:text-slate-300">
                    {{ svc.name?.tr || svc.name?.en }}
                  </span>
                </div>
              </div>

              <!-- Trial Info -->
              <div
                v-if="pkg.trial?.enabled && pkg.trial?.days"
                class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 mb-4"
              >
                <span class="material-icons text-sm">timer</span>
                <span class="font-medium"
                  >{{ pkg.trial.days }} {{ $t('mySubscription.trialDays') }}</span
                >
              </div>

              <!-- Price + CTA -->
              <div class="border-t border-gray-100 dark:border-slate-700 pt-4 mt-auto">
                <div class="flex items-end justify-between mb-4">
                  <div>
                    <div
                      v-for="price in pkg.pricing?.prices"
                      :key="price.currency"
                      class="flex items-baseline gap-1"
                    >
                      <span class="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {{ formatCurrency(price.amount, price.currency) }}
                      </span>
                      <span class="text-sm text-gray-400 dark:text-slate-500 font-medium">
                        / {{ $t(`mySubscription.intervals.${pkg.pricing?.interval || 'yearly'}`) }}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  v-if="!isCurrentPackage(pkg._id)"
                  class="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  :class="
                    pkg.badge
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                  "
                  :disabled="purchasing"
                  @click="handlePurchasePackage(pkg)"
                >
                  <span class="material-icons text-base">shopping_cart</span>
                  {{ $t('mySubscription.purchase') }}
                </button>
                <div
                  v-else
                  class="w-full py-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-semibold text-sm text-center flex items-center justify-center gap-2"
                >
                  <span class="material-icons text-base">check_circle</span>
                  {{ $t('common.active') }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="!loadingCatalog"
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
        >
          <span class="material-icons text-5xl text-gray-300 dark:text-slate-600 mb-3"
            >inventory_2</span
          >
          <p class="text-gray-400 dark:text-slate-500">{{ $t('common.noData') }}</p>
        </div>
      </div>

      <!-- ============ ADD-ON SERVICES ============ -->
      <div v-if="availableAddons.length > 0" class="space-y-4">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="material-icons text-indigo-500">extension</span>
          {{ $t('mySubscription.addonServices') }}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="svc in availableAddons"
            :key="svc._id"
            class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-200 group"
          >
            <div class="flex items-start gap-3 mb-4">
              <div
                class="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              >
                <span class="material-icons text-indigo-500">{{ svc.icon || 'extension' }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-gray-900 dark:text-white">
                  {{ svc.name?.tr || svc.name?.en }}
                </div>
                <p
                  v-if="svc.description?.tr || svc.description?.en"
                  class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2"
                >
                  {{ svc.description?.tr || svc.description?.en }}
                </p>
              </div>
            </div>
            <div
              class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700"
            >
              <div v-if="svc.pricing?.prices?.length">
                <span
                  v-for="price in svc.pricing.prices.slice(0, 1)"
                  :key="price.currency"
                  class="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {{ formatCurrency(price.amount, price.currency) }}
                  <span class="text-xs font-normal text-gray-400">
                    / {{ $t(`mySubscription.intervals.${svc.pricing?.interval || 'yearly'}`) }}
                  </span>
                </span>
              </div>
              <button
                class="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-1.5"
                :disabled="purchasing"
                @click="handlePurchaseService(svc)"
              >
                <span class="material-icons text-sm">add_circle</span>
                {{ $t('mySubscription.purchase') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ PURCHASE HISTORY ============ -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
        >
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="material-icons text-gray-400">receipt_long</span>
            {{ $t('mySubscription.purchaseHistory') }}
          </h3>
          <span
            v-if="subscription?.purchases?.length"
            class="text-xs text-gray-400 dark:text-slate-500"
          >
            {{ subscription.purchases.length }} {{ $t('common.total') }}
          </span>
        </div>
        <div
          v-if="subscription?.purchases?.length"
          class="divide-y divide-gray-100 dark:divide-slate-700/50"
        >
          <div
            v-for="p in subscription.purchases"
            :key="p._id"
            class="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="
                p.type === 'package_subscription'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : 'bg-indigo-100 dark:bg-indigo-900/30'
              "
            >
              <span
                class="material-icons text-sm"
                :class="p.type === 'package_subscription' ? 'text-purple-500' : 'text-indigo-500'"
              >
                {{ p.type === 'package_subscription' ? 'inventory_2' : 'extension' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ p.label?.tr || p.label?.en || '-' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {{ formatDate(p.period?.startDate) }} – {{ formatDate(p.period?.endDate) }}
                <span v-if="p.price?.amount" class="font-medium">
                  · {{ formatCurrency(p.price.amount, p.price.currency) }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <span
                class="text-xs font-medium px-2.5 py-1 rounded-full"
                :class="purchaseStatusColors[p.status]"
              >
                {{ $t(`mySubscription.purchaseStatus.${p.status}`) }}
              </span>
              <button
                v-if="p.status === 'pending'"
                class="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors flex items-center gap-1"
                @click="openPayForPurchase(p)"
              >
                <span class="material-icons text-sm">payment</span>
                {{ $t('mySubscription.payNow') }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="px-6 py-12 text-center">
          <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2"
            >receipt_long</span
          >
          <p class="text-sm text-gray-400 dark:text-slate-500">
            {{ $t('mySubscription.noPurchases') }}
          </p>
        </div>
      </div>

      <!-- ============ INVOICES ============ -->
      <div
        class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
      >
        <div
          class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
        >
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="material-icons text-gray-400">description</span>
            {{ $t('mySubscription.invoices') }}
          </h3>
          <span v-if="invoices.length" class="text-xs text-gray-400 dark:text-slate-500">
            {{ invoices.length }} {{ $t('common.total') }}
          </span>
        </div>
        <div v-if="invoices.length" class="divide-y divide-gray-100 dark:divide-slate-700/50">
          <div
            v-for="inv in invoices"
            :key="inv._id"
            class="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors"
          >
            <div
              class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"
            >
              <span class="material-icons text-gray-400 dark:text-slate-500">description</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ inv.invoiceNumber }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {{ formatDate(inv.invoiceDate) }}
                · {{ formatCurrency(inv.total, inv.currency || 'EUR') }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="inv.status"
                class="text-xs font-medium px-2.5 py-1 rounded-full"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    inv.status === 'paid',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    inv.status === 'issued' || inv.status === 'draft',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    inv.status === 'cancelled'
                }"
              >
                {{ $t(`mySubscription.invoiceStatuses.${inv.status}`) }}
              </span>
              <button
                class="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                :title="$t('mySubscription.downloadInvoice')"
                @click="downloadInvoice(inv._id, inv.invoiceNumber)"
              >
                <span class="material-icons text-lg">download</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else class="px-6 py-12 text-center">
          <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-2"
            >description</span
          >
          <p class="text-sm text-gray-400 dark:text-slate-500">
            {{ $t('mySubscription.noInvoices') }}
          </p>
        </div>
      </div>

      <!-- Support CTA -->
      <div
        class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-100 dark:border-purple-800/50 text-center"
      >
        <span class="material-icons text-5xl text-purple-400 mb-3">support_agent</span>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('mySubscription.needHelp') }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
          {{ $t('mySubscription.contactSupport') }}
        </p>
      </div>
    </template>

    <!-- ============ CARD PAYMENT MODAL ============ -->
    <Modal v-model="showCardForm" :title="$t('mySubscription.cardDetails')" size="md">
      <div class="space-y-5">
        <!-- Selected Item Summary -->
        <div
          v-if="selectedItem || pendingPurchaseItem"
          class="bg-gray-50 dark:bg-slate-700/30 rounded-xl p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: (selectedItem?.color || '#6366f1') + '15' }"
            >
              <span class="material-icons" :style="{ color: selectedItem?.color || '#6366f1' }">
                {{
                  selectedItem?.icon || pendingPurchaseItem?.type === 'package_subscription'
                    ? 'inventory_2'
                    : 'extension'
                }}
              </span>
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900 dark:text-white text-sm">
                {{
                  selectedItem?.name?.tr ||
                  selectedItem?.name?.en ||
                  pendingPurchaseItem?.label?.tr ||
                  pendingPurchaseItem?.label?.en
                }}
              </div>
              <div class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('mySubscription.selectedItem') }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(paymentAmount, 'EUR') }}
              </div>
              <div v-if="selectedItem?.pricing" class="text-xs text-gray-500">
                / {{ $t(`mySubscription.intervals.${selectedItem.pricing?.interval || 'yearly'}`) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Card Form -->
        <form @submit.prevent="submitCardForm" class="space-y-4">
          <div>
            <label class="form-label">{{ $t('mySubscription.cardHolder') }}</label>
            <div class="relative">
              <span
                class="material-icons text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                >person</span
              >
              <input
                v-model="cardForm.holder"
                type="text"
                required
                class="form-input pl-10"
                :placeholder="$t('mySubscription.cardHolderPlaceholder')"
              />
            </div>
          </div>
          <div>
            <label class="form-label">{{ $t('mySubscription.cardNumber') }}</label>
            <div class="relative">
              <span
                class="material-icons text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-lg"
                >credit_card</span
              >
              <input
                v-model="cardForm.number"
                type="text"
                maxlength="19"
                required
                class="form-input pl-10 font-mono tracking-wider"
                :placeholder="$t('mySubscription.cardNumberPlaceholder')"
                @input="formatCardNumber"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">{{ $t('mySubscription.expiry') }}</label>
              <input
                v-model="cardForm.expiry"
                type="text"
                placeholder="MM/YY"
                maxlength="5"
                required
                class="form-input"
                @input="formatExpiry"
              />
            </div>
            <div>
              <label class="form-label">CVV</label>
              <input
                v-model="cardForm.cvv"
                type="password"
                maxlength="4"
                required
                class="form-input"
                placeholder="***"
              />
            </div>
          </div>
        </form>

        <!-- Secure Payment Notice -->
        <div
          class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/30 rounded-lg p-3"
        >
          <span class="material-icons text-green-500 text-base">lock</span>
          {{ $t('mySubscription.securePaymentInfo') }}
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCardForm = false">
          {{ $t('common.cancel') }}
        </button>
        <button
          class="btn-primary flex items-center gap-2"
          :disabled="
            payingCard || !cardForm.holder || !cardForm.number || !cardForm.expiry || !cardForm.cvv
          "
          @click="submitCardForm"
        >
          <span v-if="payingCard" class="material-icons animate-spin text-base">refresh</span>
          <span v-else class="material-icons text-base">payment</span>
          {{ payingCard ? $t('mySubscription.processing') : $t('mySubscription.pay') }}
          {{ !payingCard && paymentAmount ? formatCurrency(paymentAmount, 'EUR') : '' }}
        </button>
      </template>
    </Modal>

    <!-- 3D Secure Modal -->
    <Teleport to="body">
      <div
        v-if="show3DSecure"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <div
          class="relative w-full max-w-xl h-[600px] bg-white rounded-2xl overflow-hidden shadow-2xl"
        >
          <div
            class="absolute top-0 left-0 right-0 bg-white dark:bg-slate-800 px-4 py-3 flex items-center justify-between border-b z-10"
          >
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span class="material-icons text-green-500 text-base">lock</span>
              {{ $t('mySubscription.securePayment') }}
            </div>
            <button
              class="text-gray-400 hover:text-gray-600 transition-colors"
              @click="show3DSecure = false"
            >
              <span class="material-icons">close</span>
            </button>
          </div>
          <iframe :src="secureUrl" class="w-full h-full border-0 pt-12"></iframe>
        </div>
      </div>
    </Teleport>

    <!-- Success Modal -->
    <Modal v-model="showSuccess" :title="$t('mySubscription.paymentSuccess')" size="sm">
      <div class="text-center py-6">
        <div
          class="w-20 h-20 mx-auto rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-5 animate-bounce-in"
        >
          <span class="material-icons text-4xl text-green-500">celebration</span>
        </div>
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {{ $t('mySubscription.paymentSuccess') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ $t('mySubscription.paymentSuccessDescription') }}
        </p>
      </div>
      <template #footer>
        <button class="btn-primary w-full" @click="handleSuccessClose">
          {{ $t('common.close') }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import partnerService from '@/services/partnerService'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const toast = useToast()

const loading = ref(true)
const subscription = ref(null)
const membership = ref({})
const invoices = ref([])
const purchasing = ref(false)

const loadingCatalog = ref(false)
const catalog = ref({ packages: [], services: [] })

const showCardForm = ref(false)
const payingCard = ref(false)
const cardForm = ref({ holder: '', number: '', expiry: '', cvv: '' })
const pendingPurchaseId = ref(null)
const pendingPurchaseItem = ref(null)
const selectedPurchaseType = ref(null)
const selectedItem = ref(null)

const show3DSecure = ref(false)
const secureUrl = ref('')
const showSuccess = ref(false)

const packagesSection = ref(null)

const purchaseStatusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
}

const planColor = computed(() => membership.value.package?.color || '#6366f1')
const planIcon = computed(() => membership.value.package?.icon || 'workspace_premium')
const planName = computed(() => {
  if (membership.value.package) {
    return membership.value.package.name?.tr || membership.value.package.name?.en
  }
  if (subscription.value?.currentPurchase) {
    return (
      subscription.value.currentPurchase.label?.tr ||
      subscription.value.currentPurchase.label?.en ||
      t('mySubscription.subscription')
    )
  }
  if (subscription.value?.status === 'trial') return t('mySubscription.trialPeriod')
  return t('mySubscription.noActivePlan')
})

const statusHeroClass = computed(() => {
  const s = subscription.value?.status
  if (s === 'active') return 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800/50'
  if (s === 'trial') return 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800/50'
  if (s === 'grace_period')
    return 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800/50'
  if (s === 'expired' || s === 'suspended')
    return 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800/50'
  return 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
})

const statusBadgeClass = computed(() => {
  const s = subscription.value?.status
  if (s === 'active') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (s === 'trial') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (s === 'grace_period')
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  if (s === 'expired' || s === 'suspended')
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-400'
})

const progressBarClass = computed(() => {
  const s = subscription.value?.status
  if (s === 'active') return 'bg-gradient-to-r from-green-400 to-emerald-500'
  if (s === 'trial') return 'bg-gradient-to-r from-blue-400 to-indigo-500'
  if (s === 'grace_period') return 'bg-gradient-to-r from-amber-400 to-orange-500'
  return 'bg-gradient-to-r from-purple-400 to-indigo-500'
})

const progressPercent = computed(() => {
  if (!subscription.value?.startDate || !subscription.value?.endDate) return 0
  const start = new Date(subscription.value.startDate).getTime()
  const end = new Date(subscription.value.endDate).getTime()
  const now = Date.now()
  const total = end - start
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
})

const pmsUsagePercent = computed(() => {
  const pms = subscription.value?.pmsStatus
  if (!pms?.enabled || !pms?.maxHotels || pms.maxHotels === -1) return 0
  return ((pms.used || 0) / pms.maxHotels) * 100
})

const activeServiceSlugs = computed(() => {
  return (membership.value.services || []).map(s => s.slug).filter(Boolean)
})

const availableAddons = computed(() => {
  return (catalog.value.services || []).filter(svc => !activeServiceSlugs.value.includes(svc.slug))
})

const pendingPurchasesCount = computed(() => {
  return (subscription.value?.purchases || []).filter(p => p.status === 'pending').length
})

const paymentAmount = computed(() => {
  if (pendingPurchaseItem.value) return pendingPurchaseItem.value.price?.amount || 0
  if (!selectedItem.value) return 0
  const prices = selectedItem.value.pricing?.prices || []
  return prices[0]?.amount || selectedItem.value.price || 0
})

const isCurrentPackage = id => membership.value.package?._id === id

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (amount, currency = 'EUR') => {
  if (amount == null) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount)
}

const formatCardNumber = e => {
  let val = e.target.value.replace(/\D/g, '').substring(0, 16)
  val = val.replace(/(\d{4})(?=\d)/g, '$1 ')
  cardForm.value.number = val
}

const formatExpiry = e => {
  let val = e.target.value.replace(/\D/g, '').substring(0, 4)
  if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2)
  cardForm.value.expiry = val
}

const scrollToPackages = () => {
  packagesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleSuccessClose = () => {
  showSuccess.value = false
  loadAll()
}

const loadAll = async () => {
  loading.value = true
  try {
    const [subRes, memRes, catRes, invRes] = await Promise.allSettled([
      partnerService.getMySubscription(),
      partnerService.getMyMembership(),
      partnerService.getMembershipCatalog(),
      partnerService.getMyInvoices()
    ])

    if (subRes.status === 'fulfilled') subscription.value = subRes.value.data
    if (memRes.status === 'fulfilled') membership.value = memRes.value.data || {}
    if (catRes.status === 'fulfilled')
      catalog.value = catRes.value.data || { packages: [], services: [] }
    if (invRes.status === 'fulfilled') invoices.value = invRes.value.data?.invoices || []
  } catch {
    toast.error(t('mySubscription.loadError'))
  } finally {
    loading.value = false
  }
}

const handlePurchasePackage = pkg => {
  selectedPurchaseType.value = 'package_subscription'
  selectedItem.value = pkg
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = null
  pendingPurchaseItem.value = null
  showCardForm.value = true
}

const handlePurchaseService = svc => {
  selectedPurchaseType.value = 'service_purchase'
  selectedItem.value = svc
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = null
  pendingPurchaseItem.value = null
  showCardForm.value = true
}

const openPayForPurchase = purchase => {
  cardForm.value = { holder: '', number: '', expiry: '', cvv: '' }
  pendingPurchaseId.value = purchase._id
  pendingPurchaseItem.value = purchase
  selectedPurchaseType.value = null
  selectedItem.value = null
  showCardForm.value = true
}

const submitCardForm = async () => {
  payingCard.value = true
  try {
    let res
    if (pendingPurchaseId.value) {
      res = await partnerService.payPendingPurchase(pendingPurchaseId.value, {
        card: {
          holder: cardForm.value.holder,
          number: cardForm.value.number.replace(/\s/g, ''),
          expiry: cardForm.value.expiry,
          cvv: cardForm.value.cvv
        },
        installment: 1
      })
    } else {
      const payload = {
        type: selectedPurchaseType.value,
        card: {
          holder: cardForm.value.holder,
          number: cardForm.value.number.replace(/\s/g, ''),
          expiry: cardForm.value.expiry,
          cvv: cardForm.value.cvv
        },
        installment: 1
      }
      if (selectedPurchaseType.value === 'package_subscription') {
        payload.packageId = selectedItem.value._id
      } else {
        payload.serviceId = selectedItem.value._id
      }
      res = await partnerService.initiatePurchase(payload)
    }

    if (res.data?.formUrl) {
      showCardForm.value = false
      secureUrl.value = res.data.formUrl
      show3DSecure.value = true
    } else {
      showCardForm.value = false
      showSuccess.value = true
    }
  } catch (err) {
    toast.error(err.response?.data?.error || t('mySubscription.paymentFailed'))
  } finally {
    payingCard.value = false
  }
}

const downloadInvoice = async (id, invoiceNumber) => {
  try {
    const response = await partnerService.downloadMyInvoicePdf(id)
    const blob = new Blob([response], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${invoiceNumber || 'invoice'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error(t('common.error'))
  }
}

const handle3DSecureMessage = event => {
  if (event.data?.type === 'payment-callback') {
    show3DSecure.value = false
    if (event.data.success) {
      showSuccess.value = true
    } else {
      toast.error(event.data.message || t('mySubscription.paymentFailed'))
    }
    loadAll()
  }
}

onMounted(async () => {
  window.addEventListener('message', handle3DSecureMessage)
  await loadAll()
})

onUnmounted(() => {
  window.removeEventListener('message', handle3DSecureMessage)
})
</script>
