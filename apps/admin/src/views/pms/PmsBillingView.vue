<template>
  <div class="space-y-6">
    <!-- Action Button -->
    <div class="flex justify-end">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
      >
        <span class="material-icons text-lg">receipt</span>
        Yeni Fatura
      </button>
    </div>

    <!-- Coming Soon Card -->
    <div
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center"
    >
      <div
        class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-4xl text-emerald-600 dark:text-emerald-400"
          >receipt_long</span
        >
      </div>
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Faturalandirma Modulu
      </h2>
      <p class="text-gray-500 dark:text-slate-400 max-w-md mx-auto">
        Faturalandirma modulu yakin zamanda aktif olacak. Burada misafir hesaplarini, odeme
        islemlerini ve faturalarini yonetebileceksiniz.
      </p>
    </div>
  </div>
</template>

<script setup>
// Admin has full hotel access - no permission checks needed
</script>
