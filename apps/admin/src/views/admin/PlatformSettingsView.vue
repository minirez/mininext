<template>
	<div class="space-y-6">
		<!-- Save Button -->
		<div class="flex justify-end">
			<button
				@click="saveSettings"
				:disabled="saving"
				class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
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

		<!-- Settings Cards -->
		<div v-else class="grid gap-6">
			<!-- AWS SES Email Settings -->
			<div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
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
						<input type="checkbox" v-model="settings.aws.ses.enabled" class="sr-only peer">
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
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
								type="password"
								v-model="settings.aws.ses.accessKeyId"
								:placeholder="settings.aws.ses.accessKeyId ? '********' : ''"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.email.secretAccessKey') }}
							</label>
							<input
								type="password"
								v-model="settings.aws.ses.secretAccessKey"
								:placeholder="settings.aws.ses.secretAccessKey ? '********' : ''"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.email.fromEmail') }}
							</label>
							<input
								type="email"
								v-model="settings.aws.ses.fromEmail"
								placeholder="noreply@example.com"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.email.fromName') }}
							</label>
							<input
								type="text"
								v-model="settings.aws.ses.fromName"
								placeholder="Booking Platform"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
					</div>
					<!-- Test Email Button -->
					<div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
						<input
							type="email"
							v-model="testEmailAddress"
							:placeholder="$t('platformSettings.email.testEmailPlaceholder')"
							class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
						>
						<button
							@click="sendTestEmail"
							:disabled="!testEmailAddress || testingEmail"
							class="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
						>
							<span v-if="testingEmail" class="material-icons animate-spin text-sm">refresh</span>
							<span v-else class="material-icons text-sm">send</span>
							{{ $t('platformSettings.email.sendTest') }}
						</button>
					</div>
				</div>
			</div>

			<!-- NetGSM SMS Settings -->
			<div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
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
						<input type="checkbox" v-model="settings.netgsm.enabled" class="sr-only peer">
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
					</label>
				</div>
				<div v-if="settings.netgsm.enabled" class="p-6 space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.sms.usercode') }}
							</label>
							<input
								type="password"
								v-model="settings.netgsm.usercode"
								:placeholder="settings.netgsm.usercode ? '********' : ''"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.sms.password') }}
							</label>
							<input
								type="password"
								v-model="settings.netgsm.password"
								:placeholder="settings.netgsm.password ? '********' : ''"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.sms.msgheader') }}
							</label>
							<input
								type="text"
								v-model="settings.netgsm.msgheader"
								placeholder="BOOKING"
								maxlength="11"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
							<p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
								{{ $t('platformSettings.sms.msgheaderHint') }}
							</p>
						</div>
					</div>
					<!-- Test SMS Button -->
					<div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
						<input
							type="tel"
							v-model="testPhoneNumber"
							:placeholder="$t('platformSettings.sms.testPhonePlaceholder')"
							class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
						>
						<button
							@click="sendTestSMS"
							:disabled="!testPhoneNumber || testingSMS"
							class="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
						>
							<span v-if="testingSMS" class="material-icons animate-spin text-sm">refresh</span>
							<span v-else class="material-icons text-sm">send</span>
							{{ $t('platformSettings.sms.sendTest') }}
						</button>
					</div>
				</div>
			</div>

			<!-- Gemini AI Settings -->
			<div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
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
						<input type="checkbox" v-model="settings.gemini.enabled" class="sr-only peer">
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
					</label>
				</div>
				<div v-if="settings.gemini.enabled" class="p-6 space-y-4">
					<div class="grid grid-cols-1 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.gemini.apiKey') }}
							</label>
							<input
								type="password"
								v-model="settings.gemini.apiKey"
								:placeholder="settings.gemini.apiKey ? '********' : 'AIzaSy...'"
								autocomplete="off"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
							<p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
								{{ $t('platformSettings.gemini.apiKeyHint') }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Web Push Settings -->
			<div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
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
						<input type="checkbox" v-model="settings.webPush.enabled" class="sr-only peer">
						<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
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
									type="text"
									v-model="settings.webPush.publicKey"
									readonly
									class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white font-mono text-sm"
								>
								<button
									@click="copyToClipboard(settings.webPush.publicKey)"
									class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600"
									:title="$t('common.copy')"
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
								type="password"
								v-model="settings.webPush.privateKey"
								:placeholder="settings.webPush.privateKey ? '********' : ''"
								readonly
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
								{{ $t('platformSettings.push.contactEmail') }}
							</label>
							<input
								type="email"
								v-model="settings.webPush.contactEmail"
								placeholder="admin@example.com"
								class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
							>
						</div>
					</div>
					<!-- Generate VAPID Keys Button -->
					<div class="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
						<button
							@click="generateVAPID"
							:disabled="generatingVAPID"
							class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
						>
							<span v-if="generatingVAPID" class="material-icons animate-spin text-sm">refresh</span>
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
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import platformSettingsService from '@/services/platformSettingsService'

const { t } = useI18n()
const toast = useToast()

// State
const loading = ref(true)
const saving = ref(false)
const testingEmail = ref(false)
const testingSMS = ref(false)
const generatingVAPID = ref(false)

const testEmailAddress = ref('')
const testPhoneNumber = ref('')

const settings = ref({
	aws: {
		ses: {
			enabled: false,
			region: 'eu-west-1',
			accessKeyId: '',
			secretAccessKey: '',
			fromEmail: '',
			fromName: ''
		}
	},
	netgsm: {
		enabled: false,
		usercode: '',
		password: '',
		msgheader: ''
	},
	gemini: {
		enabled: false,
		apiKey: ''
	},
	webPush: {
		enabled: false,
		publicKey: '',
		privateKey: '',
		contactEmail: ''
	}
})

// Load settings
const loadSettings = async () => {
	try {
		loading.value = true
		const data = await platformSettingsService.getSettings()

		// Merge with defaults
		settings.value = {
			aws: {
				ses: {
					enabled: data.aws?.ses?.enabled || false,
					region: data.aws?.ses?.region || 'eu-west-1',
					accessKeyId: '', // Don't show masked value
					secretAccessKey: '', // Don't show masked value
					fromEmail: data.aws?.ses?.fromEmail || '',
					fromName: data.aws?.ses?.fromName || ''
				}
			},
			netgsm: {
				enabled: data.netgsm?.enabled || false,
				usercode: '', // Don't show masked value
				password: '', // Don't show masked value
				msgheader: data.netgsm?.msgheader || ''
			},
			gemini: {
				enabled: data.gemini?.enabled || false,
				apiKey: '' // Don't show masked value
			},
			webPush: {
				enabled: data.webPush?.enabled || false,
				publicKey: data.webPush?.publicKey || '',
				privateKey: '', // Don't show masked value
				contactEmail: data.webPush?.contactEmail || ''
			}
		}
	} catch (error) {
		toast.error(t('common.error') + ': ' + error.message)
	} finally {
		loading.value = false
	}
}

// Save settings
const saveSettings = async () => {
	try {
		saving.value = true

		// Build update object - only include non-empty credential fields
		const update = {
			aws: {
				ses: {
					enabled: settings.value.aws.ses.enabled,
					region: settings.value.aws.ses.region,
					fromEmail: settings.value.aws.ses.fromEmail,
					fromName: settings.value.aws.ses.fromName
				}
			},
			netgsm: {
				enabled: settings.value.netgsm.enabled,
				msgheader: settings.value.netgsm.msgheader
			},
			gemini: {
				enabled: settings.value.gemini.enabled
			},
			webPush: {
				enabled: settings.value.webPush.enabled,
				publicKey: settings.value.webPush.publicKey,
				contactEmail: settings.value.webPush.contactEmail
			}
		}

		// Only include credentials if they were changed
		if (settings.value.aws.ses.accessKeyId) {
			update.aws.ses.accessKeyId = settings.value.aws.ses.accessKeyId
		}
		if (settings.value.aws.ses.secretAccessKey) {
			update.aws.ses.secretAccessKey = settings.value.aws.ses.secretAccessKey
		}
		if (settings.value.netgsm.usercode) {
			update.netgsm.usercode = settings.value.netgsm.usercode
		}
		if (settings.value.netgsm.password) {
			update.netgsm.password = settings.value.netgsm.password
		}
		if (settings.value.gemini.apiKey) {
			update.gemini.apiKey = settings.value.gemini.apiKey
		}
		if (settings.value.webPush.privateKey) {
			update.webPush.privateKey = settings.value.webPush.privateKey
		}

		await platformSettingsService.updateSettings(update)
		toast.success(t('platformSettings.saved'))

		// Reload to get updated values
		await loadSettings()
	} catch (error) {
		toast.error(t('common.error') + ': ' + error.message)
	} finally {
		saving.value = false
	}
}

// Send test email
const sendTestEmail = async () => {
	try {
		testingEmail.value = true
		await platformSettingsService.testEmail(testEmailAddress.value)
		toast.success(t('platformSettings.email.testSent'))
	} catch (error) {
		toast.error(error.response?.data?.error || error.message)
	} finally {
		testingEmail.value = false
	}
}

// Send test SMS
const sendTestSMS = async () => {
	try {
		testingSMS.value = true
		await platformSettingsService.testSMS(testPhoneNumber.value)
		toast.success(t('platformSettings.sms.testSent'))
	} catch (error) {
		toast.error(error.response?.data?.error || error.message)
	} finally {
		testingSMS.value = false
	}
}

// Generate VAPID keys
const generateVAPID = async () => {
	try {
		generatingVAPID.value = true
		const keys = await platformSettingsService.generateVAPIDKeys()
		settings.value.webPush.publicKey = keys.publicKey
		settings.value.webPush.privateKey = keys.privateKey
		toast.success(t('platformSettings.push.keysGenerated'))
	} catch (error) {
		toast.error(error.response?.data?.error || error.message)
	} finally {
		generatingVAPID.value = false
	}
}

// Copy to clipboard
const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text)
		toast.success(t('common.copied'))
	} catch {
		toast.error(t('common.copyFailed'))
	}
}

onMounted(() => {
	loadSettings()
})
</script>
