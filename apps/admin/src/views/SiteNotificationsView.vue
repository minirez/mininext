<template>
  <div class="space-y-6">
    <!-- Section Tabs -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex space-x-4 px-6" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300',
              'flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors'
            ]"
          >
            <span class="material-icons mr-2 text-lg">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Email Settings Section -->
    <div v-show="activeTab === 'email'" class="space-y-6">
      <!-- Email Provider Selection -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {{ $t('siteSettings.notifications.email.title') }}
        </h3>
        <div class="space-y-4">
          <!-- Platform Email Option -->
          <label
            class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
            :class="!emailForm.useOwnSES
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="radio"
              v-model="emailForm.useOwnSES"
              :value="false"
              class="mt-1 text-purple-600 focus:ring-purple-500"
            />
            <div class="ml-3">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ $t('siteSettings.notifications.email.usePlatformEmail') }}
              </span>
              <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('siteSettings.notifications.email.usePlatformEmailDesc') }}
              </p>
            </div>
          </label>

          <!-- Own Domain Option -->
          <label
            class="flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all"
            :class="emailForm.useOwnSES
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
          >
            <input
              type="radio"
              v-model="emailForm.useOwnSES"
              :value="true"
              class="mt-1 text-purple-600 focus:ring-purple-500"
            />
            <div class="ml-3">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ $t('siteSettings.notifications.email.useOwnDomain') }}
              </span>
              <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {{ $t('siteSettings.notifications.email.useOwnDomainDesc') }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Own Domain Configuration -->
      <transition name="fade">
        <div v-if="emailForm.useOwnSES" class="space-y-6">
          <!-- Step 1: Domain & Sender Info (if no domain yet) -->
          <div v-if="!domainVerification" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
            <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">1</span>
              {{ $t('siteSettings.notifications.email.domainAndSender') }}
            </h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('siteSettings.notifications.email.domain') }} *
                </label>
                <input
                  v-model="domainForm.domain"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  :placeholder="$t('siteSettings.notifications.email.domainPlaceholder')"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('siteSettings.notifications.email.fromEmail') }}
                </label>
                <input
                  v-model="domainForm.fromEmail"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  :placeholder="$t('siteSettings.notifications.email.fromEmailPlaceholder')"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('siteSettings.notifications.email.fromName') }}
                </label>
                <input
                  v-model="domainForm.fromName"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  :placeholder="$t('siteSettings.notifications.email.fromNamePlaceholder')"
                />
              </div>
            </div>

            <div class="mt-6">
              <button
                @click="handleCreateIdentity"
                :disabled="!domainForm.domain || creatingIdentity"
                class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
              >
                <span v-if="creatingIdentity" class="material-icons animate-spin mr-2">refresh</span>
                <span v-else class="material-icons mr-2">add_circle</span>
                {{ creatingIdentity ? $t('siteSettings.notifications.email.creatingIdentity') : $t('siteSettings.notifications.email.createIdentity') }}
              </button>
            </div>
          </div>

          <!-- Step 2: DNS Records (after domain created) -->
          <template v-if="domainVerification">
            <!-- Domain Info Header -->
            <div class="flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div class="flex items-center">
                <span class="material-icons text-purple-500 mr-2">domain</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ domainVerification.domain }}</span>
                <span
                  class="ml-3 px-2 py-1 text-xs font-medium rounded-full"
                  :class="{
                    'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300': domainVerification.status === 'verified',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300': domainVerification.status === 'pending',
                    'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300': domainVerification.status === 'failed',
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300': !['verified', 'pending', 'failed'].includes(domainVerification.status)
                  }"
                >
                  {{ $t('siteSettings.notifications.email.' + (domainVerification.status || 'pending')) }}
                </span>
              </div>
              <button
                @click="handleDeleteIdentity"
                :disabled="deletingIdentity"
                class="text-red-500 hover:text-red-600 flex items-center text-sm"
              >
                <span v-if="deletingIdentity" class="material-icons animate-spin text-sm mr-1">refresh</span>
                <span v-else class="material-icons text-sm mr-1">delete</span>
                {{ $t('siteSettings.notifications.email.deleteIdentity') }}
              </button>
            </div>

            <!-- DNS Records -->
            <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">2</span>
                {{ $t('siteSettings.notifications.email.dnsRecords') }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">
                {{ $t('siteSettings.notifications.email.dnsRecordsHelp') }}
              </p>

              <!-- DNS Records Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                        {{ $t('siteSettings.notifications.email.recordType') }}
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                        {{ $t('siteSettings.notifications.email.recordName') }}
                      </th>
                      <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">
                        {{ $t('siteSettings.notifications.email.recordValue') }}
                      </th>
                      <th class="px-3 py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-slate-600">
                    <tr v-for="(record, index) in dnsRecords" :key="index" class="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td class="px-3 py-3">
                        <span class="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          {{ record.type }}
                        </span>
                      </td>
                      <td class="px-3 py-3 font-mono text-xs break-all max-w-xs">
                        {{ record.name }}
                      </td>
                      <td class="px-3 py-3 font-mono text-xs break-all max-w-xs">
                        {{ record.value }}
                      </td>
                      <td class="px-3 py-3">
                        <button
                          @click="copyToClipboard(record)"
                          class="text-purple-600 hover:text-purple-700 flex items-center text-xs"
                        >
                          <span class="material-icons text-sm">content_copy</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Step 3: Verification -->
            <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 text-sm flex items-center justify-center mr-2">3</span>
                {{ $t('siteSettings.notifications.email.verificationStatus') }}
              </h4>

              <div class="flex items-center gap-4">
                <button
                  @click="handleCheckVerification"
                  :disabled="checkingVerification"
                  class="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center"
                >
                  <span v-if="checkingVerification" class="material-icons animate-spin mr-2">refresh</span>
                  <span v-else class="material-icons mr-2">refresh</span>
                  {{ checkingVerification ? $t('siteSettings.notifications.email.checking') : $t('siteSettings.notifications.email.checkVerification') }}
                </button>

                <div v-if="domainVerification.status === 'verified'" class="flex items-center text-green-600">
                  <span class="material-icons mr-1">check_circle</span>
                  {{ $t('siteSettings.notifications.email.verified') }}
                </div>
                <div v-else-if="domainVerification.status === 'pending'" class="flex items-center text-yellow-600">
                  <span class="material-icons mr-1">schedule</span>
                  {{ $t('siteSettings.notifications.email.pending') }}
                </div>
                <div v-else-if="domainVerification.status === 'failed'" class="flex items-center text-red-600">
                  <span class="material-icons mr-1">error</span>
                  {{ $t('siteSettings.notifications.email.failed') }}
                </div>
              </div>
            </div>

            <!-- Step 4: Test Email (only if verified) -->
            <div v-if="domainVerification.status === 'verified'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 text-sm flex items-center justify-center mr-2">4</span>
                {{ $t('siteSettings.notifications.email.sendTestEmail') }}
              </h4>

              <div class="flex items-center gap-3">
                <div class="flex-1">
                  <input
                    v-model="testEmailAddress"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    :placeholder="$t('siteSettings.notifications.email.testEmailAddress')"
                  />
                </div>
                <button
                  @click="handleTestEmail"
                  :disabled="!testEmailAddress || sendingTestEmail"
                  class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  <span v-if="sendingTestEmail" class="material-icons animate-spin mr-2">refresh</span>
                  <span v-else class="material-icons mr-2">send</span>
                  {{ $t('siteSettings.notifications.email.sendTestEmail') }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </transition>

      <!-- Platform Default Info -->
      <div v-if="!emailForm.useOwnSES" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div class="flex items-start">
          <span class="material-icons text-blue-500 mr-3">info</span>
          <div>
            <h4 class="font-medium text-blue-800 dark:text-blue-300">
              {{ $t('emailSetup.usingPlatformDefault') }}
            </h4>
            <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {{ $t('emailSetup.usingPlatformDefaultDesc') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- SMS Settings Section -->
    <div v-show="activeTab === 'sms'" class="space-y-6">
      <!-- SMS Enable Toggle -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">
              {{ $t('smsSetup.enableSms') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
              {{ $t('smsSetup.enableSmsDesc') }}
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="smsForm.enabled"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      <transition name="fade">
        <div v-if="smsForm.enabled" class="space-y-6">
          <!-- Provider Selection -->
          <div class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-green-500 mr-2">sms</span>
                {{ $t('smsSetup.provider') }}
              </h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  v-for="provider in smsProviders"
                  :key="provider.value"
                  @click="smsForm.provider = provider.value"
                  :class="[
                    'p-4 rounded-lg border-2 transition-all text-center',
                    smsForm.provider === provider.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  ]"
                >
                  <span class="material-icons text-2xl mb-1" :class="smsForm.provider === provider.value ? 'text-purple-600' : 'text-gray-400'">
                    {{ provider.icon }}
                  </span>
                  <p class="text-sm font-medium" :class="smsForm.provider === provider.value ? 'text-purple-700 dark:text-purple-300' : 'text-gray-600 dark:text-slate-400'">
                    {{ provider.label }}
                  </p>
                </button>
              </div>
            </div>
          </div>

          <!-- Provider Config -->
          <div v-if="smsForm.provider !== 'platform'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-orange-500 mr-2">settings</span>
                {{ $t('smsSetup.providerSettings') }}
              </h3>
            </div>
            <div class="p-6 space-y-4">
              <!-- NetGSM Fields -->
              <template v-if="smsForm.provider === 'netgsm'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.usercode') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.usercode"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.password') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.password"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.netgsm.msgheader') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.msgheader"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Ileti Merkezi Fields -->
              <template v-if="smsForm.provider === 'iletimerkezi'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.apiKey') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.apiKey"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.apiHash') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.apiHash"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.iletimerkezi.sender') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.sender"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Twilio Fields -->
              <template v-if="smsForm.provider === 'twilio'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.accountSid') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.accountSid"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.authToken') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.authToken"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.twilio.fromNumber') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.fromNumber"
                    placeholder="+1234567890"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>

              <!-- Vonage Fields -->
              <template v-if="smsForm.provider === 'vonage'">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.apiKey') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.apiKey"
                    autocomplete="nope"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.apiSecret') }}
                  </label>
                  <input
                    type="password"
                    v-model="smsForm.config.apiSecret"
                    autocomplete="new-password"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('smsSetup.vonage.fromNumber') }}
                  </label>
                  <input
                    type="text"
                    v-model="smsForm.config.fromNumber"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- Test SMS Section -->
          <div v-if="smsForm.provider !== 'platform'" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
            <div class="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <span class="material-icons text-purple-500 mr-2">send</span>
                {{ $t('smsSetup.testSms') }}
              </h3>
            </div>
            <div class="p-6">
              <div class="flex space-x-2">
                <input
                  type="tel"
                  v-model="testPhone"
                  :placeholder="$t('smsSetup.testPhonePlaceholder')"
                  autocomplete="off"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
                <button
                  @click="sendTestSMS"
                  :disabled="!testPhone || sendingTestSMS"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <span v-if="sendingTestSMS" class="material-icons animate-spin mr-2">refresh</span>
                  <span v-else class="material-icons mr-2">send</span>
                  {{ $t('smsSetup.sendTest') }}
                </button>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-slate-400">
                {{ $t('smsSetup.testSmsHint') }}
              </p>
            </div>
          </div>

          <!-- Platform Default Info for SMS -->
          <div v-if="smsForm.provider === 'platform'" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div class="flex items-start">
              <span class="material-icons text-blue-500 mr-3">info</span>
              <div>
                <h4 class="font-medium text-blue-800 dark:text-blue-300">
                  {{ $t('smsSetup.usingPlatformDefault') }}
                </h4>
                <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {{ $t('smsSetup.usingPlatformDefaultDesc') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- SMS Disabled Info -->
      <div v-if="!smsForm.enabled" class="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-6">
        <div class="flex items-start">
          <span class="material-icons text-gray-400 mr-3">sms_failed</span>
          <div>
            <h4 class="font-medium text-gray-700 dark:text-slate-300">
              {{ $t('smsSetup.smsDisabled') }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ $t('smsSetup.smsDisabledDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-slate-700">
        <button
          @click="saveSMSSettings"
          :disabled="savingSMS"
          class="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
        >
          <span v-if="savingSMS" class="material-icons animate-spin mr-2">refresh</span>
          <span v-else class="material-icons mr-2">save</span>
          {{ $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { usePartnerContext } from '@/composables/usePartnerContext'
import * as partnerEmailService from '@/services/partnerEmailService'
import * as partnerSmsService from '@/services/partnerSmsService'

const { t } = useI18n()
const toast = useToast()
const authStore = useAuthStore()

const activeTab = ref('email')
const loading = ref(true)
const savingEmail = ref(false)
const savingSMS = ref(false)
const sendingTestSMS = ref(false)
const showSecretKey = ref(false)
const testPhone = ref('')

// Domain identity states
const creatingIdentity = ref(false)
const deletingIdentity = ref(false)
const checkingVerification = ref(false)
const sendingTestEmail = ref(false)
const testEmailAddress = ref('')
const domainVerification = ref(null)
const dnsRecords = ref([])
const domainForm = reactive({
  domain: '',
  fromEmail: '',
  fromName: ''
})

const tabs = computed(() => [
  { id: 'email', icon: 'email', label: t('smsSetup.tabs.email') },
  { id: 'sms', icon: 'sms', label: t('smsSetup.tabs.sms') }
])

const smsProviders = computed(() => [
  { value: 'platform', icon: 'cloud', label: t('smsSetup.providers.platform') },
  { value: 'netgsm', icon: 'sms', label: 'NetGSM' },
  { value: 'iletimerkezi', icon: 'message', label: t('smsSetup.providers.iletimerkezi') },
  { value: 'twilio', icon: 'call', label: 'Twilio' },
  { value: 'vonage', icon: 'send', label: 'Vonage' }
])

// Email Form
const emailForm = reactive({
  useOwnSES: false,
  aws: {
    region: 'eu-west-1',
    accessKeyId: '',
    secretAccessKey: '',
    fromEmail: '',
    fromName: ''
  }
})

// SMS Form
const smsForm = reactive({
  enabled: true,
  provider: 'platform',
  config: {
    // NetGSM
    usercode: '',
    password: '',
    msgheader: '',
    // Ileti Merkezi
    apiKey: '',
    apiHash: '',
    sender: '',
    // Twilio
    accountSid: '',
    authToken: '',
    // Vonage
    apiSecret: '',
    // Common
    fromNumber: ''
  }
})

// Get partner context
const { currentPartnerId } = usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      loadSettings()
    }
  },
  immediate: true
})

const loadSettings = async () => {
  try {
    loading.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner
    if (!partnerId) return

    // Load email settings
    const emailSettings = await partnerEmailService.getEmailSettings(partnerId)
    if (emailSettings) {
      emailForm.useOwnSES = emailSettings.useOwnSES || false
      emailForm.aws = {
        region: emailSettings.aws?.region || 'eu-west-1',
        accessKeyId: emailSettings.aws?.accessKeyId || '',
        secretAccessKey: '',
        fromEmail: emailSettings.aws?.fromEmail || '',
        fromName: emailSettings.aws?.fromName || ''
      }

      // Load domain verification data
      if (emailSettings.domainVerification) {
        domainVerification.value = emailSettings.domainVerification
        // Generate DNS records from tokens
        if (emailSettings.domainVerification.dkimTokens) {
          dnsRecords.value = generateDnsRecords(
            emailSettings.domainVerification.domain,
            emailSettings.domainVerification.dkimTokens
          )
        }
      }
    }

    // Load SMS settings
    const smsSettings = await partnerSmsService.getSMSSettings(partnerId)
    if (smsSettings) {
      smsForm.enabled = smsSettings.enabled !== false
      smsForm.provider = smsSettings.provider || 'platform'
      // Config is masked on server, so we don't load it
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  } finally {
    loading.value = false
  }
}

// Generate DNS records from DKIM tokens
const generateDnsRecords = (domain, dkimTokens) => {
  const records = []
  if (dkimTokens) {
    dkimTokens.forEach((token, i) => {
      records.push({
        type: 'CNAME',
        name: `${token}._domainkey.${domain}`,
        value: `${token}.dkim.amazonses.com`,
        purpose: `DKIM Key ${i + 1}`
      })
    })
  }
  records.push({
    type: 'TXT',
    name: domain,
    value: 'v=spf1 include:amazonses.com ~all',
    purpose: 'SPF Record'
  })
  return records
}

// Create domain identity
const handleCreateIdentity = async () => {
  if (!domainForm.domain) return

  creatingIdentity.value = true
  try {
    const partnerId = currentPartnerId.value || authStore.user?.partner
    const result = await partnerEmailService.createIdentity(partnerId, {
      domain: domainForm.domain,
      fromEmail: domainForm.fromEmail,
      fromName: domainForm.fromName
    })

    domainVerification.value = {
      domain: result.domain,
      status: result.dkimStatus || 'pending',
      dkimTokens: result.dkimTokens
    }

    dnsRecords.value = result.dnsRecords || generateDnsRecords(result.domain, result.dkimTokens)

    toast.success(t('siteSettings.notifications.email.identityCreated'))
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    creatingIdentity.value = false
  }
}

// Check verification status
const handleCheckVerification = async () => {
  checkingVerification.value = true
  try {
    const partnerId = currentPartnerId.value || authStore.user?.partner
    const result = await partnerEmailService.getVerificationStatus(partnerId)

    // Backend null döndüyse domain yoktur - state'i temizle
    if (!result) {
      domainVerification.value = null
      dnsRecords.value = []
      toast.warning(t('siteSettings.notifications.email.noDomainFound'))
      return
    }

    domainVerification.value = {
      ...domainVerification.value,
      status: result.status,
      verified: result.verified
    }

    if (result.dnsRecords) {
      dnsRecords.value = result.dnsRecords
    }

    if (result.verified) {
      toast.success(t('siteSettings.notifications.email.verified'))
    } else {
      toast.info(t('siteSettings.notifications.email.' + result.status))
    }
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    checkingVerification.value = false
  }
}

// Delete domain identity
const handleDeleteIdentity = async () => {
  if (!confirm(t('siteSettings.notifications.email.deleteIdentityConfirm'))) return

  deletingIdentity.value = true
  try {
    const partnerId = currentPartnerId.value || authStore.user?.partner
    await partnerEmailService.deleteIdentity(partnerId)

    domainVerification.value = null
    dnsRecords.value = []
    domainForm.domain = ''
    domainForm.fromEmail = ''
    domainForm.fromName = ''
    emailForm.useOwnSES = false

    toast.success(t('siteSettings.notifications.email.identityDeleted'))
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    deletingIdentity.value = false
  }
}

// Send test email
const handleTestEmail = async () => {
  if (!testEmailAddress.value) return

  sendingTestEmail.value = true
  try {
    const partnerId = currentPartnerId.value || authStore.user?.partner
    await partnerEmailService.testEmail(partnerId, testEmailAddress.value)
    toast.success(t('siteSettings.notifications.email.testEmailSent'))
  } catch (error) {
    toast.error(error.response?.data?.error || t('common.operationFailed'))
  } finally {
    sendingTestEmail.value = false
  }
}

// Copy to clipboard
const copyToClipboard = (record) => {
  const text = `${record.name}\t${record.value}`
  navigator.clipboard.writeText(text).then(() => {
    toast.success(t('siteSettings.notifications.email.copied'))
  })
}

const handleEmailToggleChange = () => {
  if (!emailForm.useOwnSES) {
    emailForm.aws = {
      region: 'eu-west-1',
      accessKeyId: '',
      secretAccessKey: '',
      fromEmail: '',
      fromName: ''
    }
  }
}

const saveEmailSettings = async () => {
  try {
    savingEmail.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerEmailService.updateEmailSettings(partnerId, {
      useOwnSES: emailForm.useOwnSES,
      aws: emailForm.useOwnSES ? emailForm.aws : null
    })

    toast.success(t('emailSetup.settingsSaved'))
  } catch (error) {
    console.error('Save failed:', error)
    toast.error(error.response?.data?.message || t('emailSetup.saveError'))
  } finally {
    savingEmail.value = false
  }
}

const saveSMSSettings = async () => {
  try {
    savingSMS.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerSmsService.updateSMSSettings(partnerId, {
      enabled: smsForm.enabled,
      provider: smsForm.provider,
      config: smsForm.provider !== 'platform' ? smsForm.config : null
    })

    toast.success(t('smsSetup.settingsSaved'))
  } catch (error) {
    console.error('Save failed:', error)
    toast.error(error.response?.data?.message || t('smsSetup.saveError'))
  } finally {
    savingSMS.value = false
  }
}

const sendTestSMS = async () => {
  try {
    sendingTestSMS.value = true
    const partnerId = currentPartnerId.value || authStore.user?.partner

    await partnerSmsService.testSMS(partnerId, testPhone.value)
    toast.success(t('smsSetup.testSmsSent'))
  } catch (error) {
    console.error('Test SMS failed:', error)
    toast.error(error.response?.data?.error || t('smsSetup.testSmsError'))
  } finally {
    sendingTestSMS.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
