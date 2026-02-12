<template>
  <div class="space-y-6">
    <!-- Hidden dummy fields to prevent browser autofill -->
    <input type="text" name="prevent_autofill" style="display: none" tabindex="-1" />
    <input type="password" name="prevent_autofill_pass" style="display: none" tabindex="-1" />

    <!-- Save Button + Status Indicator -->
    <div class="flex items-center justify-between">
      <div v-if="isDirty" class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <span class="material-icons text-sm">warning</span>
        <span class="text-sm font-medium">{{ $t('platformSettings.unsavedChanges') }}</span>
      </div>
      <div
        v-else-if="lastSaveTime"
        class="flex items-center gap-2 text-green-600 dark:text-green-400"
      >
        <span class="material-icons text-sm">cloud_done</span>
        <span class="text-sm">{{ $t('platformSettings.saved') }}</span>
      </div>
      <div v-else></div>

      <button
        :disabled="saving"
        class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
        @click="saveSettings"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span v-else class="material-icons text-sm">save</span>
        {{ $t('common.save') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <span class="material-icons animate-spin text-3xl text-purple-500">refresh</span>
    </div>

    <!-- Tabs -->
    <div v-else>
      <Tabs v-model="activeTab" :tabs="tabs" variant="underline" color="purple" />

      <!-- Entegrasyonlar Tab -->
      <div v-if="activeTab === 'integrations'" class="grid gap-6 mt-6">
        <!-- AWS SES Email Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-orange-500">email</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.email.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.email.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.aws.ses.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.aws.ses.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.email.region') }}
                </label>
                <select
                  v-model="settings.aws.ses.region"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="eu-west-1">EU West 1 (Ireland)</option>
                  <option value="eu-central-1">EU Central 1 (Frankfurt)</option>
                  <option value="us-east-1">US East 1 (N. Virginia)</option>
                  <option value="us-west-2">US West 2 (Oregon)</option>
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                  <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.email.accessKeyId') }}
                </label>
                <input
                  v-model="settings.aws.ses.accessKeyId"
                  type="password"
                  :placeholder="settings.aws.ses.accessKeyId ? '********' : ''"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.email.secretAccessKey') }}
                </label>
                <input
                  v-model="settings.aws.ses.secretAccessKey"
                  type="password"
                  :placeholder="settings.aws.ses.secretAccessKey ? '********' : ''"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.email.fromEmail') }}
                </label>
                <input
                  v-model="settings.aws.ses.fromEmail"
                  type="email"
                  placeholder="noreply@example.com"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.email.fromName') }}
                </label>
                <input
                  v-model="settings.aws.ses.fromName"
                  type="text"
                  placeholder="Booking Platform"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <!-- Test Email Button -->
            <div
              class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700"
            >
              <input
                v-model="testEmailAddress"
                type="email"
                :placeholder="$t('platformSettings.email.testEmailPlaceholder')"
                autocomplete="off"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <button
                :disabled="!testEmailAddress || testingEmail"
                class="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                @click="sendTestEmail"
              >
                <span v-if="testingEmail" class="material-icons animate-spin text-sm">refresh</span>
                <span v-else class="material-icons text-sm">send</span>
                {{ $t('platformSettings.email.sendTest') }}
              </button>
            </div>
          </div>
        </div>

        <!-- NetGSM SMS Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-green-500">sms</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.sms.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.sms.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.netgsm.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.netgsm.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.sms.usercode') }}
                </label>
                <input
                  v-model="settings.netgsm.usercode"
                  type="password"
                  :placeholder="settings.netgsm.usercode ? '********' : ''"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.sms.password') }}
                </label>
                <input
                  v-model="settings.netgsm.password"
                  type="password"
                  :placeholder="settings.netgsm.password ? '********' : ''"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.sms.msgheader') }}
                </label>
                <input
                  v-model="settings.netgsm.msgheader"
                  type="text"
                  placeholder="BOOKING"
                  maxlength="11"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {{ $t('platformSettings.sms.msgheaderHint') }}
                </p>
              </div>
            </div>
            <!-- Test SMS Button -->
            <div
              class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700"
            >
              <input
                v-model="testPhoneNumber"
                type="tel"
                :placeholder="$t('platformSettings.sms.testPhonePlaceholder')"
                autocomplete="off"
                class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <button
                :disabled="!testPhoneNumber || testingSMS"
                class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                @click="sendTestSMS"
              >
                <span v-if="testingSMS" class="material-icons animate-spin text-sm">refresh</span>
                <span v-else class="material-icons text-sm">send</span>
                {{ $t('platformSettings.sms.sendTest') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Gemini AI Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-purple-500">auto_awesome</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.gemini.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.gemini.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.gemini.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.gemini.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.gemini.apiKey') }}
                </label>
                <input
                  v-model="settings.gemini.apiKey"
                  type="password"
                  :placeholder="settings.gemini.apiKey ? '********' : 'AIzaSy...'"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {{ $t('platformSettings.gemini.apiKeyHint') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Firecrawl Web Scraping Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-red-500">local_fire_department</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.firecrawl.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.firecrawl.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.firecrawl.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.firecrawl.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.firecrawl.apiKey') }}
                </label>
                <input
                  v-model="settings.firecrawl.apiKey"
                  type="password"
                  :placeholder="settings.firecrawl.apiKey ? '********' : 'fc-...'"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {{ $t('platformSettings.firecrawl.apiKeyHint') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Paximum OTA Integration Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-indigo-500">travel_explore</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.paximum.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.paximum.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.paximum.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.paximum.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.paximum.endpoint') }}
                </label>
                <input
                  v-model="settings.paximum.endpoint"
                  type="text"
                  placeholder="https://service.paximum.com/v2"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.paximum.agency') }}
                </label>
                <input
                  v-model="settings.paximum.agency"
                  type="text"
                  :placeholder="settings.paximum.agency ? '********' : 'PXM...'"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.paximum.user') }}
                </label>
                <input
                  v-model="settings.paximum.user"
                  type="text"
                  :placeholder="settings.paximum.user ? '********' : 'USR...'"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.paximum.password') }}
                </label>
                <input
                  v-model="settings.paximum.password"
                  type="password"
                  :placeholder="settings.paximum.password ? '********' : ''"
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.paximum.defaultMarkup') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="settings.paximum.defaultMarkup"
                    type="number"
                    min="0"
                    max="100"
                    autocomplete="off"
                    class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <span class="text-gray-500">%</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {{ $t('platformSettings.paximum.defaultMarkupHint') }}
                </p>
              </div>
            </div>
            <!-- Test Connection Button -->
            <div
              class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700"
            >
              <button
                :disabled="testingPaximum"
                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                @click="testPaximumConnection"
              >
                <span v-if="testingPaximum" class="material-icons animate-spin text-sm"
                  >refresh</span
                >
                <span v-else class="material-icons text-sm">wifi_tethering</span>
                {{ $t('platformSettings.paximum.testConnection') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bildirimler Tab -->
      <div v-if="activeTab === 'notifications'" class="grid gap-6 mt-6">
        <!-- Web Push Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-blue-500">notifications</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.push.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.push.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="settings.webPush.enabled" type="checkbox" class="sr-only peer" />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div v-if="settings.webPush.enabled" class="p-6 space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.push.publicKey') }}
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="settings.webPush.publicKey"
                    type="text"
                    readonly
                    autocomplete="off"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                  <button
                    class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600"
                    :title="$t('common.copy')"
                    @click="copyToClipboard(settings.webPush.publicKey)"
                  >
                    <span class="material-icons text-gray-500 text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.push.privateKey') }}
                </label>
                <input
                  v-model="settings.webPush.privateKey"
                  type="password"
                  :placeholder="settings.webPush.privateKey ? '********' : ''"
                  readonly
                  autocomplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {{ $t('platformSettings.push.contactEmail') }}
                </label>
                <input
                  v-model="settings.webPush.contactEmail"
                  type="email"
                  placeholder="admin@example.com"
                  autocomplete="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <!-- Generate VAPID Keys Button -->
            <div
              class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700"
            >
              <button
                :disabled="generatingVAPID"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                @click="generateVAPID"
              >
                <span v-if="generatingVAPID" class="material-icons animate-spin text-sm"
                  >refresh</span
                >
                <span v-else class="material-icons text-sm">vpn_key</span>
                {{ $t('platformSettings.push.generateKeys') }}
              </button>
              <span class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('platformSettings.push.generateKeysHint') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Finans Tab -->
      <div v-if="activeTab === 'finance'" class="grid gap-6 mt-6">
        <!-- Billing / Invoice Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3"
          >
            <span class="material-icons text-emerald-500">receipt_long</span>
            <div>
              <h2 class="font-semibold text-gray-900 dark:text-white">
                {{ $t('platformSettings.billing.title') }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ $t('platformSettings.billing.description') }}
              </p>
            </div>
          </div>
          <div class="p-6 space-y-6">
            <!-- Company Info -->
            <div>
              <h3 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('platformSettings.billing.companyInfo') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.companyName') }}
                  </label>
                  <input
                    v-model="settings.billing.companyName"
                    type="text"
                    :placeholder="$t('platformSettings.billing.companyNamePlaceholder')"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.taxNumber') }}
                  </label>
                  <input
                    v-model="settings.billing.taxNumber"
                    type="text"
                    placeholder="1234567890"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.taxOffice') }}
                  </label>
                  <input
                    v-model="settings.billing.taxOffice"
                    type="text"
                    :placeholder="$t('platformSettings.billing.taxOfficePlaceholder')"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.email') }}
                  </label>
                  <input
                    v-model="settings.billing.email"
                    type="email"
                    placeholder="billing@company.com"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.phone') }}
                  </label>
                  <input
                    v-model="settings.billing.phone"
                    type="tel"
                    placeholder="+90 212 123 4567"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Address -->
            <div class="pt-4 border-t border-gray-200 dark:border-slate-700">
              <h3 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('platformSettings.billing.address') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.street') }}
                  </label>
                  <input
                    v-model="settings.billing.address.street"
                    type="text"
                    :placeholder="$t('platformSettings.billing.streetPlaceholder')"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.city') }}
                  </label>
                  <input
                    v-model="settings.billing.address.city"
                    type="text"
                    placeholder="Istanbul"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.country') }}
                  </label>
                  <input
                    v-model="settings.billing.address.country"
                    type="text"
                    placeholder="Türkiye"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.postalCode') }}
                  </label>
                  <input
                    v-model="settings.billing.address.postalCode"
                    type="text"
                    placeholder="34000"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <!-- Invoice Settings -->
            <div class="pt-4 border-t border-gray-200 dark:border-slate-700">
              <h3 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                {{ $t('platformSettings.billing.invoiceSettings') }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.invoicePrefix') }}
                  </label>
                  <input
                    v-model="settings.billing.invoicePrefix"
                    type="text"
                    placeholder="INV"
                    maxlength="10"
                    autocomplete="off"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {{ $t('platformSettings.billing.invoicePrefixHint') }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.defaultTaxRate') }}
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="settings.billing.defaultTaxRate"
                      type="number"
                      min="0"
                      max="100"
                      autocomplete="off"
                      class="w-24 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <span class="text-gray-500">%</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {{ $t('platformSettings.billing.defaultTaxRateHint') }}
                  </p>
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {{ $t('platformSettings.billing.invoiceNotes') }}
                  </label>
                  <textarea
                    v-model="settings.billing.invoiceNotes"
                    rows="3"
                    :placeholder="$t('platformSettings.billing.invoiceNotesPlaceholder')"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  ></textarea>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {{ $t('platformSettings.billing.invoiceNotesHint') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bank Accounts -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-teal-500">account_balance</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.bankAccounts.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.bankAccounts.description') }}
                </p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="settings.billing.bankTransferEnabled"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
              ></div>
            </label>
          </div>
          <div class="p-6 space-y-6">
            <!-- Bank Transfer Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('platformSettings.bankAccounts.descriptionLabel') }}
              </label>
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
                {{ $t('platformSettings.bankAccounts.descriptionHint') }}
              </p>
              <MultiLangInput
                v-model="settings.billing.bankTransferDescription"
                type="textarea"
                :rows="3"
                :languages="B2C_LANGUAGES"
                :placeholder="$t('platformSettings.bankAccounts.descriptionPlaceholder')"
              />
            </div>

            <!-- Accounts List -->
            <div class="pt-4 border-t border-gray-200 dark:border-slate-700">
              <BankAccountManager v-model="settings.billing.bankAccounts" />
            </div>
          </div>
        </div>

        <!-- Exchange Rates / TCMB Settings -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="material-icons text-amber-500">currency_exchange</span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">
                  {{ $t('platformSettings.exchange.title') }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.exchange.description') }}
                </p>
              </div>
            </div>
            <button
              :disabled="refreshingRates"
              class="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
              @click="refreshExchangeRates"
            >
              <span :class="['material-icons text-sm', refreshingRates && 'animate-spin']"
                >sync</span
              >
              {{ $t('platformSettings.exchange.refresh') }}
            </button>
          </div>
          <div class="p-6 space-y-6">
            <!-- Scheduler Status -->
            <div
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <span
                  :class="[
                    'w-3 h-3 rounded-full',
                    schedulerStatus.isRunning ? 'bg-green-500' : 'bg-gray-400'
                  ]"
                ></span>
                <div>
                  <p class="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {{ $t('platformSettings.exchange.scheduler') }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-slate-400">
                    {{
                      schedulerStatus.isRunning
                        ? $t('platformSettings.exchange.schedulerRunning')
                        : $t('platformSettings.exchange.schedulerStopped')
                    }}
                    <span v-if="schedulerStatus.isRunning">
                      ({{ $t('platformSettings.exchange.every') }}
                      {{ schedulerStatus.checkInterval }}
                      {{ $t('platformSettings.exchange.minutes') }})
                    </span>
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500 dark:text-slate-400">
                  {{ $t('platformSettings.exchange.workingHours') }}:
                  {{ schedulerStatus.workingHours?.start || 9 }}:00 -
                  {{ schedulerStatus.workingHours?.end || 17 }}:00 (TR)
                </p>
                <p
                  :class="[
                    'text-xs font-medium',
                    schedulerStatus.isWithinWorkingHours ? 'text-green-600' : 'text-gray-500'
                  ]"
                >
                  {{
                    schedulerStatus.isWithinWorkingHours
                      ? $t('platformSettings.exchange.withinWorkingHours')
                      : $t('platformSettings.exchange.outsideWorkingHours')
                  }}
                </p>
              </div>
            </div>

            <!-- Last Update Info -->
            <div v-if="exchangeRates" class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-icons text-gray-400 text-sm">schedule</span>
                <span class="text-sm text-gray-600 dark:text-slate-400">
                  {{ $t('platformSettings.exchange.lastUpdate') }}:
                  <span class="font-medium">{{ formatDateTime(exchangeRates.lastUpdated) }}</span>
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    exchangeRates.source === 'tcmb'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : exchangeRates.source === 'fallback'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  ]"
                >
                  {{
                    exchangeRates.source === 'tcmb'
                      ? 'TCMB'
                      : exchangeRates.source === 'fallback'
                        ? $t('platformSettings.exchange.fallback')
                        : $t('platformSettings.exchange.manual')
                  }}
                </span>
                <span
                  v-if="exchangeRates.bulletin"
                  class="text-xs text-gray-500 dark:text-slate-400"
                >
                  {{ $t('platformSettings.exchange.bulletin') }}: {{ exchangeRates.bulletin }}
                </span>
              </div>
            </div>

            <!-- Exchange Rates Table -->
            <div v-if="exchangeRates?.rates" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-slate-700">
                    <th class="text-left py-2 px-3 font-medium text-gray-600 dark:text-slate-400">
                      {{ $t('platformSettings.exchange.currency') }}
                    </th>
                    <th class="text-right py-2 px-3 font-medium text-gray-600 dark:text-slate-400">
                      {{ $t('platformSettings.exchange.rate') }} (TRY)
                    </th>
                    <th class="text-right py-2 px-3 font-medium text-gray-600 dark:text-slate-400">
                      {{ $t('platformSettings.exchange.actions') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(rate, code) in mainCurrencies"
                    :key="code"
                    class="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30"
                  >
                    <td class="py-2 px-3">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 dark:text-white">{{ code }}</span>
                        <span class="text-xs text-gray-500">{{ getCurrencyName(code) }}</span>
                      </div>
                    </td>
                    <td class="py-2 px-3 text-right font-mono text-gray-900 dark:text-white">
                      {{ formatRate(rate) }}
                    </td>
                    <td class="py-2 px-3 text-right">
                      <button
                        v-if="code !== 'TRY'"
                        class="text-blue-600 hover:text-blue-700 text-xs"
                        @click="openManualRateModal(code, rate)"
                      >
                        {{ $t('common.edit') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Show All Currencies Toggle -->
            <div class="flex items-center justify-center">
              <button
                class="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300 flex items-center gap-1"
                @click="showAllCurrencies = !showAllCurrencies"
              >
                <span class="material-icons text-sm">{{
                  showAllCurrencies ? 'expand_less' : 'expand_more'
                }}</span>
                {{
                  showAllCurrencies
                    ? $t('platformSettings.exchange.showLess')
                    : $t('platformSettings.exchange.showAll')
                }}
                ({{ Object.keys(exchangeRates?.rates || {}).length }}
                {{ $t('platformSettings.exchange.currencies') }})
              </button>
            </div>

            <!-- All Currencies (Collapsed) -->
            <div v-if="showAllCurrencies && exchangeRates?.rates" class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-slate-700">
                    <th class="text-left py-2 px-3 font-medium text-gray-600 dark:text-slate-400">
                      {{ $t('platformSettings.exchange.currency') }}
                    </th>
                    <th class="text-right py-2 px-3 font-medium text-gray-600 dark:text-slate-400">
                      {{ $t('platformSettings.exchange.rate') }} (TRY)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(rate, code) in otherCurrencies"
                    :key="code"
                    class="border-b border-gray-100 dark:border-slate-700/50"
                  >
                    <td class="py-2 px-3 font-medium text-gray-900 dark:text-white">{{ code }}</td>
                    <td class="py-2 px-3 text-right font-mono text-gray-900 dark:text-white">
                      {{ formatRate(rate) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Manual Rate Modal -->
      <div
        v-if="manualRateModal.show"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="manualRateModal.show = false"
      >
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ $t('platformSettings.exchange.setManualRate') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('platformSettings.exchange.currency') }}
              </label>
              <input
                :value="manualRateModal.currency"
                type="text"
                readonly
                autocomplete="off"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {{ $t('platformSettings.exchange.newRate') }} (TRY)
              </label>
              <input
                v-model.number="manualRateModal.value"
                type="number"
                step="0.0001"
                min="0"
                autocomplete="off"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              {{ $t('platformSettings.exchange.manualRateNote') }}
            </p>
          </div>
          <div
            class="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3"
          >
            <button
              class="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              @click="manualRateModal.show = false"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              :disabled="settingManualRate"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              @click="saveManualRate"
            >
              <span v-if="settingManualRate" class="material-icons animate-spin text-sm mr-1"
                >refresh</span
              >
              {{ $t('common.save') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Leave Confirmation Dialog -->
    <ConfirmDialog
      v-model="showLeaveConfirm"
      type="warning"
      :title="$t('platformSettings.leaveConfirm.title')"
      :message="$t('platformSettings.leaveConfirm.message')"
      :confirm-text="$t('platformSettings.leaveConfirm.leave')"
      :cancel-text="$t('platformSettings.leaveConfirm.stay')"
      @confirm="confirmLeave"
      @cancel="cancelLeave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'
import { usePlatformSettings } from '@/composables/usePlatformSettings'
import { useExchangeRates } from '@/composables/useExchangeRates'
import Tabs from '@/components/ui/navigation/Tabs.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import BankAccountManager from '@/components/common/BankAccountManager.vue'
import ConfirmDialog from '@/components/ui/feedback/ConfirmDialog.vue'
import { B2C_LANGUAGES } from '@/constants/languages'

const { t } = useI18n()

// Active tab
const activeTab = ref('integrations')

const tabs = [
  { value: 'integrations', label: t('platformSettings.tabs.integrations'), icon: 'extension' },
  {
    value: 'notifications',
    label: t('platformSettings.tabs.notifications'),
    icon: 'notifications'
  },
  { value: 'finance', label: t('platformSettings.tabs.finance'), icon: 'account_balance' }
]

// Platform settings composable
const {
  settings,
  isDirty,
  lastSaveTime,
  testEmailAddress,
  testPhoneNumber,
  loading,
  saving,
  testingEmail,
  testingSMS,
  testingPaximum,
  generatingVAPID,
  loadSettings,
  saveSettings,
  sendTestEmail,
  sendTestSMS,
  testPaximumConnection,
  generateVAPID,
  copyToClipboard
} = usePlatformSettings()

// Exchange rates composable
const {
  exchangeRates,
  schedulerStatus,
  showAllCurrencies,
  manualRateModal,
  refreshingRates,
  settingManualRate,
  mainCurrencies,
  otherCurrencies,
  getCurrencyName,
  formatRate,
  formatDateTime,
  loadExchangeRates,
  refreshExchangeRates,
  openManualRateModal,
  saveManualRate
} = useExchangeRates()

// Navigation guard - warn on unsaved changes
const showLeaveConfirm = ref(false)
let resolveNavigation = null

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true
  return new Promise(resolve => {
    resolveNavigation = resolve
    showLeaveConfirm.value = true
  })
})

const confirmLeave = () => {
  showLeaveConfirm.value = false
  resolveNavigation?.(true)
}

const cancelLeave = () => {
  showLeaveConfirm.value = false
  resolveNavigation?.(false)
}

// Browser beforeunload guard
const handleBeforeUnload = e => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  loadSettings()
  loadExchangeRates()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
