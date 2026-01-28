<template>
  <div class="space-y-8">
    <!-- Info Notice -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3"
    >
      <span class="material-icons text-blue-500 dark:text-blue-400 mt-0.5">info</span>
      <div>
        <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200">
          {{ $t('hotels.linkedHotel.notice') }}
        </h4>
        <p class="text-sm text-blue-600 dark:text-blue-300 mt-1">
          {{ $t('hotels.linkedHotel.description') }}
        </p>
      </div>
    </div>

    <!-- Basic Information -->
    <section
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">info</span>
          {{ $t('hotels.basic.title') }}
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Hotel Name -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.hotelName')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white font-medium">{{ hotel.name || '-' }}</p>
          </div>

          <!-- Stars -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.stars')
            }}</label>
            <div class="mt-1 flex items-center gap-1">
              <span
                v-for="n in hotel.stars || 0"
                :key="n"
                class="material-icons text-yellow-500 text-lg"
                >star</span
              >
              <span
                v-for="n in 5 - (hotel.stars || 0)"
                :key="'empty-' + n"
                class="material-icons text-gray-300 dark:text-slate-600 text-lg"
                >star_border</span
              >
            </div>
          </div>

          <!-- Type -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.type')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.type ? $t(`hotels.types.${hotel.type}`) : '-' }}
            </p>
          </div>

          <!-- Category -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.category')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.category ? $t(`hotels.categories.${hotel.category}`) : '-' }}
            </p>
          </div>

          <!-- Slug -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.slug')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white font-mono text-sm">
              {{ hotel.slug || '-' }}
            </p>
          </div>

          <!-- Tags -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.tags')
            }}</label>
            <div class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="tag in hotel.tags || []"
                :key="tag"
                class="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs"
              >
                {{ tag }}
              </span>
              <span v-if="!hotel.tags?.length" class="text-gray-400">-</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.basic.description')
          }}</label>
          <p class="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
            {{ getLocalizedText(hotel.description) || '-' }}
          </p>
        </div>

        <!-- Logo -->
        <div v-if="hotel.logo" class="mt-6">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.basic.logo')
          }}</label>
          <div class="mt-2">
            <img
              :src="getImageUrl(hotel.logo)"
              alt="Hotel Logo"
              class="w-24 h-24 object-contain bg-gray-100 dark:bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        <!-- Room Config -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.totalRooms')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.roomConfig?.totalRooms || '-' }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.floors')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.roomConfig?.floors || '-' }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.basic.hasElevator')
            }}</label>
            <p class="mt-1">
              <span
                v-if="hotel.roomConfig?.hasElevator"
                class="text-green-600 dark:text-green-400 flex items-center gap-1"
              >
                <span class="material-icons text-sm">check_circle</span> {{ $t('common.yes') }}
              </span>
              <span v-else class="text-gray-400">{{ $t('common.no') }}</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Information -->
    <section
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">contact_phone</span>
          {{ $t('hotels.contact.title') }}
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.contact.phone')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.contact?.phone || '-' }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.contact.email')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.contact?.email || '-' }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.contact.website')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              <a
                v-if="hotel.contact?.website"
                :href="hotel.contact.website"
                target="_blank"
                class="text-purple-600 hover:underline"
              >
                {{ hotel.contact.website }}
              </a>
              <span v-else>-</span>
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.contact.callCenter')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.contact?.callCenter || '-' }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.contact.fax')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.contact?.fax || '-' }}</p>
          </div>
        </div>

        <!-- Authorized Person -->
        <div
          v-if="hotel.contact?.authorizedPerson"
          class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600"
        >
          <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
            {{ $t('hotels.contact.authorizedContacts') }}
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
                $t('hotels.contact.authorizedPerson')
              }}</label>
              <p class="mt-1 text-gray-800 dark:text-white">
                {{ hotel.contact?.authorizedPerson || '-' }}
              </p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
                $t('hotels.contact.authorizedEmail')
              }}</label>
              <p class="mt-1 text-gray-800 dark:text-white">
                {{ hotel.contact?.authorizedEmail || '-' }}
              </p>
            </div>
            <div>
              <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
                $t('hotels.contact.authorizedPhone')
              }}</label>
              <p class="mt-1 text-gray-800 dark:text-white">
                {{ hotel.contact?.authorizedPhone || '-' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Social Media -->
        <div v-if="hasSocialMedia" class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
          <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
            {{ $t('hotels.contact.socialMedia') }}
          </h4>
          <div class="flex flex-wrap gap-4">
            <a
              v-if="hotel.contact?.socialMedia?.facebook"
              :href="hotel.contact.socialMedia.facebook"
              target="_blank"
              class="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
              Facebook
            </a>
            <a
              v-if="hotel.contact?.socialMedia?.instagram"
              :href="hotel.contact.socialMedia.instagram"
              target="_blank"
              class="flex items-center gap-2 text-pink-600 hover:underline"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                />
              </svg>
              Instagram
            </a>
            <a
              v-if="hotel.contact?.socialMedia?.twitter"
              :href="hotel.contact.socialMedia.twitter"
              target="_blank"
              class="flex items-center gap-2 text-gray-800 dark:text-white hover:underline"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
              X
            </a>
            <a
              v-if="hotel.contact?.socialMedia?.youtube"
              :href="hotel.contact.socialMedia.youtube"
              target="_blank"
              class="flex items-center gap-2 text-red-600 hover:underline"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
              </svg>
              YouTube
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Address & Location -->
    <section
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">location_on</span>
          {{ $t('hotels.address.title') }}
        </h3>
      </div>
      <div class="p-6">
        <!-- Hierarchical Location -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.address.country')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.location?.countryCode || '-' }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.address.city')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ getCityName() }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('locations.tourismRegions')
            }}</label>
            <div class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="region in getRegionNames()"
                :key="region"
                class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
              >
                {{ region }}
              </span>
              <span v-if="!getRegionNames().length" class="text-gray-400">-</span>
            </div>
          </div>
        </div>

        <!-- Street Address -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.address.street')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">{{ hotel.address?.street || '-' }}</p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.address.formattedAddress')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.address?.formattedAddress || '-' }}
            </p>
          </div>
        </div>

        <!-- Coordinates & Map -->
        <div v-if="hotel.address?.coordinates?.lat && hotel.address?.coordinates?.lng">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.address.coordinates')
          }}</label>
          <p class="mt-1 text-gray-800 dark:text-white font-mono text-sm mb-4">
            {{ hotel.address.coordinates.lat.toFixed(6) }},
            {{ hotel.address.coordinates.lng.toFixed(6) }}
          </p>
          <div class="h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
            <div ref="mapContainer" class="w-full h-full"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery -->
    <section
      v-if="hotel.images?.length"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">photo_library</span>
          {{ $t('hotels.gallery.title') }}
          <span class="text-sm font-normal text-gray-500 dark:text-slate-400"
            >({{ hotel.images.length }})</span
          >
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(image, index) in hotel.images"
            :key="image._id || index"
            class="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 aspect-[4/3] cursor-pointer group"
            @click="openLightbox(index)"
          >
            <img
              :src="getImageUrl(image.url)"
              :alt="getLocalizedText(image.caption) || `Image ${index + 1}`"
              class="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
            >
              <span
                class="material-icons text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                >zoom_in</span
              >
            </div>
            <div
              v-if="image.isMain"
              class="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded"
            >
              {{ $t('hotels.gallery.isMain') }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        @click.self="closeLightbox"
      >
        <!-- Close button -->
        <button
          class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          @click="closeLightbox"
        >
          <span class="material-icons text-3xl">close</span>
        </button>

        <!-- Navigation buttons -->
        <button
          v-if="hotel.images.length > 1"
          class="absolute left-4 text-white hover:text-gray-300 transition-colors"
          @click="prevImage"
        >
          <span class="material-icons text-4xl">chevron_left</span>
        </button>
        <button
          v-if="hotel.images.length > 1"
          class="absolute right-4 text-white hover:text-gray-300 transition-colors"
          @click="nextImage"
        >
          <span class="material-icons text-4xl">chevron_right</span>
        </button>

        <!-- Image -->
        <img
          :src="getImageUrl(hotel.images[lightboxIndex]?.url)"
          :alt="getLocalizedText(hotel.images[lightboxIndex]?.caption) || 'Image'"
          class="max-h-[90vh] max-w-[90vw] object-contain"
        />

        <!-- Counter -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {{ lightboxIndex + 1 }} / {{ hotel.images.length }}
        </div>
      </div>
    </Teleport>

    <!-- Amenities -->
    <section
      v-if="hotel.amenities?.length"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">check_circle</span>
          {{ $t('hotels.amenities.title') }}
          <span class="text-sm font-normal text-gray-500 dark:text-slate-400"
            >({{ hotel.amenities.length }})</span
          >
        </h3>
      </div>
      <div class="p-6">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="amenity in hotel.amenities"
            :key="amenity"
            class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-1"
          >
            <span class="material-icons text-sm">check</span>
            {{ $t(`hotels.amenities.${amenity}`) }}
          </span>
        </div>
      </div>
    </section>

    <!-- Policies -->
    <section
      v-if="hotel.policies"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">policy</span>
          {{ $t('hotels.policies.title') }}
        </h3>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.checkIn')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white font-medium">
              {{ hotel.policies.checkIn || '14:00' }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.checkOut')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white font-medium">
              {{ hotel.policies.checkOut || '12:00' }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.maxBabyAge')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.policies.maxBabyAge ?? 2 }} {{ $t('hotels.policies.years') }}
            </p>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.maxChildAge')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white">
              {{ hotel.policies.maxChildAge ?? 12 }} {{ $t('hotels.policies.years') }}
            </p>
          </div>
        </div>

        <!-- Cancellation Rules -->
        <div
          v-if="hotel.policies.cancellationRules?.length"
          class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600"
        >
          <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
            {{ $t('hotels.policies.cancellation') }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="(rule, index) in hotel.policies.cancellationRules"
              :key="index"
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div
                class="w-3 h-3 rounded-full"
                :class="
                  rule.refundPercent === 100
                    ? 'bg-green-500'
                    : rule.refundPercent > 0
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                "
              ></div>
              <span class="text-sm text-gray-700 dark:text-slate-300">
                {{ rule.daysBeforeCheckIn }}+ {{ $t('hotels.policies.days') }}
              </span>
              <span class="material-icons text-gray-400 text-sm">arrow_forward</span>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                    rule.refundPercent === 100,
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                    rule.refundPercent > 0 && rule.refundPercent < 100,
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                    rule.refundPercent === 0
                }"
              >
                {{ rule.refundPercent }}% {{ $t('hotels.policies.refund') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Policy Texts -->
        <div
          v-if="
            getLocalizedText(hotel.policies.childPolicy) ||
            getLocalizedText(hotel.policies.petPolicy)
          "
          class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-600 space-y-4"
        >
          <div v-if="getLocalizedText(hotel.policies.childPolicy)">
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.childPolicy')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
              {{ getLocalizedText(hotel.policies.childPolicy) }}
            </p>
          </div>
          <div v-if="getLocalizedText(hotel.policies.petPolicy)">
            <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
              $t('hotels.policies.petPolicy')
            }}</label>
            <p class="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
              {{ getLocalizedText(hotel.policies.petPolicy) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- SEO Settings -->
    <section
      v-if="hotel.seo"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">search</span>
          {{ $t('hotels.tabs.seo') }}
        </h3>
      </div>
      <div class="p-6 space-y-4">
        <!-- SEO Title -->
        <div v-if="getLocalizedText(hotel.seo.title)">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.seo.metaTitle')
          }}</label>
          <p class="mt-1 text-gray-800 dark:text-white">{{ getLocalizedText(hotel.seo.title) }}</p>
        </div>

        <!-- SEO Description -->
        <div v-if="getLocalizedText(hotel.seo.description)">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.seo.metaDescription')
          }}</label>
          <p class="mt-1 text-gray-800 dark:text-white whitespace-pre-wrap">
            {{ getLocalizedText(hotel.seo.description) }}
          </p>
        </div>

        <!-- SEO Keywords -->
        <div v-if="getLocalizedText(hotel.seo.keywords)">
          <label class="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">{{
            $t('hotels.seo.keywords')
          }}</label>
          <p class="mt-1 text-gray-800 dark:text-white">
            {{ getLocalizedText(hotel.seo.keywords) }}
          </p>
        </div>

        <!-- Empty state -->
        <div
          v-if="
            !getLocalizedText(hotel.seo.title) &&
            !getLocalizedText(hotel.seo.description) &&
            !getLocalizedText(hotel.seo.keywords)
          "
          class="text-center py-4"
        >
          <span class="material-icons text-3xl text-gray-300 dark:text-slate-600">search_off</span>
          <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {{ $t('hotels.seo.noSeoData') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Profile Sections -->
    <section
      v-if="hotel.profile"
      class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
      >
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">description</span>
          {{ $t('hotels.profile.title') }}
        </h3>
      </div>
      <div class="divide-y divide-gray-200 dark:divide-slate-600">
        <!-- Overview -->
        <ProfileDisplaySection
          v-if="hotel.profile.overview"
          :title="$t('hotels.profile.sections.overview')"
          icon="info"
          :content="getLocalizedText(hotel.profile.overview.content)"
          :features="[]"
        >
          <template #extra>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div v-if="hotel.profile.overview.establishedYear">
                <span class="text-xs text-gray-500 dark:text-slate-400">{{
                  $t('hotels.profile.establishedYear')
                }}</span>
                <p class="text-gray-800 dark:text-white">
                  {{ hotel.profile.overview.establishedYear }}
                </p>
              </div>
              <div v-if="hotel.profile.overview.renovationYear">
                <span class="text-xs text-gray-500 dark:text-slate-400">{{
                  $t('hotels.profile.renovationYear')
                }}</span>
                <p class="text-gray-800 dark:text-white">
                  {{ hotel.profile.overview.renovationYear }}
                </p>
              </div>
              <div v-if="hotel.profile.overview.chainBrand">
                <span class="text-xs text-gray-500 dark:text-slate-400">{{
                  $t('hotels.profile.chainBrand')
                }}</span>
                <p class="text-gray-800 dark:text-white">{{ hotel.profile.overview.chainBrand }}</p>
              </div>
            </div>
          </template>
        </ProfileDisplaySection>

        <!-- Other Profile Sections -->
        <ProfileDisplaySection
          v-if="
            hotel.profile.facilities?.features?.length ||
            getLocalizedText(hotel.profile.facilities?.content)
          "
          :title="$t('hotels.profile.sections.facilities')"
          icon="apartment"
          :content="getLocalizedText(hotel.profile.facilities?.content)"
          :features="hotel.profile.facilities?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.dining?.features?.length ||
            getLocalizedText(hotel.profile.dining?.content)
          "
          :title="$t('hotels.profile.sections.dining')"
          icon="restaurant"
          :content="getLocalizedText(hotel.profile.dining?.content)"
          :features="hotel.profile.dining?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.sportsEntertainment?.features?.length ||
            getLocalizedText(hotel.profile.sportsEntertainment?.content)
          "
          :title="$t('hotels.profile.sections.sportsEntertainment')"
          icon="sports_tennis"
          :content="getLocalizedText(hotel.profile.sportsEntertainment?.content)"
          :features="hotel.profile.sportsEntertainment?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.spaWellness?.features?.length ||
            getLocalizedText(hotel.profile.spaWellness?.content)
          "
          :title="$t('hotels.profile.sections.spaWellness')"
          icon="spa"
          :content="getLocalizedText(hotel.profile.spaWellness?.content)"
          :features="hotel.profile.spaWellness?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.familyKids?.features?.length ||
            getLocalizedText(hotel.profile.familyKids?.content)
          "
          :title="$t('hotels.profile.sections.familyKids')"
          icon="family_restroom"
          :content="getLocalizedText(hotel.profile.familyKids?.content)"
          :features="hotel.profile.familyKids?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.beachPool?.features?.length ||
            getLocalizedText(hotel.profile.beachPool?.content)
          "
          :title="$t('hotels.profile.sections.beachPool')"
          icon="beach_access"
          :content="getLocalizedText(hotel.profile.beachPool?.content)"
          :features="hotel.profile.beachPool?.features || []"
        />

        <ProfileDisplaySection
          v-if="
            hotel.profile.honeymoon?.features?.length ||
            getLocalizedText(hotel.profile.honeymoon?.content)
          "
          :title="$t('hotels.profile.sections.honeymoon')"
          icon="favorite"
          :content="getLocalizedText(hotel.profile.honeymoon?.content)"
          :features="hotel.profile.honeymoon?.features || []"
        />

        <ProfileDisplaySection
          v-if="getLocalizedText(hotel.profile.importantInfo?.content)"
          :title="$t('hotels.profile.sections.importantInfo')"
          icon="warning"
          :content="getLocalizedText(hotel.profile.importantInfo?.content)"
          :features="[]"
        />

        <ProfileDisplaySection
          v-if="
            getLocalizedText(hotel.profile.location?.content) ||
            hotel.profile.location?.distances?.length
          "
          :title="$t('hotels.profile.sections.location')"
          icon="location_on"
          :content="getLocalizedText(hotel.profile.location?.content)"
          :features="[]"
        >
          <template v-if="hotel.profile.location?.distances?.length" #extra>
            <div class="mt-4">
              <span class="text-xs text-gray-500 dark:text-slate-400 uppercase">{{
                $t('hotels.profile.distances')
              }}</span>
              <div class="mt-2 space-y-1">
                <div
                  v-for="(distance, index) in hotel.profile.location.distances"
                  :key="index"
                  class="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300"
                >
                  <span class="material-icons text-sm text-gray-400">place</span>
                  <span>{{ distance.place }}</span>
                  <span class="text-gray-400">-</span>
                  <span class="font-medium">{{ distance.distance }} {{ distance.unit }}</span>
                </div>
              </div>
            </div>
          </template>
        </ProfileDisplaySection>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ProfileDisplaySection from './ProfileDisplaySection.vue'
import { getImageUrl } from '@/utils/imageUrl'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  }
})

const { locale } = useI18n()
const mapContainer = ref(null)
let map = null

// Lightbox state
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const openLightbox = index => {
  lightboxIndex.value = index
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  lightboxIndex.value =
    (lightboxIndex.value - 1 + props.hotel.images.length) % props.hotel.images.length
}

const nextImage = () => {
  lightboxIndex.value = (lightboxIndex.value + 1) % props.hotel.images.length
}

// Get localized text from multilingual object
const getLocalizedText = obj => {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

// getImageUrl imported from @/utils/imageUrl

// Check if has social media
const hasSocialMedia = computed(() => {
  const sm = props.hotel?.contact?.socialMedia
  return sm && (sm.facebook || sm.instagram || sm.twitter || sm.youtube)
})

// Get city name - handle both populated object and ObjectId
const getCityName = () => {
  const city = props.hotel?.location?.city
  if (!city) return '-'
  // If it's a populated object with name property
  if (city.name) {
    return getLocalizedText(city.name) || '-'
  }
  // If it's just an ID (ObjectId or string), return dash
  return '-'
}

// Get region names - handle both populated objects and ObjectIds
const getRegionNames = () => {
  const regions = props.hotel?.location?.tourismRegions || []
  return regions
    .map(r => {
      // If it's a populated object with name property
      if (r && r.name) {
        return getLocalizedText(r.name) || ''
      }
      // If it's just an ID, skip it
      return ''
    })
    .filter(Boolean)
}

// Initialize map
const initMap = () => {
  if (!mapContainer.value || !props.hotel?.address?.coordinates?.lat) return

  const { lat, lng } = props.hotel.address.coordinates

  map = L.map(mapContainer.value, {
    center: [lat, lng],
    zoom: 15,
    zoomControl: true,
    scrollWheelZoom: false
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map)

  L.marker([lat, lng]).addTo(map)
}

onMounted(() => {
  setTimeout(initMap, 100)
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
