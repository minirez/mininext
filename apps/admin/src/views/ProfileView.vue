<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Profile Header -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <div class="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="relative group">
            <div
              v-if="avatarUrl"
              class="w-20 h-20 rounded-full overflow-hidden ring-4 ring-white/30"
            >
              <img :src="avatarUrl" :alt="authStore.user?.name" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white/30"
            >
              {{ getInitials(authStore.user?.name) }}
            </div>
            <!-- Upload overlay -->
            <div
              class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              @click="avatarInputRef?.click()"
            >
              <span class="material-icons text-white">camera_alt</span>
            </div>
            <!-- Hidden file input -->
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarSelect"
            />
          </div>
          <div class="text-white flex-1">
            <h1 class="text-2xl font-bold">{{ authStore.user?.name || '-' }}</h1>
            <p class="text-purple-200">{{ authStore.user?.email }}</p>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 mt-2"
            >
              {{ getRoleName() }}
            </span>
          </div>
          <!-- Delete avatar button -->
          <button
            v-if="avatarUrl"
            class="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            :title="$t('profile.deleteAvatar')"
            @click="handleAvatarDelete"
          >
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Account Information -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">person</span>
          {{ $t('profile.accountInfo') }}
        </h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.fullName') }}
            </label>
            <p
              class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg"
            >
              {{ authStore.user?.name || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.email') }}
            </label>
            <p
              class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg"
            >
              {{ authStore.user?.email || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.role') }}
            </label>
            <p
              class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg"
            >
              {{ getRoleName() }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.accountType') }}
            </label>
            <p
              class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg capitalize"
            >
              {{ authStore.user?.accountType || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preferences -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">settings</span>
          {{ $t('profile.preferences') }}
        </h2>
      </div>
      <div class="p-6 space-y-6">
        <!-- Language -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('profile.language') }}
          </label>
          <div class="flex gap-3">
            <button
              v-for="lang in languages"
              :key="lang.code"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="
                currentLocale === lang.code
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
              "
              @click="changeLanguage(lang.code)"
            >
              <span class="text-lg">{{ lang.flag }}</span>
              <span class="font-medium">{{ lang.name }}</span>
              <span v-if="currentLocale === lang.code" class="material-icons text-sm"
                >check_circle</span
              >
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('profile.theme') }}
          </label>
          <div class="flex gap-3">
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="
                !uiStore.darkMode
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              "
              @click="uiStore.setDarkMode(false)"
            >
              <span class="material-icons">light_mode</span>
              <span class="font-medium">{{ $t('common.lightMode') }}</span>
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="
                uiStore.darkMode
                  ? 'border-purple-600 bg-purple-900/20 text-purple-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'
              "
              @click="uiStore.setDarkMode(true)"
            >
              <span class="material-icons">dark_mode</span>
              <span class="font-medium">{{ $t('common.darkMode') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Preferences -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">notifications</span>
          {{ $t('profile.notifications.title') }}
        </h2>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ $t('profile.notifications.description') }}
        </p>
      </div>
      <div class="p-6 space-y-6">
        <!-- Email Notifications -->
        <div>
          <h3
            class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4"
          >
            <span class="material-icons text-lg text-blue-500">email</span>
            {{ $t('profile.notifications.email') }}
          </h3>
          <div class="space-y-3 pl-7">
            <label
              v-for="(value, key) in notificationPreferences.email"
              :key="'email-' + key"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700 dark:text-slate-300">{{
                $t('profile.notifications.types.' + key)
              }}</span>
              <button
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  notificationPreferences.email[key]
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-slate-600'
                ]"
                @click="toggleNotification('email', key)"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notificationPreferences.email[key] ? 'translate-x-6' : 'translate-x-1'
                  ]"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- SMS Notifications -->
        <div>
          <h3
            class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4"
          >
            <span class="material-icons text-lg text-green-500">sms</span>
            {{ $t('profile.notifications.sms') }}
          </h3>
          <div class="space-y-3 pl-7">
            <label
              v-for="(value, key) in notificationPreferences.sms"
              :key="'sms-' + key"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700 dark:text-slate-300">{{
                $t('profile.notifications.types.' + key)
              }}</span>
              <button
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  notificationPreferences.sms[key]
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-slate-600'
                ]"
                @click="toggleNotification('sms', key)"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notificationPreferences.sms[key] ? 'translate-x-6' : 'translate-x-1'
                  ]"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- Push Notifications -->
        <div>
          <h3
            class="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4"
          >
            <span class="material-icons text-lg text-orange-500">notifications_active</span>
            {{ $t('profile.notifications.push') }}
          </h3>
          <div class="space-y-3 pl-7">
            <label
              v-for="(value, key) in notificationPreferences.push"
              :key="'push-' + key"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700 dark:text-slate-300">{{
                $t('profile.notifications.types.' + key)
              }}</span>
              <button
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  notificationPreferences.push[key]
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-slate-600'
                ]"
                @click="toggleNotification('push', key)"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    notificationPreferences.push[key] ? 'translate-x-6' : 'translate-x-1'
                  ]"
                ></span>
              </button>
            </label>
          </div>
        </div>

        <!-- Save Button -->
        <div class="pt-4 border-t border-gray-200 dark:border-slate-700 flex justify-end">
          <button
            :disabled="savingNotifications"
            class="btn-primary flex items-center gap-2"
            @click="saveNotificationPreferences"
          >
            <span v-if="savingNotifications" class="animate-spin material-icons text-lg"
              >refresh</span
            >
            <span v-else class="material-icons">save</span>
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">security</span>
          {{ $t('profile.security') }}
        </h2>
      </div>
      <div class="p-6 space-y-6">
        <!-- Password -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-gray-900 dark:text-white">{{ $t('profile.password') }}</h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('profile.passwordDescription') }}</p>
          </div>
          <button class="btn-secondary flex items-center gap-2" @click="showPasswordModal = true">
            <span class="material-icons">lock</span>
            {{ $t('profile.changePassword') }}
          </button>
        </div>

        <!-- Two-Factor Authentication -->
        <div class="pt-6 border-t border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                {{ $t('profile.twoFactor.title') }}
                <span
                  v-if="is2FAEnabled"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  {{ $t('common.active') }}
                </span>
              </h3>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('profile.twoFactor.description') }}</p>
            </div>
            <button
              v-if="!is2FAEnabled"
              class="btn-primary flex items-center gap-2"
              @click="startEnable2FA"
            >
              <span class="material-icons">phonelink_lock</span>
              {{ $t('profile.twoFactor.enable') }}
            </button>
            <button
              v-else
              class="btn-danger flex items-center gap-2"
              @click="showDisable2FAModal = true"
            >
              <span class="material-icons">phonelink_erase</span>
              {{ $t('profile.twoFactor.disable') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Sessions -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">devices</span>
          {{ $t('profile.sessions.title') }}
        </h2>
        <button
          v-if="sessions.length > 1"
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
          :disabled="terminatingOthers"
          @click="handleTerminateOthers"
        >
          <span v-if="terminatingOthers" class="material-icons animate-spin text-sm">refresh</span>
          <span class="material-icons text-sm">logout</span>
          {{ $t('profile.sessions.terminateOthers') }}
        </button>
      </div>
      <div class="p-6">
        <div v-if="loadingSessions" class="flex items-center justify-center py-8">
          <span class="material-icons animate-spin text-gray-400">refresh</span>
        </div>
        <div v-else-if="sessions.length === 0" class="text-center py-8 text-gray-500 dark:text-slate-400">
          {{ $t('profile.sessions.noSessions') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="session in sessions"
            :key="session._id"
            class="flex items-center justify-between p-4 rounded-lg"
            :class="session.isCurrent
              ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700'
              : 'bg-gray-50 dark:bg-slate-700'"
          >
            <div class="flex items-center gap-4">
              <!-- Device Icon -->
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center"
                :class="session.isCurrent ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-200 dark:bg-slate-600'"
              >
                <span class="material-icons" :class="session.isCurrent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-slate-400'">
                  {{ getDeviceIcon(session.deviceType) }}
                </span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ session.browser || 'Unknown Browser' }} - {{ session.os || 'Unknown OS' }}
                  </span>
                  <span
                    v-if="session.isCurrent"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200"
                  >
                    {{ $t('profile.sessions.currentSession') }}
                  </span>
                </div>
                <div class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-2">
                  <span>{{ session.ipAddress || '-' }}</span>
                  <span v-if="session.location?.city">- {{ session.location.city }}, {{ session.location.country }}</span>
                </div>
                <div class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                  {{ $t('profile.sessions.lastActivity') }}: {{ formatDate(session.lastActivity) }}
                </div>
              </div>
            </div>
            <button
              v-if="!session.isCurrent"
              class="text-red-600 hover:text-red-700 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              :disabled="terminatingSession === session._id"
              :title="$t('profile.sessions.terminate')"
              @click="handleTerminateSession(session._id)"
            >
              <span v-if="terminatingSession === session._id" class="material-icons animate-spin">refresh</span>
              <span v-else class="material-icons">logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Change Modal -->
    <Modal
      v-model="showPasswordModal"
      :title="$t('profile.changePassword')"
      size="sm"
      @close="closePasswordModal"
    >
      <form class="space-y-4" @submit.prevent="handlePasswordChange">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.currentPassword') }}
          </label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input w-full"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.newPassword') }}
          </label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input w-full"
            required
            minlength="6"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.confirmPassword') }}
          </label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            class="form-input w-full"
            required
          />
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary" @click="closePasswordModal">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="savingPassword"
            class="btn-primary flex items-center gap-2"
            @click="handlePasswordChange"
          >
            <span v-if="savingPassword" class="animate-spin material-icons text-lg">refresh</span>
            {{ $t('common.save') }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Avatar Cropper Modal -->
    <AvatarCropperModal
      v-model="showCropperModal"
      :file="selectedFile"
      :aspect-ratio="1"
      :output-width="300"
      :output-height="300"
      @save="handleCroppedAvatar"
      @close="handleCropperClose"
    />

    <!-- 2FA Enable Modal -->
    <Modal
      v-model="show2FAModal"
      :title="$t('profile.twoFactor.setupTitle')"
      size="md"
      @close="close2FAModal"
    >
      <div class="space-y-6">
        <!-- Step 1: QR Code -->
        <div v-if="twoFactorSetup.step === 1" class="text-center">
          <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
            {{ $t('profile.twoFactor.scanQRCode') }}
          </p>
          <div v-if="twoFactorSetup.qrCode" class="flex justify-center mb-4">
            <img :src="twoFactorSetup.qrCode" alt="QR Code" class="w-48 h-48 rounded-lg border" />
          </div>
          <div v-else class="flex justify-center mb-4">
            <div class="w-48 h-48 rounded-lg border flex items-center justify-center bg-gray-100 dark:bg-slate-700">
              <span class="material-icons animate-spin text-gray-400">refresh</span>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mb-2">
            {{ $t('profile.twoFactor.orEnterCode') }}
          </p>
          <div class="bg-gray-100 dark:bg-slate-700 rounded-lg p-3">
            <code class="text-sm font-mono text-gray-800 dark:text-slate-200 select-all">
              {{ twoFactorSetup.secret }}
            </code>
          </div>
        </div>

        <!-- Step 2: Verify -->
        <div v-if="twoFactorSetup.step === 2">
          <p class="text-sm text-gray-600 dark:text-slate-400 mb-4 text-center">
            {{ $t('profile.twoFactor.enterVerificationCode') }}
          </p>
          <div class="max-w-xs mx-auto">
            <input
              v-model="twoFactorSetup.verifyToken"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              class="form-input w-full text-center text-2xl tracking-widest font-mono"
              :placeholder="$t('profile.twoFactor.codePlaceholder')"
              @keyup.enter="verify2FASetup"
            />
            <p v-if="twoFactorSetup.error" class="text-red-500 text-sm mt-2 text-center">
              {{ twoFactorSetup.error }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between">
          <button
            v-if="twoFactorSetup.step === 2"
            type="button"
            class="btn-secondary"
            @click="twoFactorSetup.step = 1"
          >
            {{ $t('common.back') }}
          </button>
          <div v-else></div>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary" @click="close2FAModal">
              {{ $t('common.cancel') }}
            </button>
            <button
              v-if="twoFactorSetup.step === 1"
              type="button"
              class="btn-primary"
              @click="twoFactorSetup.step = 2"
            >
              {{ $t('common.next') }}
            </button>
            <button
              v-else
              type="button"
              :disabled="verifying2FA || !twoFactorSetup.verifyToken"
              class="btn-primary flex items-center gap-2"
              @click="verify2FASetup"
            >
              <span v-if="verifying2FA" class="material-icons animate-spin text-sm">refresh</span>
              {{ $t('profile.twoFactor.verify') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- 2FA Disable Modal -->
    <Modal
      v-model="showDisable2FAModal"
      :title="$t('profile.twoFactor.disableTitle')"
      size="sm"
      @close="closeDisable2FAModal"
    >
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <span class="material-icons text-amber-500">warning</span>
          <p class="text-sm text-amber-700 dark:text-amber-300">
            {{ $t('profile.twoFactor.disableWarning') }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.twoFactor.enterCodeToDisable') }}
          </label>
          <input
            v-model="disable2FAToken"
            type="text"
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            class="form-input w-full text-center text-xl tracking-widest font-mono"
            :placeholder="$t('profile.twoFactor.codePlaceholder')"
            @keyup.enter="handleDisable2FA"
          />
          <p v-if="disable2FAError" class="text-red-500 text-sm mt-2">
            {{ disable2FAError }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="btn-secondary" @click="closeDisable2FAModal">
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="disabling2FA || !disable2FAToken"
            class="btn-danger flex items-center gap-2"
            @click="handleDisable2FA"
          >
            <span v-if="disabling2FA" class="material-icons animate-spin text-sm">refresh</span>
            {{ $t('profile.twoFactor.disable') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import Modal from '@/components/common/Modal.vue'
import AvatarCropperModal from '@/components/common/AvatarCropperModal.vue'
import authService from '@/services/authService'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { getAvatarUrl } from '@/utils/imageUrl'

const { t, locale } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Async action composables
const { isLoading: savingNotifications, execute: executeSaveNotifications } = useAsyncAction()
const { isLoading: savingPassword, execute: executeSavePassword } = useAsyncAction({ showErrorToast: false })

// Avatar
const avatarUrl = computed(() => getAvatarUrl(authStore.user))

// Avatar cropper modal
const showCropperModal = ref(false)
const selectedFile = ref(null)
const avatarInputRef = ref(null)

const handleAvatarSelect = (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error(t('profile.invalidImageType'))
    e.target.value = ''
    return
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error(t('profile.imageTooLarge'))
    e.target.value = ''
    return
  }

  // Open cropper modal with selected file
  selectedFile.value = file
  showCropperModal.value = true
}

const handleCroppedAvatar = async (croppedFile) => {
  try {
    const result = await authService.uploadAvatar(croppedFile)
    // Update user in store and localStorage
    if (authStore.user) {
      const updatedUser = { ...authStore.user, avatar: result.data.avatar }
      authStore.updateUser(updatedUser)
    }
    toast.success(t('profile.avatarUploaded'))
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }

  // Reset input
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
  selectedFile.value = null
}

const handleCropperClose = () => {
  showCropperModal.value = false
  selectedFile.value = null
  if (avatarInputRef.value) {
    avatarInputRef.value.value = ''
  }
}

const handleAvatarDelete = async () => {
  if (!confirm(t('profile.deleteAvatarConfirm'))) return

  try {
    await authService.deleteAvatar()
    // Update user in store and localStorage
    if (authStore.user) {
      const updatedUser = { ...authStore.user, avatar: null }
      authStore.updateUser(updatedUser)
    }
    toast.success(t('profile.avatarDeleted'))
  } catch (error) {
    toast.error(t('common.operationFailed'))
  }
}

// Languages
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
]

const currentLocale = computed(() => locale.value)

const changeLanguage = lang => {
  locale.value = lang
  localStorage.setItem('language', lang)
  toast.success(t('profile.languageChanged'))
}

// Notification Preferences
const notificationPreferences = reactive({
  email: {
    bookingConfirmation: true,
    bookingCancellation: true,
    bookingReminder: true,
    paymentReminder: true,
    promotions: false,
    systemUpdates: true
  },
  sms: {
    bookingConfirmation: true,
    bookingCancellation: true,
    bookingReminder: false,
    paymentReminder: false
  },
  push: {
    bookingConfirmation: true,
    bookingCancellation: true,
    bookingReminder: true,
    paymentReminder: true,
    systemUpdates: true
  }
})

const loadNotificationPreferences = () => {
  const userPrefs = authStore.user?.notificationPreferences
  if (userPrefs) {
    if (userPrefs.email) {
      Object.assign(notificationPreferences.email, userPrefs.email)
    }
    if (userPrefs.sms) {
      Object.assign(notificationPreferences.sms, userPrefs.sms)
    }
    if (userPrefs.push) {
      Object.assign(notificationPreferences.push, userPrefs.push)
    }
  }
}

const toggleNotification = (channel, key) => {
  notificationPreferences[channel][key] = !notificationPreferences[channel][key]
}

const saveNotificationPreferences = async () => {
  await executeSaveNotifications(
    () => authService.updateNotificationPreferences({
      email: notificationPreferences.email,
      sms: notificationPreferences.sms,
      push: notificationPreferences.push
    }),
    {
      successMessage: 'profile.notifications.saved',
      errorMessage: 'common.operationFailed'
    }
  )
}

// Helpers
const getInitials = name => {
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getRoleName = () => {
  const role = authStore.user?.role
  const roleNames = {
    platformAdmin: t('user.roles.platformAdmin'),
    partnerAdmin: t('user.roles.partnerAdmin'),
    agencyAdmin: t('user.roles.agencyAdmin'),
    agencyUser: t('user.roles.agencyUser')
  }
  return roleNames[role] || role
}

// Password change
const showPasswordModal = ref(false)
const passwordError = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
}

const handlePasswordChange = async () => {
  passwordError.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('profile.passwordMismatch')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = t('profile.passwordTooShort')
    return
  }

  await executeSavePassword(
    () => authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    {
      successMessage: 'profile.passwordChanged',
      onSuccess: () => closePasswordModal(),
      onError: error => {
        const message = error.response?.data?.message
        if (message === 'INVALID_PASSWORD') {
          passwordError.value = t('profile.invalidCurrentPassword')
        } else {
          toast.error(t('common.operationFailed'))
        }
      }
    }
  )
}

// ==================== Two-Factor Authentication ====================
const is2FAEnabled = computed(() => authStore.user?.twoFactorEnabled || false)
const show2FAModal = ref(false)
const showDisable2FAModal = ref(false)
const verifying2FA = ref(false)
const disabling2FA = ref(false)
const disable2FAToken = ref('')
const disable2FAError = ref('')

const twoFactorSetup = reactive({
  step: 1,
  qrCode: null,
  secret: null,
  verifyToken: '',
  error: ''
})

const startEnable2FA = async () => {
  try {
    twoFactorSetup.step = 1
    twoFactorSetup.qrCode = null
    twoFactorSetup.secret = null
    twoFactorSetup.verifyToken = ''
    twoFactorSetup.error = ''
    show2FAModal.value = true

    const result = await authService.enable2FA()
    twoFactorSetup.qrCode = result.data.qrCode
    twoFactorSetup.secret = result.data.secret
  } catch (error) {
    toast.error(t('common.operationFailed'))
    show2FAModal.value = false
  }
}

const verify2FASetup = async () => {
  if (!twoFactorSetup.verifyToken || twoFactorSetup.verifyToken.length !== 6) {
    twoFactorSetup.error = t('profile.twoFactor.invalidCode')
    return
  }

  verifying2FA.value = true
  twoFactorSetup.error = ''

  try {
    await authService.verify2FASetup(twoFactorSetup.verifyToken)

    // Update user in store
    if (authStore.user) {
      authStore.updateUser({ ...authStore.user, twoFactorEnabled: true })
    }

    toast.success(t('profile.twoFactor.enabledSuccess'))
    show2FAModal.value = false
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'INVALID_2FA_TOKEN') {
      twoFactorSetup.error = t('profile.twoFactor.invalidCode')
    } else {
      twoFactorSetup.error = t('common.operationFailed')
    }
  } finally {
    verifying2FA.value = false
  }
}

const close2FAModal = () => {
  show2FAModal.value = false
  twoFactorSetup.step = 1
  twoFactorSetup.qrCode = null
  twoFactorSetup.secret = null
  twoFactorSetup.verifyToken = ''
  twoFactorSetup.error = ''
}

const handleDisable2FA = async () => {
  if (!disable2FAToken.value || disable2FAToken.value.length !== 6) {
    disable2FAError.value = t('profile.twoFactor.invalidCode')
    return
  }

  disabling2FA.value = true
  disable2FAError.value = ''

  try {
    await authService.disable2FA(disable2FAToken.value)

    // Update user in store
    if (authStore.user) {
      authStore.updateUser({ ...authStore.user, twoFactorEnabled: false })
    }

    toast.success(t('profile.twoFactor.disabledSuccess'))
    showDisable2FAModal.value = false
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'INVALID_2FA_TOKEN') {
      disable2FAError.value = t('profile.twoFactor.invalidCode')
    } else {
      disable2FAError.value = t('common.operationFailed')
    }
  } finally {
    disabling2FA.value = false
  }
}

const closeDisable2FAModal = () => {
  showDisable2FAModal.value = false
  disable2FAToken.value = ''
  disable2FAError.value = ''
}

// ==================== Session Management ====================
const sessions = ref([])
const loadingSessions = ref(false)
const terminatingSession = ref(null)
const terminatingOthers = ref(false)

const loadSessions = async () => {
  loadingSessions.value = true
  try {
    const result = await authService.getMySessions()
    sessions.value = result.data || []
  } catch (error) {
    console.error('Failed to load sessions:', error)
    sessions.value = []
  } finally {
    loadingSessions.value = false
  }
}

const handleTerminateSession = async (sessionId) => {
  if (!confirm(t('profile.sessions.terminateConfirm'))) return

  terminatingSession.value = sessionId
  try {
    await authService.terminateSession(sessionId)
    toast.success(t('profile.sessions.terminated'))
    sessions.value = sessions.value.filter(s => s._id !== sessionId)
  } catch (error) {
    toast.error(t('common.operationFailed'))
  } finally {
    terminatingSession.value = null
  }
}

const handleTerminateOthers = async () => {
  if (!confirm(t('profile.sessions.terminateOthersConfirm'))) return

  terminatingOthers.value = true
  try {
    await authService.terminateOtherSessions()
    toast.success(t('profile.sessions.othersTerminated'))
    // Keep only current session
    sessions.value = sessions.value.filter(s => s.isCurrent)
  } catch (error) {
    toast.error(t('common.operationFailed'))
  } finally {
    terminatingOthers.value = false
  }
}

const getDeviceIcon = (deviceType) => {
  const icons = {
    desktop: 'computer',
    mobile: 'smartphone',
    tablet: 'tablet_android',
    unknown: 'devices'
  }
  return icons[deviceType] || icons.unknown
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load sessions on mount
onMounted(() => {
  loadNotificationPreferences()
  loadSessions()
})
</script>
