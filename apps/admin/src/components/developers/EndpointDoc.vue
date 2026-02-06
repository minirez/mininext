<template>
  <div class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3">
        <span :class="methodClass">{{ method }}</span>
        <code class="text-sm text-gray-800 dark:text-white font-medium">{{ path }}</code>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-600 dark:text-slate-400">{{ title }}</span>
        <span
          class="material-icons text-gray-400 transition-transform"
          :class="{ 'rotate-180': isExpanded }"
        >
          expand_more
        </span>
      </div>
    </div>

    <!-- Content -->
    <div v-if="isExpanded" class="p-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
      <!-- Description -->
      <p class="text-gray-600 dark:text-slate-400">{{ description }}</p>

      <!-- Path Parameters -->
      <div v-if="pathParams?.length" class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Path Parameters</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 dark:text-slate-400">
                <th class="pb-2 pr-4">Name</th>
                <th class="pb-2 pr-4">Type</th>
                <th class="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="param in pathParams"
                :key="param.name"
                class="border-t border-gray-100 dark:border-slate-700"
              >
                <td class="py-2 pr-4">
                  <code class="text-purple-600 dark:text-purple-400">{{ param.name }}</code>
                  <span v-if="param.required" class="text-red-500 ml-1">*</span>
                </td>
                <td class="py-2 pr-4 text-gray-600 dark:text-slate-400">{{ param.type }}</td>
                <td class="py-2 text-gray-600 dark:text-slate-400">{{ param.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Query Parameters -->
      <div v-if="queryParams?.length" class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Query Parameters</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 dark:text-slate-400">
                <th class="pb-2 pr-4">Name</th>
                <th class="pb-2 pr-4">Type</th>
                <th class="pb-2 pr-4">Required</th>
                <th class="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="param in queryParams"
                :key="param.name"
                class="border-t border-gray-100 dark:border-slate-700"
              >
                <td class="py-2 pr-4">
                  <code class="text-purple-600 dark:text-purple-400">{{ param.name }}</code>
                </td>
                <td class="py-2 pr-4 text-gray-600 dark:text-slate-400">{{ param.type }}</td>
                <td class="py-2 pr-4">
                  <span
                    v-if="param.required"
                    class="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded"
                    >required</span
                  >
                  <span
                    v-else
                    class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 rounded"
                    >optional</span
                  >
                </td>
                <td class="py-2 text-gray-600 dark:text-slate-400">{{ param.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Body Parameters -->
      <div v-if="bodyParams?.length" class="space-y-2">
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Request Body</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left text-gray-500 dark:text-slate-400">
                <th class="pb-2 pr-4">Field</th>
                <th class="pb-2 pr-4">Type</th>
                <th class="pb-2 pr-4">Required</th>
                <th class="pb-2">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="param in bodyParams"
                :key="param.name"
                class="border-t border-gray-100 dark:border-slate-700"
              >
                <td class="py-2 pr-4">
                  <code class="text-purple-600 dark:text-purple-400">{{ param.name }}</code>
                </td>
                <td class="py-2 pr-4 text-gray-600 dark:text-slate-400">{{ param.type }}</td>
                <td class="py-2 pr-4">
                  <span
                    v-if="param.required"
                    class="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded"
                    >required</span
                  >
                  <span
                    v-else
                    class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400 rounded"
                    >optional</span
                  >
                </td>
                <td class="py-2 text-gray-600 dark:text-slate-400">{{ param.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Request Example -->
      <div v-if="requestExample" class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Request Example</h4>
          <button
            class="text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
            @click="copyToClipboard(requestExample)"
          >
            <span class="material-icons text-sm">content_copy</span>
            Copy
          </button>
        </div>
        <div class="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre class="text-green-400 text-sm"><code>{{ requestExample }}</code></pre>
        </div>
      </div>

      <!-- Response Example -->
      <div v-if="responseExample" class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white">Response Example</h4>
          <button
            class="text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
            @click="copyToClipboard(responseExample)"
          >
            <span class="material-icons text-sm">content_copy</span>
            Copy
          </button>
        </div>
        <div class="bg-slate-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
          <pre class="text-cyan-400 text-sm"><code>{{ responseExample }}</code></pre>
        </div>
      </div>

      <!-- Try It (cURL) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-800 dark:text-white">cURL</h4>
          <button
            class="text-xs text-gray-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1"
            @click="copyToClipboard(curlExample)"
          >
            <span class="material-icons text-sm">content_copy</span>
            Copy
          </button>
        </div>
        <div class="bg-slate-900 rounded-lg p-4 overflow-x-auto">
          <pre class="text-yellow-400 text-sm"><code>{{ curlExample }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'

const props = defineProps({
  method: { type: String, required: true },
  path: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  pathParams: { type: Array, default: () => [] },
  queryParams: { type: Array, default: () => [] },
  bodyParams: { type: Array, default: () => [] },
  requestExample: { type: String, default: '' },
  responseExample: { type: String, default: '' }
})

const toast = useToast()
const isExpanded = ref(false)

const methodClass = computed(() => {
  const base = 'px-2 py-1 rounded text-xs font-bold uppercase'
  switch (props.method.toUpperCase()) {
    case 'GET':
      return `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
    case 'POST':
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`
    case 'PUT':
      return `${base} bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400`
    case 'PATCH':
      return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400`
    case 'DELETE':
      return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`
    default:
      return `${base} bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300`
  }
})

const baseUrl = computed(() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.maxirez.com/api'
  return `${apiUrl}/public`
})

const curlExample = computed(() => {
  const url = `${baseUrl.value}${props.path}`

  if (props.method.toUpperCase() === 'GET') {
    if (props.queryParams?.length) {
      const params = props.queryParams
        .filter(p => p.required)
        .map(p => `${p.name}=<value>`)
        .join('&')
      return `curl -X GET "${url}${params ? '?' + params : ''}"`
    }
    return `curl -X GET "${url}"`
  }

  if (props.requestExample) {
    const body = props.requestExample.replace(/\n/g, ' ').replace(/\s+/g, ' ')
    return `curl -X ${props.method.toUpperCase()} "${url}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`
  }

  return `curl -X ${props.method.toUpperCase()} "${url}" \\
  -H "Content-Type: application/json" \\
  -d '{}'`
})

const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Failed to copy')
  }
}
</script>
