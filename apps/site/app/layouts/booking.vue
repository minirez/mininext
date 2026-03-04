<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
