<template>
  <div>
    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.statistics.total') }}</p>
            <p class="text-2xl font-bold text-gray-800 dark:text-white">{{ stats.total }}</p>
          </div>
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span class="material-icons text-purple-600 dark:text-purple-400">hotel</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.statistics.active') }}</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.active }}</p>
          </div>
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span class="material-icons text-green-600 dark:text-green-400">check_circle</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.statistics.inactive') }}</p>
            <p class="text-2xl font-bold text-red-600">{{ stats.inactive }}</p>
          </div>
          <div class="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <span class="material-icons text-red-600 dark:text-red-400">cancel</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.statistics.draft') }}</p>
            <p class="text-2xl font-bold text-yellow-600">{{ stats.draft }}</p>
          </div>
          <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <span class="material-icons text-yellow-600 dark:text-yellow-400">edit_note</span>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.statistics.featured') }}</p>
            <p class="text-2xl font-bold text-orange-600">{{ stats.featured }}</p>
          </div>
          <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <span class="material-icons text-orange-600 dark:text-orange-400">star</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex flex-wrap justify-end items-center gap-2">
          <!-- Export Button -->
          <button
            @click="exportToCSV"
            class="btn-secondary flex items-center"
            :title="$t('hotels.exportCSV')"
          >
            <span class="material-icons text-lg mr-1">download</span>
            <span class="hidden sm:inline">{{ $t('hotels.export') }}</span>
          </button>
          <!-- Add Hotel -->
          <router-link to="/hotels/new" class="btn-primary flex items-center">
            <span class="material-icons text-lg mr-2">add</span>
            {{ $t('hotels.addHotel') }}
          </router-link>
        </div>

        <!-- Toolbar -->
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <!-- Search -->
          <div class="flex-1 min-w-[250px]">
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <span class="material-icons text-lg">search</span>
              </span>
              <input
                v-model="filters.search"
                type="text"
                :placeholder="$t('hotels.searchPlaceholder')"
                class="form-input w-full pl-10"
                @input="debouncedFetch"
              />
              <button
                v-if="filters.search"
                @click="filters.search = ''; fetchHotels()"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span class="material-icons text-lg">close</span>
              </button>
            </div>
          </div>

          <!-- View Mode Toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              @click="viewMode = 'table'"
              class="p-2 rounded-md transition-colors"
              :class="viewMode === 'table' ? 'bg-white dark:bg-slate-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-slate-600'"
              :title="$t('hotels.tableView')"
            >
              <span class="material-icons text-lg">view_list</span>
            </button>
            <button
              @click="viewMode = 'grid'"
              class="p-2 rounded-md transition-colors"
              :class="viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-slate-600'"
              :title="$t('hotels.gridView')"
            >
              <span class="material-icons text-lg">grid_view</span>
            </button>
          </div>

          <!-- Sort Dropdown -->
          <div class="relative">
            <select v-model="sortBy" class="form-input pr-8 min-w-[150px]" @change="fetchHotels">
              <option value="">{{ $t('hotels.sortBy') }}</option>
              <option value="name_asc">{{ $t('hotels.sortOptions.nameAsc') }}</option>
              <option value="name_desc">{{ $t('hotels.sortOptions.nameDesc') }}</option>
              <option value="stars_asc">{{ $t('hotels.sortOptions.starsAsc') }}</option>
              <option value="stars_desc">{{ $t('hotels.sortOptions.starsDesc') }}</option>
              <option value="city_asc">{{ $t('hotels.sortOptions.cityAsc') }}</option>
              <option value="city_desc">{{ $t('hotels.sortOptions.cityDesc') }}</option>
              <option value="createdAt_desc">{{ $t('hotels.sortOptions.newest') }}</option>
              <option value="createdAt_asc">{{ $t('hotels.sortOptions.oldest') }}</option>
            </select>
          </div>

          <!-- Bulk Actions -->
          <div v-if="selectedHotels.length > 0" class="relative">
            <button
              @click="showBulkMenu = !showBulkMenu"
              class="btn-secondary flex items-center"
            >
              <span class="material-icons text-lg mr-1">checklist</span>
              {{ $t('hotels.selected', { count: selectedHotels.length }) }}
              <span class="material-icons text-lg ml-1">expand_more</span>
            </button>
            <div
              v-if="showBulkMenu"
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600 z-20"
            >
              <button
                @click="bulkActivate"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
              >
                <span class="material-icons text-lg mr-2 text-green-600">play_circle</span>
                {{ $t('hotels.bulkActivate') }}
              </button>
              <button
                @click="bulkDeactivate"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center"
              >
                <span class="material-icons text-lg mr-2 text-orange-600">pause_circle</span>
                {{ $t('hotels.bulkDeactivate') }}
              </button>
              <hr class="border-gray-200 dark:border-slate-600">
              <button
                @click="confirmBulkDelete"
                class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
              >
                <span class="material-icons text-lg mr-2">delete</span>
                {{ $t('hotels.bulkDelete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="mt-4 flex flex-wrap gap-3">
          <select v-model="filters.status" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStatuses') }}</option>
            <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
            <option value="active">{{ $t('hotels.statuses.active') }}</option>
            <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
          </select>
          <select v-model="filters.stars" class="form-input w-32" @change="fetchHotels">
            <option value="">{{ $t('hotels.allStars') }}</option>
            <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ $t('hotels.stars') }}</option>
          </select>
          <select v-model="filters.type" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allTypes') }}</option>
            <option v-for="(label, key) in hotelTypes" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.city" class="form-input w-40" @change="fetchHotels">
            <option value="">{{ $t('hotels.allCities') }}</option>
            <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <select v-model="filters.category" class="form-input w-36" @change="fetchHotels">
            <option value="">{{ $t('hotels.allCategories') }}</option>
            <option v-for="(label, key) in categories" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.featured" class="form-input w-40" @change="fetchHotels">
            <option value="">{{ $t('hotels.featured') }}</option>
            <option value="true">{{ $t('hotels.featuredOnly') }}</option>
            <option value="false">{{ $t('hotels.notFeatured') }}</option>
          </select>
        </div>

        <!-- Active Filters -->
        <div v-if="activeFilterCount > 0" class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.activeFilters') }}:</span>
          <span
            v-if="filters.status"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
          >
            {{ $t(`hotels.statuses.${filters.status}`) }}
            <button @click="filters.status = ''; fetchHotels()" class="ml-1 hover:text-purple-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.stars"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          >
            {{ filters.stars }} {{ $t('hotels.stars') }}
            <button @click="filters.stars = ''; fetchHotels()" class="ml-1 hover:text-yellow-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.type"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {{ $t(`hotels.types.${filters.type}`) }}
            <button @click="filters.type = ''; fetchHotels()" class="ml-1 hover:text-blue-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.city"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          >
            {{ filters.city }}
            <button @click="filters.city = ''; fetchHotels()" class="ml-1 hover:text-green-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.category"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          >
            {{ $t(`hotels.categories.${filters.category}`) }}
            <button @click="filters.category = ''; fetchHotels()" class="ml-1 hover:text-indigo-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <span
            v-if="filters.featured"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
          >
            {{ filters.featured === 'true' ? $t('hotels.featuredOnly') : $t('hotels.notFeatured') }}
            <button @click="filters.featured = ''; fetchHotels()" class="ml-1 hover:text-orange-900">
              <span class="material-icons text-sm">close</span>
            </button>
          </span>
          <button
            @click="clearAllFilters"
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            <span class="material-icons text-sm mr-1">clear_all</span>
            {{ $t('hotels.clearFilters') }}
          </button>
        </div>
      </div>

      <div class="p-6">
        <!-- Loading State -->
        <div v-if="loading" class="py-12 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="hotels.length === 0" class="py-12 text-center">
          <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">hotel</span>
          <p class="mt-4 text-gray-600 dark:text-slate-400">
            {{ activeFilterCount > 0 ? $t('hotels.noResults') : $t('hotels.noHotels') }}
          </p>
          <p v-if="activeFilterCount > 0" class="text-sm text-gray-500 dark:text-slate-500 mt-1">
            {{ $t('hotels.tryDifferentFilters') }}
          </p>
          <button
            v-if="activeFilterCount > 0"
            @click="clearAllFilters"
            class="btn-secondary mt-4"
          >
            {{ $t('hotels.clearFilters') }}
          </button>
        </div>

        <!-- Table View -->
        <div v-else-if="viewMode === 'table'" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th class="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isPartialSelected"
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('hotels.name') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('hotels.city') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('hotels.stars') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('hotels.type') }}
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('common.status.label') }}
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              <tr
                v-for="hotel in hotels"
                :key="hotel._id"
                class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                :class="{ 'bg-purple-50 dark:bg-purple-900/10': selectedHotels.includes(hotel._id) }"
              >
                <td class="px-4 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    :checked="selectedHotels.includes(hotel._id)"
                    @change="toggleSelect(hotel._id)"
                    class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                      <img
                        v-if="getHotelImage(hotel)"
                        :src="getHotelImage(hotel)"
                        :alt="getHotelName(hotel)"
                        class="h-12 w-12 object-cover"
                      />
                      <div v-else class="h-12 w-12 flex items-center justify-center">
                        <span class="material-icons text-gray-400">hotel</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="flex items-center gap-2">
                        <router-link
                          :to="`/hotels/${hotel._id}`"
                          class="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          {{ getHotelName(hotel) }}
                        </router-link>
                        <span
                          v-if="hotel.hotelType === 'linked'"
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        >
                          <span class="material-icons text-xs mr-0.5">link</span>
                          HotelBase
                        </span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span v-if="hotel.featured" class="inline-flex items-center text-xs text-orange-600">
                          <span class="material-icons text-sm mr-0.5">star</span>
                          {{ $t('hotels.featured') }}
                        </span>
                        <span v-if="hotel.totalRooms" class="text-xs text-gray-500 dark:text-slate-400">
                          {{ hotel.totalRooms }} {{ $t('hotels.rooms') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                  {{ hotel.address?.city || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center text-yellow-500">
                    <span v-for="n in hotel.stars" :key="n" class="material-icons text-sm">star</span>
                    <span v-for="n in (5 - hotel.stars)" :key="'e' + n" class="material-icons text-sm text-gray-300 dark:text-slate-600">star</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                  {{ $t(`hotels.types.${hotel.type}`) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="badge"
                    :class="{
                      'badge-success': hotel.status === 'active',
                      'badge-danger': hotel.status === 'inactive',
                      'badge-warning': hotel.status === 'draft'
                    }"
                  >
                    {{ $t(`hotels.statuses.${hotel.status}`) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      @click="toggleFeatured(hotel)"
                      class="p-2 rounded-lg transition-colors"
                      :class="hotel.featured
                        ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'"
                      :title="hotel.featured ? $t('hotels.removeFeatured') : $t('hotels.makeFeatured')"
                    >
                      <span class="material-icons text-lg">{{ hotel.featured ? 'star' : 'star_border' }}</span>
                    </button>
                    <router-link
                      :to="`/hotels/${hotel._id}`"
                      class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      :title="$t('common.edit')"
                    >
                      <span class="material-icons text-lg">edit</span>
                    </router-link>
                    <button
                      @click="toggleStatus(hotel)"
                      class="p-2 rounded-lg transition-colors"
                      :class="hotel.status === 'active'
                        ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'"
                      :title="hotel.status === 'active' ? $t('common.deactivate') : $t('common.activate')"
                    >
                      <span class="material-icons text-lg">{{ hotel.status === 'active' ? 'pause_circle' : 'play_circle' }}</span>
                    </button>
                    <button
                      @click="confirmDelete(hotel)"
                      class="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      :title="$t('common.delete')"
                    >
                      <span class="material-icons text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Grid View -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="hotel in hotels"
            :key="hotel._id"
            class="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden hover:shadow-lg transition-shadow group"
            :class="{ 'ring-2 ring-purple-500': selectedHotels.includes(hotel._id) }"
          >
            <!-- Card Image -->
            <div class="relative aspect-video bg-gray-100 dark:bg-slate-600">
              <img
                v-if="getHotelImage(hotel)"
                :src="getHotelImage(hotel)"
                :alt="getHotelName(hotel)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-5xl text-gray-300 dark:text-slate-500">hotel</span>
              </div>
              <!-- Checkbox Overlay -->
              <div class="absolute top-3 left-3">
                <input
                  type="checkbox"
                  :checked="selectedHotels.includes(hotel._id)"
                  @change="toggleSelect(hotel._id)"
                  class="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-5 h-5"
                />
              </div>
              <!-- Status Badge -->
              <div class="absolute top-3 right-3">
                <span
                  class="badge"
                  :class="{
                    'badge-success': hotel.status === 'active',
                    'badge-danger': hotel.status === 'inactive',
                    'badge-warning': hotel.status === 'draft'
                  }"
                >
                  {{ $t(`hotels.statuses.${hotel.status}`) }}
                </span>
              </div>
              <!-- Featured Badge -->
              <div v-if="hotel.featured" class="absolute bottom-3 left-3">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                  <span class="material-icons text-sm mr-0.5">star</span>
                  {{ $t('hotels.featured') }}
                </span>
              </div>
            </div>
            <!-- Card Content -->
            <div class="p-4">
              <div class="flex items-center gap-2">
                <router-link
                  :to="`/hotels/${hotel._id}`"
                  class="text-lg font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 truncate"
                >
                  {{ getHotelName(hotel) }}
                </router-link>
                <span
                  v-if="hotel.hotelType === 'linked'"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex-shrink-0"
                >
                  <span class="material-icons text-xs mr-0.5">link</span>
                  HotelBase
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span class="material-icons text-sm text-gray-400">location_on</span>
                <span class="text-sm text-gray-500 dark:text-slate-400 truncate">
                  {{ hotel.address?.city || '-' }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center text-yellow-500">
                  <span v-for="n in hotel.stars" :key="n" class="material-icons text-sm">star</span>
                  <span v-for="n in (5 - hotel.stars)" :key="'e' + n" class="material-icons text-sm text-gray-300 dark:text-slate-600">star</span>
                </div>
                <span class="text-xs px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-gray-600 dark:text-slate-300">
                  {{ $t(`hotels.types.${hotel.type}`) }}
                </span>
              </div>
              <!-- Card Actions -->
              <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-slate-600">
                <router-link
                  :to="`/hotels/${hotel._id}`"
                  class="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
                >
                  <span class="material-icons text-sm mr-1">edit</span>
                  {{ $t('common.edit') }}
                </router-link>
                <div class="flex items-center gap-1">
                  <button
                    @click="toggleFeatured(hotel)"
                    class="p-1.5 rounded-lg transition-colors"
                    :class="hotel.featured
                      ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'"
                    :title="hotel.featured ? $t('hotels.removeFeatured') : $t('hotels.makeFeatured')"
                  >
                    <span class="material-icons text-lg">{{ hotel.featured ? 'star' : 'star_border' }}</span>
                  </button>
                  <button
                    @click="toggleStatus(hotel)"
                    class="p-1.5 rounded-lg transition-colors"
                    :class="hotel.status === 'active'
                      ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                      : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'"
                    :title="hotel.status === 'active' ? $t('common.deactivate') : $t('common.activate')"
                  >
                    <span class="material-icons text-lg">{{ hotel.status === 'active' ? 'pause_circle' : 'play_circle' }}</span>
                  </button>
                  <button
                    @click="confirmDelete(hotel)"
                    class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    :title="$t('common.delete')"
                  >
                    <span class="material-icons text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > 0" class="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <p class="text-sm text-gray-600 dark:text-slate-400">
              {{ $t('hotels.showing', {
                from: ((pagination.page - 1) * pagination.limit) + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
              }) }}
            </p>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.perPage') }}:</span>
              <select v-model="pagination.limit" class="form-input py-1 px-2 text-sm w-20" @change="fetchHotels">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="changePage(1)"
              :disabled="pagination.page <= 1"
              class="btn-secondary p-2"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.page <= 1 }"
            >
              <span class="material-icons text-lg">first_page</span>
            </button>
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page <= 1"
              class="btn-secondary p-2"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.page <= 1 }"
            >
              <span class="material-icons text-lg">chevron_left</span>
            </button>
            <span class="px-4 py-2 text-sm text-gray-600 dark:text-slate-400">
              {{ pagination.page }} / {{ pagination.pages }}
            </span>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.pages"
              class="btn-secondary p-2"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.page >= pagination.pages }"
            >
              <span class="material-icons text-lg">chevron_right</span>
            </button>
            <button
              @click="changePage(pagination.pages)"
              :disabled="pagination.page >= pagination.pages"
              class="btn-secondary p-2"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.page >= pagination.pages }"
            >
              <span class="material-icons text-lg">last_page</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      :title="$t('hotels.deleteHotel')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.deleteConfirm') }}
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" type="button" class="btn-secondary">
          {{ $t('common.no') }}
        </button>
        <button @click="handleDelete" type="button" class="btn-danger" :disabled="deleting">
          <span v-if="deleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>

    <!-- Bulk Delete Confirmation Modal -->
    <Modal
      v-model="showBulkDeleteModal"
      :title="$t('hotels.bulkDelete')"
      size="sm"
    >
      <p class="text-gray-600 dark:text-slate-400">
        {{ $t('hotels.bulkDeleteConfirm', { count: selectedHotels.length }) }}
      </p>

      <template #footer>
        <button @click="showBulkDeleteModal = false" type="button" class="btn-secondary">
          {{ $t('common.no') }}
        </button>
        <button @click="handleBulkDelete" type="button" class="btn-danger" :disabled="bulkDeleting">
          <span v-if="bulkDeleting">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('common.yes') }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import hotelService from '@/services/hotelService'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { getImageUrl } from '@/utils/imageUrl'

const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()

const hotels = ref([])
const cities = ref([])
const loading = ref(false)
const showDeleteModal = ref(false)
const showBulkDeleteModal = ref(false)
const deleting = ref(false)
const bulkDeleting = ref(false)
const selectedHotel = ref(null)
const selectedHotels = ref([])
const viewMode = ref('table')
const sortBy = ref('')
const showBulkMenu = ref(false)

const filters = reactive({
  search: '',
  status: '',
  stars: '',
  city: '',
  type: '',
  category: '',
  featured: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
})

const stats = reactive({
  total: 0,
  active: 0,
  inactive: 0,
  draft: 0,
  featured: 0
})

// Hotel types for filter dropdown
const hotelTypes = computed(() => ({
  hotel: t('hotels.types.hotel'),
  apart: t('hotels.types.apart'),
  boutique: t('hotels.types.boutique'),
  resort: t('hotels.types.resort'),
  hostel: t('hotels.types.hostel'),
  villa: t('hotels.types.villa'),
  guesthouse: t('hotels.types.guesthouse'),
  motel: t('hotels.types.motel'),
  pension: t('hotels.types.pension'),
  camping: t('hotels.types.camping')
}))

// Categories for filter dropdown
const categories = computed(() => ({
  economy: t('hotels.categories.economy'),
  standard: t('hotels.categories.standard'),
  superior: t('hotels.categories.superior'),
  deluxe: t('hotels.categories.deluxe'),
  luxury: t('hotels.categories.luxury'),
  'ultra-luxury': t('hotels.categories.ultra-luxury')
}))

// Computed for active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.status) count++
  if (filters.stars) count++
  if (filters.type) count++
  if (filters.city) count++
  if (filters.category) count++
  if (filters.featured) count++
  return count
})

// Selection computed properties
const isAllSelected = computed(() => {
  return hotels.value.length > 0 && selectedHotels.value.length === hotels.value.length
})

const isPartialSelected = computed(() => {
  return selectedHotels.value.length > 0 && selectedHotels.value.length < hotels.value.length
})

let debounceTimer = null

const debouncedFetch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    pagination.page = 1
    fetchHotels()
  }, 300)
}

const fetchHotels = async () => {
  loading.value = true
  selectedHotels.value = []
  showBulkMenu.value = false

  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit
    }
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    if (filters.stars) params.stars = filters.stars
    if (filters.city) params.city = filters.city
    if (filters.type) params.type = filters.type
    if (filters.category) params.category = filters.category
    if (filters.featured) params.featured = filters.featured
    if (sortBy.value) {
      const [field, order] = sortBy.value.split('_')
      params.sortBy = field
      params.sortOrder = order
    }

    const response = await hotelService.getHotels(params)
    if (response.success) {
      hotels.value = response.data.items || response.data.hotels || []
      pagination.total = response.data.pagination?.total || 0
      pagination.pages = response.data.pagination?.pages || 0

      // Update stats from response if available
      if (response.data.stats) {
        stats.total = response.data.stats.total || 0
        stats.active = response.data.stats.active || 0
        stats.inactive = response.data.stats.inactive || 0
        stats.draft = response.data.stats.draft || 0
        stats.featured = response.data.stats.featured || 0
      } else {
        // Calculate from current response if no stats provided
        stats.total = pagination.total
      }
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('hotels.fetchError'))
  } finally {
    loading.value = false
  }
}

const fetchCities = async () => {
  try {
    const response = await hotelService.getCities()
    if (response.success) {
      cities.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch cities:', error)
  }
}

const fetchStats = async () => {
  try {
    // Fetch all hotels stats without filters
    const response = await hotelService.getHotels({ limit: 1 })
    if (response.success && response.data.stats) {
      stats.total = response.data.stats.total || 0
      stats.active = response.data.stats.active || 0
      stats.inactive = response.data.stats.inactive || 0
      stats.draft = response.data.stats.draft || 0
      stats.featured = response.data.stats.featured || 0
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

const getHotelName = (hotel) => {
  if (typeof hotel.name === 'string') {
    return hotel.name || '-'
  }
  const lang = locale.value
  return hotel.name?.[lang] || hotel.name?.tr || hotel.name?.en || '-'
}

const getHotelImage = (hotel) => {
  // First try logo, then main image from gallery
  if (hotel.logo) {
    return getImageUrl(hotel.logo)
  }
  const mainImage = hotel.images?.find(img => img.isMain) || hotel.images?.[0]
  if (!mainImage?.url) return null
  return getImageUrl(mainImage.url)
}

// getImageUrl imported from @/utils/imageUrl

const toggleStatus = async (hotel) => {
  const newStatus = hotel.status === 'active' ? 'inactive' : 'active'
  try {
    const response = await hotelService.updateHotelStatus(hotel._id, newStatus)
    if (response.success) {
      hotel.status = newStatus
      toast.success(t('hotels.statusUpdated'))
      fetchStats()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

const toggleFeatured = async (hotel) => {
  const newFeatured = !hotel.featured
  try {
    const response = await hotelService.toggleFeatured(hotel._id, newFeatured)
    if (response.success) {
      hotel.featured = newFeatured
      toast.success(newFeatured ? t('hotels.markedFeatured') : t('hotels.unmarkedFeatured'))
      fetchStats()
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

const confirmDelete = (hotel) => {
  selectedHotel.value = hotel
  showDeleteModal.value = true
}

const handleDelete = async () => {
  deleting.value = true
  try {
    const response = await hotelService.deleteHotel(selectedHotel.value._id)
    if (response.success) {
      toast.success(t('hotels.deleteSuccess'))
      await fetchHotels()
      await fetchStats()
      showDeleteModal.value = false
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

const changePage = (page) => {
  pagination.page = page
  fetchHotels()
}

const clearAllFilters = () => {
  filters.search = ''
  filters.status = ''
  filters.stars = ''
  filters.city = ''
  filters.type = ''
  filters.category = ''
  filters.featured = ''
  sortBy.value = ''
  pagination.page = 1
  fetchHotels()
}

// Selection methods
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedHotels.value = []
  } else {
    selectedHotels.value = hotels.value.map(h => h._id)
  }
}

const toggleSelect = (hotelId) => {
  const index = selectedHotels.value.indexOf(hotelId)
  if (index > -1) {
    selectedHotels.value.splice(index, 1)
  } else {
    selectedHotels.value.push(hotelId)
  }
}

// Bulk actions
const bulkActivate = async () => {
  showBulkMenu.value = false
  try {
    for (const hotelId of selectedHotels.value) {
      await hotelService.updateHotelStatus(hotelId, 'active')
    }
    toast.success(t('hotels.bulkActivateSuccess', { count: selectedHotels.value.length }))
    selectedHotels.value = []
    await fetchHotels()
    await fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

const bulkDeactivate = async () => {
  showBulkMenu.value = false
  try {
    for (const hotelId of selectedHotels.value) {
      await hotelService.updateHotelStatus(hotelId, 'inactive')
    }
    toast.success(t('hotels.bulkDeactivateSuccess', { count: selectedHotels.value.length }))
    selectedHotels.value = []
    await fetchHotels()
    await fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  }
}

const confirmBulkDelete = () => {
  showBulkMenu.value = false
  showBulkDeleteModal.value = true
}

const handleBulkDelete = async () => {
  bulkDeleting.value = true
  try {
    for (const hotelId of selectedHotels.value) {
      await hotelService.deleteHotel(hotelId)
    }
    toast.success(t('hotels.bulkDeleteSuccess', { count: selectedHotels.value.length }))
    selectedHotels.value = []
    showBulkDeleteModal.value = false
    await fetchHotels()
    await fetchStats()
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    bulkDeleting.value = false
  }
}

// Export to CSV
const exportToCSV = () => {
  const headers = ['Name', 'City', 'Country', 'Stars', 'Type', 'Status', 'Featured', 'Rooms']
  const rows = hotels.value.map(hotel => [
    getHotelName(hotel),
    hotel.address?.city || '',
    hotel.address?.country || '',
    hotel.stars,
    hotel.type,
    hotel.status,
    hotel.featured ? 'Yes' : 'No',
    hotel.totalRooms || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `hotels_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

// Close bulk menu when clicking outside
watch(showBulkMenu, (val) => {
  if (val) {
    const closeMenu = (e) => {
      if (!e.target.closest('.relative')) {
        showBulkMenu.value = false
        document.removeEventListener('click', closeMenu)
      }
    }
    setTimeout(() => document.addEventListener('click', closeMenu), 0)
  }
})

// React to partner changes
usePartnerContext({
  onPartnerChange: (partner) => {
    if (partner) {
      clearAllFilters()
      fetchCities()
      fetchStats()
    }
  },
  immediate: true
})
</script>
