<template>
  <div class="space-y-6">
    <!-- Tab Navigation for Theme Sections -->
    <div class="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
      <button
        v-for="section in themeSections"
        :key="section.id"
        class="px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap"
        :class="
          activeSection === section.id
            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400'
        "
        @click="activeSection = section.id"
      >
        <span class="flex items-center gap-2">
          <span class="material-icons text-lg">{{ section.icon }}</span>
          {{ section.label }}
        </span>
      </button>
    </div>

    <!-- Hero Section Editor -->
    <div v-show="activeSection === 'hero'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-4">
          {{ $t('website.themeEditor.heroSection') }}
        </h4>

        <!-- Flight Theme: Dual Hero Images -->
        <div v-if="themeType === 'flight'" class="mb-6">
          <label class="form-label">{{
            $t('website.themeEditor.heroImages') || 'Hero Images'
          }}</label>
          <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
            {{
              $t('website.themeEditor.flightHeroHint') ||
              'Flight theme uses 2 hero images side by side'
            }}
          </p>
          <div class="grid grid-cols-2 gap-4">
            <!-- Photo 1 -->
            <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div
                class="w-full h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex items-center justify-center mb-3"
              >
                <img
                  v-if="getFlightHeroPhoto(0)?.link || getFlightHeroPhoto(0)?.url"
                  :src="getImageUrl(getFlightHeroPhoto(0))"
                  class="w-full h-full object-cover"
                />
                <span v-else class="material-icons text-4xl text-gray-400">image</span>
              </div>
              <label
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors text-sm"
              >
                <span class="material-icons text-sm mr-2">upload</span>
                {{ $t('website.themeEditor.uploadImage') || 'Upload' }} 1
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFlightHeroUpload($event, 0)"
                />
              </label>
              <button
                v-if="getFlightHeroPhoto(0)?.link || getFlightHeroPhoto(0)?.url"
                class="w-full mt-2 text-red-600 hover:text-red-700 text-sm flex items-center justify-center gap-1"
                @click="removeFlightHeroPhoto(0)"
              >
                <span class="material-icons text-sm">delete</span>
                {{ $t('common.delete') }}
              </button>
            </div>
            <!-- Photo 2 -->
            <div class="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
              <div
                class="w-full h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex items-center justify-center mb-3"
              >
                <img
                  v-if="getFlightHeroPhoto(1)?.link || getFlightHeroPhoto(1)?.url"
                  :src="getImageUrl(getFlightHeroPhoto(1))"
                  class="w-full h-full object-cover"
                />
                <span v-else class="material-icons text-4xl text-gray-400">image</span>
              </div>
              <label
                class="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors text-sm"
              >
                <span class="material-icons text-sm mr-2">upload</span>
                {{ $t('website.themeEditor.uploadImage') || 'Upload' }} 2
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFlightHeroUpload($event, 1)"
                />
              </label>
              <button
                v-if="getFlightHeroPhoto(1)?.link || getFlightHeroPhoto(1)?.url"
                class="w-full mt-2 text-red-600 hover:text-red-700 text-sm flex items-center justify-center gap-1"
                @click="removeFlightHeroPhoto(1)"
              >
                <span class="material-icons text-sm">delete</span>
                {{ $t('common.delete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Standard Hero Image (for non-flight themes) -->
        <div v-else class="mb-6">
          <label class="form-label">{{ $t('website.themeEditor.heroImage') }}</label>
          <div class="flex items-start gap-4">
            <div
              class="w-48 h-32 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700 flex items-center justify-center"
            >
              <img
                v-if="localContent.hero?.photo?.link || localContent.hero?.photo?.url"
                :src="getImageUrl(localContent.hero.photo)"
                class="w-full h-full object-cover"
              />
              <span v-else class="material-icons text-4xl text-gray-400">image</span>
            </div>
            <div class="flex-1">
              <label
                class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
              >
                <span class="material-icons text-sm mr-2">upload</span>
                {{ $t('common.upload') }}
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleHeroImageUpload"
                />
              </label>
              <button
                v-if="localContent.hero?.photo?.link || localContent.hero?.photo?.url"
                class="ml-2 text-red-600 hover:text-red-700 text-sm"
                @click="removeHeroPhoto"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                {{ $t('website.themeEditor.heroImageHint') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Hero Title -->
        <div class="mb-4">
          <label class="form-label">{{ $t('website.themeEditor.heroTitle') }}</label>
          <LanguageInput v-model="localContent.hero.title" />
        </div>

        <!-- Hero Description -->
        <div class="mb-4">
          <label class="form-label">{{ $t('website.themeEditor.heroDescription') }}</label>
          <LanguageInput v-model="localContent.hero.description" type="textarea" />
        </div>

        <!-- Search Options (for home1/home2/hotel) -->
        <div
          v-if="themeType === 'home1' || themeType === 'home2' || themeType === 'hotel'"
          class="mb-4"
        >
          <label class="form-label">{{ $t('website.themeEditor.searchOptions') }}</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="option in searchOptionsList"
              :key="option.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all"
              :class="
                isSearchOptionSelected(option.id)
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
              "
            >
              <input
                type="checkbox"
                :checked="isSearchOptionSelected(option.id)"
                class="form-checkbox"
                @change="toggleSearchOption(option.id)"
              />
              <span class="material-icons text-sm">{{ option.icon }}</span>
              <span class="text-sm">{{ option.label }}</span>
            </label>
          </div>
        </div>

        <!-- Backdrop Filter -->
        <div
          v-if="themeType === 'home1' || themeType === 'home2' || themeType === 'hotel'"
          class="mb-4"
        >
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="localContent.hero.backdropFilter"
              type="checkbox"
              class="form-checkbox"
            />
            <span class="text-sm text-gray-700 dark:text-slate-300">
              {{ $t('website.themeEditor.backdropFilter') }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Locations Section Editor -->
    <div v-show="activeSection === 'locations'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-semibold text-gray-800 dark:text-white">
            {{ $t('website.themeEditor.locationsSection') }}
          </h4>
          <button
            class="btn-secondary text-sm"
            @click="addLocation"
            :disabled="(getLocationsSection().items?.length || 0) >= 8"
          >
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('website.themeEditor.addLocation') }}
          </button>
        </div>

        <!-- Section Title/Description -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionTitle') }}</label>
            <LanguageInput v-model="getLocationsSection().title" />
          </div>
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionDescription') }}</label>
            <LanguageInput v-model="getLocationsSection().description" />
          </div>
        </div>

        <!-- Bedbank Theme: Use Paximum Location Picker -->
        <template v-if="themeType === 'bedbank'">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(location, index) in getLocationsSection().items || []"
              :key="index"
              class="group relative"
            >
              <!-- Location Photo with Upload -->
              <div
                class="aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-600 relative"
              >
                <img
                  v-if="location.photo?.link"
                  :src="getImageUrl(location.photo.link)"
                  :alt="location.bbLocationName"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-icons text-4xl text-gray-300 dark:text-slate-500"
                    >location_on</span
                  >
                </div>

                <!-- Overlay with actions -->
                <div
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                >
                  <label
                    class="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <span class="material-icons text-gray-700">photo_camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleLocationImageUpload($event, index)"
                    />
                  </label>
                  <button
                    class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    @click="removeLocation(index)"
                  >
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </div>

              <!-- Bedbank Location Info Badge -->
              <div class="mt-2">
                <div
                  v-if="location.bbLocationId"
                  class="flex items-center gap-1 px-2 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs"
                >
                  <span class="material-icons text-xs">location_city</span>
                  <span class="font-medium truncate flex-1">{{ location.bbLocationName }}</span>
                  <button
                    class="ml-1 hover:text-red-500 flex-shrink-0"
                    @click="clearBedbankLocation(index)"
                  >
                    <span class="material-icons text-xs">close</span>
                  </button>
                </div>
                <PaximumLocationPicker
                  v-else
                  :type-filter="1"
                  :placeholder="$t('website.themeEditor.searchLocation') || 'Lokasyon ara...'"
                  @select="loc => handleBedbankLocationSelect(loc, index)"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Standard Theme: City/Country Inputs -->
        <template v-else>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              v-for="(location, index) in getLocationsSection().items || []"
              :key="index"
              class="group relative"
            >
              <!-- Location Photo with Upload -->
              <div
                class="aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-600 relative"
              >
                <img
                  v-if="location.photo?.link"
                  :src="getImageUrl(location.photo.link)"
                  :alt="location.city"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <span class="material-icons text-4xl text-gray-300 dark:text-slate-500"
                    >location_on</span
                  >
                </div>

                <!-- Overlay with actions -->
                <div
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                >
                  <label
                    class="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <span class="material-icons text-gray-700">photo_camera</span>
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleLocationImageUpload($event, index)"
                    />
                  </label>
                  <button
                    class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    @click="removeLocation(index)"
                  >
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </div>

              <!-- Location Info -->
              <div class="mt-2 space-y-1">
                <input
                  v-model="location.city"
                  type="text"
                  class="form-input text-sm"
                  :placeholder="$t('website.themeEditor.city')"
                />
                <input
                  v-model="location.country"
                  type="text"
                  class="form-input text-sm"
                  :placeholder="$t('website.themeEditor.country')"
                />
                <input
                  v-model="location.link"
                  type="text"
                  class="form-input text-sm"
                  :placeholder="$t('website.themeEditor.link') || 'Link URL'"
                />
              </div>
            </div>
          </div>
        </template>

        <div
          v-if="!getLocationsSection().items?.length"
          class="text-center py-8 text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl mb-2">location_off</span>
          <p>{{ $t('website.themeEditor.noLocations') }}</p>
        </div>
      </div>
    </div>

    <!-- Campaigns Section Editor -->
    <div v-show="activeSection === 'campaigns'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-semibold text-gray-800 dark:text-white">
            {{ $t('website.themeEditor.campaignsSection') }}
          </h4>
          <button class="btn-secondary text-sm" @click="addCampaign">
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('website.themeEditor.addCampaign') }}
          </button>
        </div>

        <!-- Campaign Items -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(campaign, index) in getCampaignsArray()"
            :key="index"
            class="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <!-- Campaign Photo with Upload -->
            <div
              class="w-full h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-600 mb-4 relative group"
            >
              <img
                v-if="campaign.photo?.link"
                :src="getImageUrl(campaign.photo.link)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-icons text-4xl text-gray-400">campaign</span>
              </div>
              <!-- Upload overlay -->
              <div
                class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <label
                  class="p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <span class="material-icons text-gray-700">photo_camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleCampaignImageUpload($event, index)"
                  />
                </label>
              </div>
            </div>
            <!-- Campaign Title -->
            <div class="mb-3">
              <label class="form-label text-xs">{{
                $t('website.themeEditor.campaignTitle')
              }}</label>
              <LanguageInput v-model="campaign.title" size="sm" />
            </div>
            <!-- Campaign URL -->
            <div class="mb-3">
              <label class="form-label text-xs">{{ $t('website.themeEditor.campaignUrl') }}</label>
              <input
                v-model="campaign.url"
                type="text"
                class="form-input text-sm"
                placeholder="https://"
              />
            </div>
            <!-- Delete Button -->
            <button
              class="w-full text-red-600 hover:text-red-700 text-sm flex items-center justify-center gap-1"
              @click="removeCampaign(index)"
            >
              <span class="material-icons text-sm">delete</span>
              {{ $t('common.delete') }}
            </button>
          </div>
        </div>

        <div
          v-if="!getCampaignsArray().length"
          class="text-center py-8 text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl mb-2">campaign</span>
          <p>{{ $t('website.themeEditor.noCampaigns') }}</p>
        </div>
      </div>
    </div>

    <!-- Routes Section Editor (for flight theme) -->
    <div v-show="activeSection === 'routes'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-semibold text-gray-800 dark:text-white">
            {{ $t('website.themeEditor.routesSection') || 'Popular Routes' }}
          </h4>
          <button
            class="btn-secondary text-sm"
            :disabled="(localContent.routes?.items || []).length >= 5"
            @click="addRoute"
          >
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('website.themeEditor.addRoute') || 'Add Route' }}
          </button>
        </div>

        <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
          {{ $t('website.themeEditor.routesHint') || 'Add up to 5 preset flight routes' }}
        </p>

        <!-- Section Title/Description -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionTitle') }}</label>
            <LanguageInput v-model="getRoutesSection().title" />
          </div>
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionDescription') }}</label>
            <LanguageInput v-model="getRoutesSection().description" />
          </div>
        </div>

        <!-- Route Items -->
        <div class="space-y-4">
          <div
            v-for="(route, index) in getRoutesSection().items || []"
            :key="index"
            class="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="form-label text-xs">{{
                  $t('website.themeEditor.departure') || 'Departure'
                }}</label>
                <input
                  v-model="route.departure"
                  type="text"
                  class="form-input text-sm"
                  placeholder="AYT"
                />
              </div>
              <div>
                <label class="form-label text-xs">{{
                  $t('website.themeEditor.arrival') || 'Arrival'
                }}</label>
                <input
                  v-model="route.arrival"
                  type="text"
                  class="form-input text-sm"
                  placeholder="IST"
                />
              </div>
              <div>
                <label class="form-label text-xs">{{
                  $t('website.themeEditor.departureDate') || 'Departure Date'
                }}</label>
                <input v-model="route.departureDate" type="date" class="form-input text-sm" />
              </div>
              <div class="flex items-end">
                <button
                  class="text-red-600 hover:text-red-700 transition-colors"
                  @click="removeRoute(index)"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!getRoutesSection().items?.length"
          class="text-center py-8 text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl mb-2">flight</span>
          <p>{{ $t('website.themeEditor.noRoutes') || 'No routes configured' }}</p>
        </div>
      </div>
    </div>

    <!-- Theme-Specific Settings -->
    <div v-show="activeSection === 'settings'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-4">
          {{ $t('website.themeEditor.themeSettings') }}
        </h4>

        <!-- Subdomain Settings (for specialized themes) -->
        <div v-if="hasSubdomainSetting" class="mb-6">
          <label class="flex items-center gap-2 mb-3 cursor-pointer">
            <input v-model="localContent.subdomain.status" type="checkbox" class="form-checkbox" />
            <span class="text-sm text-gray-700 dark:text-slate-300">
              {{ $t('website.themeEditor.enableSubdomain') }}
            </span>
          </label>
          <div v-if="localContent.subdomain?.status" class="ml-6">
            <label class="form-label text-xs">{{ $t('website.themeEditor.subdomainValue') }}</label>
            <input
              v-model="localContent.subdomain.value"
              type="text"
              class="form-input text-sm w-48"
              placeholder="flight"
            />
          </div>
        </div>

        <!-- Markup Rate (for flight/bedbank) -->
        <div v-if="hasMarkupSetting" class="mb-6">
          <label class="form-label">{{ $t('website.themeEditor.markupRate') }}</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="localContent.mr"
              type="number"
              step="0.01"
              min="0"
              max="1"
              class="form-input text-sm w-24"
            />
            <span class="text-sm text-gray-500">{{ (localContent.mr * 100).toFixed(1) }}%</span>
          </div>
        </div>

        <!-- Categories (for tour/activity themes) -->
        <div v-if="hasCategoriesSetting" class="mb-6">
          <label class="form-label">{{ $t('website.themeEditor.categoriesLabel') }}</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="category in categoryOptions"
              :key="category.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all"
              :class="
                isCategorySelected(category.id)
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
              "
            >
              <input
                type="checkbox"
                :checked="isCategorySelected(category.id)"
                class="form-checkbox"
                @change="toggleCategory(category.id)"
              />
              <span class="text-sm">{{ category.label }}</span>
            </label>
          </div>
        </div>

        <!-- List Type (for tour theme) -->
        <div v-if="themeType === 'tour'" class="mb-6">
          <label class="form-label">{{ $t('website.themeEditor.listType') }}</label>
          <div class="flex gap-4">
            <label
              class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all"
              :class="
                localContent.listType === 'carousel'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200'
              "
            >
              <input
                v-model="localContent.listType"
                type="radio"
                value="carousel"
                class="sr-only"
              />
              <span class="material-icons text-sm">view_carousel</span>
              <span class="text-sm">{{ $t('website.themeEditor.carousel') }}</span>
            </label>
            <label
              class="flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all"
              :class="
                localContent.listType === 'grid'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200'
              "
            >
              <input v-model="localContent.listType" type="radio" value="grid" class="sr-only" />
              <span class="material-icons text-sm">grid_view</span>
              <span class="text-sm">{{ $t('website.themeEditor.grid') }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Tours/Hotels/Products Section -->
    <div v-show="activeSection === 'products'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-4">
          {{ $t('website.themeEditor.productsSection') }}
        </h4>

        <!-- Section Title/Description -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionTitle') }}</label>
            <LanguageInput v-model="getProductsSection().title" />
          </div>
          <div>
            <label class="form-label">{{ $t('website.themeEditor.sectionDescription') }}</label>
            <LanguageInput v-model="getProductsSection().description" />
          </div>
        </div>

        <!-- Bedbank Theme: Use Paximum Hotel Picker -->
        <template v-if="themeType === 'bedbank'">
          <div class="mb-4">
            <label class="form-label">{{
              $t('website.themeEditor.showcaseHotels') || 'Vitrin Otelleri'
            }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{
                $t('website.themeEditor.showcaseHotelsHint') ||
                'Vitrinde gösterilecek otelleri Paximum veritabanından arayarak seçin'
              }}
            </p>

            <!-- Hotel Search -->
            <PaximumLocationPicker
              :type-filter="2"
              :placeholder="$t('website.themeEditor.searchHotel') || 'Otel ara...'"
              @select="handleBedbankShowcaseSelect"
            />

            <!-- Selected Hotels List -->
            <div v-if="getBedbankShowcaseIds().length > 0" class="mt-4 space-y-2">
              <div
                v-for="(hotel, index) in getBedbankShowcaseIds()"
                :key="hotel.id"
                class="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg"
              >
                <span class="material-icons text-sm">hotel</span>
                <span class="flex-1 text-sm font-medium">{{ hotel.name }}</span>
                <span class="text-xs text-purple-400">ID: {{ hotel.id }}</span>
                <button class="hover:text-red-600" @click="removeBedbankShowcaseHotel(index)">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </div>
            <div
              v-else
              class="mt-4 text-center py-6 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg"
            >
              <span class="material-icons text-3xl mb-2">hotel</span>
              <p class="text-sm">
                {{ $t('website.themeEditor.noShowcaseHotels') || 'Henüz otel seçilmedi' }}
              </p>
            </div>
          </div>
        </template>

        <!-- Home/Hotel Themes: Separate Hotel + Tour Pickers -->
        <template v-else-if="hasHotelAndTourSections">
          <!-- Hotels -->
          <div class="mb-6">
            <label class="form-label flex items-center gap-2">
              <span class="material-icons text-purple-500 text-base">hotel</span>
              {{ $t('website.themeEditor.productPicker.hotelsLabel') }}
            </label>
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('website.themeEditor.productPicker.hotelsHint') }}
            </p>
            <ProductPicker
              :model-value="hotelItems"
              product-type="hotel"
              :fetch-fn="fetchHotels"
              :placeholder="$t('website.themeEditor.productPicker.searchHotels')"
              :empty-text="$t('website.themeEditor.productPicker.noHotelsSelected')"
              @update:model-value="updateHotelItems"
            />
          </div>

          <!-- Tours -->
          <div class="mb-4 pt-6 border-t border-gray-200 dark:border-slate-700">
            <label class="form-label flex items-center gap-2">
              <span class="material-icons text-orange-500 text-base">tour</span>
              {{ $t('website.themeEditor.productPicker.toursLabel') }}
            </label>
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('website.themeEditor.productPicker.toursHint') }}
            </p>
            <ProductPicker
              :model-value="tourItems"
              product-type="tour"
              :fetch-fn="fetchTours"
              :placeholder="$t('website.themeEditor.productPicker.searchTours')"
              :empty-text="$t('website.themeEditor.productPicker.noToursSelected')"
              @update:model-value="updateTourItems"
            />
          </div>
        </template>

        <!-- Tour-only themes -->
        <template v-else-if="hasTourOnlySection">
          <div class="mb-4">
            <label class="form-label flex items-center gap-2">
              <span class="material-icons text-orange-500 text-base">tour</span>
              {{ $t('website.themeEditor.productPicker.toursLabel') }}
            </label>
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-3">
              {{ $t('website.themeEditor.productPicker.toursHint') }}
            </p>
            <ProductPicker
              :model-value="tourItems"
              product-type="tour"
              :fetch-fn="fetchTours"
              :placeholder="$t('website.themeEditor.productPicker.searchTours')"
              :empty-text="$t('website.themeEditor.productPicker.noToursSelected')"
              @update:model-value="updateTourItems"
            />
          </div>
        </template>

        <!-- Fallback for other themes: numeric ID input (transfer, etc.) -->
        <template v-else>
          <div class="mb-4">
            <label class="form-label">{{ $t('website.themeEditor.productIds') }}</label>
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
              {{ $t('website.themeEditor.productIdsHint') }}
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(id, index) in getProductIds()"
                :key="index"
                class="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              >
                <span>{{ id }}</span>
                <button class="hover:text-red-600" @click="removeProductId(index)">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
              <input
                v-model="newProductId"
                type="number"
                class="form-input text-sm w-24"
                :placeholder="$t('website.themeEditor.addId')"
                @keydown.enter.prevent="addProductId"
              />
              <button class="btn-outline text-sm" @click="addProductId">
                <span class="material-icons text-sm">add</span>
              </button>
            </div>
          </div>
        </template>

        <!-- Cruise Search Location Preset -->
        <div
          v-if="themeType === 'cruise'"
          class="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700"
        >
          <h4 class="text-md font-semibold text-gray-800 dark:text-white mb-4">
            {{ $t('website.themeEditor.searchPresets') || 'Search Location Presets' }}
          </h4>
          <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
            {{
              $t('website.themeEditor.cruisePresetsHint') ||
              'Pre-fill departure and arrival locations for cruise search'
            }}
          </p>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">{{
                $t('website.themeEditor.departureLocations') || 'Departure Locations'
              }}</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <div
                  v-for="(loc, index) in getCruisePresets().departure || []"
                  :key="'dep-' + index"
                  class="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  <span>{{ loc }}</span>
                  <button
                    class="hover:text-red-600"
                    @click="removeCruisePreset('departure', index)"
                  >
                    <span class="material-icons text-sm">close</span>
                  </button>
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newDeparturePreset"
                  type="text"
                  class="form-input text-sm flex-1"
                  :placeholder="$t('website.themeEditor.addLocation') || 'Add location'"
                  @keydown.enter.prevent="addCruisePreset('departure')"
                />
                <button class="btn-outline text-sm" @click="addCruisePreset('departure')">
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
            <div>
              <label class="form-label">{{
                $t('website.themeEditor.arrivalLocations') || 'Arrival Locations'
              }}</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <div
                  v-for="(loc, index) in getCruisePresets().arrival || []"
                  :key="'arr-' + index"
                  class="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                >
                  <span>{{ loc }}</span>
                  <button class="hover:text-red-600" @click="removeCruisePreset('arrival', index)">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </div>
              </div>
              <div class="flex gap-2">
                <input
                  v-model="newArrivalPreset"
                  type="text"
                  class="form-input text-sm flex-1"
                  :placeholder="$t('website.themeEditor.addLocation') || 'Add location'"
                  @keydown.enter.prevent="addCruisePreset('arrival')"
                />
                <button class="btn-outline text-sm" @click="addCruisePreset('arrival')">
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bedbank Sections Editor -->
    <div v-show="activeSection === 'sections'" class="space-y-6">
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-semibold text-gray-800 dark:text-white">
            {{ $t('website.themeEditor.bedbankSections') || 'Location-Based Sections' }}
          </h4>
          <button
            class="btn-secondary text-sm"
            :disabled="(localContent.sections || []).length >= 5"
            @click="addBedbankSection"
          >
            <span class="material-icons text-sm mr-1">add</span>
            {{ $t('website.themeEditor.addSection') || 'Add Section' }}
          </button>
        </div>

        <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
          {{
            $t('website.themeEditor.bedbankSectionsHint') ||
            'Add up to 5 location-based sections to show hotels from specific areas'
          }}
        </p>

        <!-- Section Items -->
        <div class="space-y-4">
          <div
            v-for="(section, index) in localContent.sections || []"
            :key="index"
            class="p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-gray-700 dark:text-slate-300">
                {{ $t('website.themeEditor.section') || 'Section' }} {{ index + 1 }}
              </span>
              <button
                class="text-red-600 hover:text-red-700 transition-colors"
                @click="removeBedbankSection(index)"
              >
                <span class="material-icons text-sm">delete</span>
              </button>
            </div>

            <!-- Section Title/Description -->
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label class="form-label text-xs">{{
                  $t('website.themeEditor.sectionTitle')
                }}</label>
                <LanguageInput v-model="section.title" size="sm" />
              </div>
              <div>
                <label class="form-label text-xs">{{
                  $t('website.themeEditor.sectionDescription')
                }}</label>
                <LanguageInput v-model="section.description" size="sm" />
              </div>
            </div>

            <!-- Location Selection with Paximum Picker -->
            <div>
              <label class="form-label text-xs">{{
                $t('website.themeEditor.selectLocation') || 'Lokasyon Seç'
              }}</label>
              <div v-if="section.locationId" class="mt-1">
                <div
                  class="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg"
                >
                  <span class="material-icons text-sm">location_city</span>
                  <span class="flex-1 text-sm font-medium">{{ section.locationName }}</span>
                  <span class="text-xs text-purple-400">ID: {{ section.locationId }}</span>
                  <button class="hover:text-red-600" @click="clearBedbankSectionLocation(index)">
                    <span class="material-icons text-sm">close</span>
                  </button>
                </div>
              </div>
              <PaximumLocationPicker
                v-else
                :type-filter="1"
                :placeholder="$t('website.themeEditor.searchLocation') || 'Lokasyon ara...'"
                @select="loc => handleBedbankSectionLocationSelect(loc, index)"
              />
            </div>
          </div>
        </div>

        <div
          v-if="!localContent.sections?.length"
          class="text-center py-8 text-gray-500 dark:text-slate-400"
        >
          <span class="material-icons text-4xl mb-2">view_module</span>
          <p>{{ $t('website.themeEditor.noSections') || 'No sections configured' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageInput from '@/components/common/LanguageInput.vue'
import PaximumLocationPicker from './PaximumLocationPicker.vue'
import ProductPicker from './ProductPicker.vue'
import { getImageUrl as getCdnImageUrl, getFileUrl } from '@/utils/imageUrl'
import websiteService from '@/services/websiteService'
import hotelService from '@/services/hotelService'
import tourService from '@/services/tourService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  themeType: {
    type: String,
    required: true
  },
  storefront: Object
})

const emit = defineEmits(['update:modelValue', 'update'])

const activeSection = ref('hero')
const newProductId = ref('')
const newDeparturePreset = ref('')
const newArrivalPreset = ref('')

// Local copy of content
const localContent = ref({})

// Watch for modelValue changes - avoid deep watching for performance
let lastModelValueStr = ''
watch(
  () => props.modelValue,
  newValue => {
    // Only update if the actual content changed (not on every nested change)
    const newValueStr = JSON.stringify(newValue || {})
    if (newValueStr !== lastModelValueStr) {
      lastModelValueStr = newValueStr
      localContent.value = JSON.parse(newValueStr)
      // Ensure hero exists
      if (!localContent.value.hero) {
        localContent.value.hero = { photo: {}, title: [], description: [] }
      }
    }
  },
  { immediate: true }
)

// Watch for local changes and emit
watch(
  localContent,
  newValue => {
    emit('update:modelValue', newValue)
    emit('update', newValue)
  },
  { deep: true }
)

// Theme sections based on theme type
const themeSections = computed(() => {
  const baseSections = [{ id: 'hero', label: t('website.themeEditor.tabs.hero'), icon: 'image' }]

  switch (props.themeType) {
    case 'home1':
    case 'home2':
    case 'hotel':
      return [
        ...baseSections,
        { id: 'locations', label: t('website.themeEditor.tabs.locations'), icon: 'location_on' },
        { id: 'campaigns', label: t('website.themeEditor.tabs.campaigns'), icon: 'campaign' },
        { id: 'products', label: t('website.themeEditor.tabs.products'), icon: 'inventory_2' }
      ]
    case 'tour':
      return [
        ...baseSections,
        { id: 'locations', label: t('website.themeEditor.tabs.locations'), icon: 'location_on' },
        { id: 'campaigns', label: t('website.themeEditor.tabs.campaigns'), icon: 'campaign' },
        { id: 'products', label: t('website.themeEditor.tabs.tours'), icon: 'tour' },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    case 'flight':
      return [
        ...baseSections,
        { id: 'routes', label: t('website.themeEditor.tabs.routes') || 'Routes', icon: 'flight' },
        { id: 'locations', label: t('website.themeEditor.tabs.locations'), icon: 'location_on' },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    case 'activity':
      return [
        ...baseSections,
        { id: 'locations', label: t('website.themeEditor.tabs.locations'), icon: 'location_on' },
        { id: 'campaigns', label: t('website.themeEditor.tabs.campaigns'), icon: 'campaign' },
        { id: 'products', label: t('website.themeEditor.tabs.activities'), icon: 'local_activity' },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    case 'bedbank':
      return [
        ...baseSections,
        { id: 'locations', label: t('website.themeEditor.tabs.locations'), icon: 'location_on' },
        { id: 'products', label: t('website.themeEditor.tabs.showcase'), icon: 'hotel' },
        {
          id: 'sections',
          label: t('website.themeEditor.tabs.sections') || 'Sections',
          icon: 'view_module'
        },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    case 'transfer':
      return [
        ...baseSections,
        { id: 'products', label: t('website.themeEditor.tabs.transfers'), icon: 'airport_shuttle' },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    case 'cruise':
      return [
        ...baseSections,
        { id: 'products', label: t('website.themeEditor.tabs.cruises'), icon: 'sailing' },
        { id: 'settings', label: t('website.themeEditor.tabs.settings'), icon: 'settings' }
      ]
    default:
      return baseSections
  }
})

// Search options for hero
const searchOptionsList = computed(() => [
  { id: 'hotel', label: t('website.themeEditor.searchOptionsOptions.hotel'), icon: 'hotel' },
  { id: 'flight', label: t('website.themeEditor.searchOptionsOptions.flight'), icon: 'flight' },
  { id: 'tour', label: t('website.themeEditor.searchOptionsOptions.tour'), icon: 'tour' },
  {
    id: 'transfer',
    label: t('website.themeEditor.searchOptionsOptions.transfer'),
    icon: 'airport_shuttle'
  },
  {
    id: 'activity',
    label: t('website.themeEditor.searchOptionsOptions.activity'),
    icon: 'local_activity'
  }
])

// Category options
const categoryOptions = computed(() => [
  { id: 'activity', label: t('website.themeEditor.categories.activity') },
  { id: 'adventure', label: t('website.themeEditor.categories.adventure') },
  { id: 'city', label: t('website.themeEditor.categories.city') },
  { id: 'cruise', label: t('website.themeEditor.categories.cruise') },
  { id: 'museum', label: t('website.themeEditor.categories.museum') },
  { id: 'events', label: t('website.themeEditor.categories.events') },
  { id: 'festivals', label: t('website.themeEditor.categories.festivals') },
  { id: 'transfer', label: t('website.themeEditor.categories.transfer') }
])

// Computed flags for theme-specific settings
const hasSubdomainSetting = computed(() => {
  return ['tour', 'flight', 'activity', 'bedbank', 'transfer', 'cruise'].includes(props.themeType)
})

const hasMarkupSetting = computed(() => {
  return ['flight', 'bedbank'].includes(props.themeType)
})

const hasCategoriesSetting = computed(() => {
  return ['tour', 'activity'].includes(props.themeType)
})

// Themes that show separate hotel + tour picker sections
const hasHotelAndTourSections = computed(() => {
  return ['home1', 'home2', 'hotel'].includes(props.themeType)
})

// Themes with only tour picker (tour, activity, cruise)
const hasTourOnlySection = computed(() => {
  return ['tour', 'activity', 'cruise'].includes(props.themeType)
})

// ==================== PRODUCT PICKER HELPERS ====================

/** Fetch hotels from partner portfolio */
const fetchHotels = params => hotelService.getHotels(params)

/** Fetch tours from partner portfolio */
const fetchTours = params => tourService.getTours(params)

/**
 * Convert between storefront schema items and ProductPicker items.
 * Storefront stores: { ids: [Number], names: [String] } or { ids: [Number], items: [{id, name, ...}] }
 * ProductPicker uses: [{ id, _id, name, location? }]
 */
const hotelItems = computed(() => {
  const section = getHotelSection()
  // New format: items array with { id, name, location }
  if (section.items?.length) return section.items
  // Legacy format: ids + names arrays
  if (section.ids?.length) {
    return section.ids.map((id, i) => ({
      id: String(id),
      _id: String(id),
      name: section.names?.[i] || `#${id}`
    }))
  }
  return []
})

const tourItems = computed(() => {
  const section = getTourSection()
  if (section.items?.length) return section.items
  if (section.ids?.length) {
    return section.ids.map((id, i) => ({
      id: String(id),
      _id: String(id),
      name: section.names?.[i] || `#${id}`
    }))
  }
  return []
})

const getHotelSection = () => {
  if (!localContent.value.hotels) {
    localContent.value.hotels = { title: [], description: [], ids: [], items: [] }
  }
  return localContent.value.hotels
}

const getTourSection = () => {
  // For home/hotel themes, tours is in localContent.tours
  // For tour theme, also localContent.tours
  // For activity, tourIds.top4/bottom8 - handled separately
  if (props.themeType === 'activity') {
    if (!localContent.value.tourIds) {
      localContent.value.tourIds = { top4: [], bottom8: [], items: [] }
    }
    // Wrap activity tourIds into a tour-like section
    return {
      get title() {
        return []
      },
      get description() {
        return []
      },
      get ids() {
        return [
          ...(localContent.value.tourIds.top4 || []),
          ...(localContent.value.tourIds.bottom8 || [])
        ]
      },
      get items() {
        return localContent.value.tourIds.items || []
      }
    }
  }
  if (!localContent.value.tours) {
    localContent.value.tours = { title: [], description: [], ids: [], items: [] }
  }
  return localContent.value.tours
}

const updateHotelItems = items => {
  const section = getHotelSection()
  section.items = items
  // Also sync legacy ids for backward compatibility with B2C consumer
  section.ids = items.map(i => i.id || i._id).filter(Boolean)
  section.names = items.map(i => i.name || '').filter(Boolean)
}

const updateTourItems = items => {
  if (props.themeType === 'activity') {
    if (!localContent.value.tourIds) {
      localContent.value.tourIds = { top4: [], bottom8: [], items: [] }
    }
    localContent.value.tourIds.items = items
    // Split into top4 and bottom8 for legacy compat
    const ids = items.map(i => i.id || i._id).filter(Boolean)
    localContent.value.tourIds.top4 = ids.slice(0, 4)
    localContent.value.tourIds.bottom8 = ids.slice(4, 12)
    return
  }
  const section = getTourSection()
  section.items = items
  section.ids = items.map(i => i.id || i._id).filter(Boolean)
  section.names = items.map(i => i.name || '').filter(Boolean)
}

// Helper functions
const getImageUrl = photo => {
  if (!photo) return ''
  const link = typeof photo === 'string' ? photo : photo.link || photo.url
  if (!link) return ''
  if (link.startsWith('http')) return link
  if (link.startsWith('storefront/')) return getFileUrl(`/uploads/${link}`)
  return getCdnImageUrl(link)
}

const normalizeUploadedPhoto = data => {
  if (!data || typeof data !== 'object') return data
  if (!data.link && data.url) return { ...data, link: data.url }
  return data
}

const isSearchOptionSelected = optionId => {
  return localContent.value.hero?.searchOptions?.includes(optionId) || false
}

const toggleSearchOption = optionId => {
  if (!localContent.value.hero.searchOptions) {
    localContent.value.hero.searchOptions = []
  }
  const index = localContent.value.hero.searchOptions.indexOf(optionId)
  if (index >= 0) {
    localContent.value.hero.searchOptions.splice(index, 1)
  } else {
    localContent.value.hero.searchOptions.push(optionId)
  }
}

const isCategorySelected = categoryId => {
  return localContent.value.categories?.includes(categoryId) || false
}

const toggleCategory = categoryId => {
  if (!localContent.value.categories) {
    localContent.value.categories = []
  }
  const index = localContent.value.categories.indexOf(categoryId)
  if (index >= 0) {
    localContent.value.categories.splice(index, 1)
  } else {
    localContent.value.categories.push(categoryId)
  }
}

// Get locations section based on theme type
const getLocationsSection = () => {
  if (props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel') {
    if (!localContent.value.locationSection) {
      localContent.value.locationSection = { title: [], description: [], items: [] }
    }
    return localContent.value.locationSection
  }
  if (!localContent.value.locations) {
    localContent.value.locations = { title: [], description: [], items: [] }
  }
  return localContent.value.locations
}

const addLocation = () => {
  const section = getLocationsSection()
  if (!section.items) section.items = []
  if (section.items.length >= 8) return // Max 8 locations

  // For bedbank theme, use different structure
  if (props.themeType === 'bedbank') {
    section.items.push({
      bbLocationId: null,
      bbLocationName: '',
      photo: {},
      index: section.items.length
    })
  } else {
    section.items.push({
      city: '',
      country: '',
      photo: {},
      link: '',
      index: section.items.length
    })
  }
}

// ==================== BEDBANK LOCATION FUNCTIONS ====================

// Handle bedbank location select from picker
const handleBedbankLocationSelect = (loc, index) => {
  if (!loc) return
  const section = getLocationsSection()
  if (section.items && section.items[index]) {
    section.items[index].bbLocationId = parseInt(loc.id)
    section.items[index].bbLocationName = loc.city
      ? `${loc.name}, ${loc.country}`
      : `${loc.name}${loc.country ? ', ' + loc.country : ''}`
  }
}

// Clear bedbank location
const clearBedbankLocation = index => {
  const section = getLocationsSection()
  if (section.items && section.items[index]) {
    section.items[index].bbLocationId = null
    section.items[index].bbLocationName = ''
  }
}

// ==================== BEDBANK SHOWCASE FUNCTIONS ====================

// Get bedbank showcase hotel IDs
const getBedbankShowcaseIds = () => {
  if (props.themeType !== 'bedbank') return []
  if (!localContent.value.showcase) {
    localContent.value.showcase = { title: [], description: [], ids: [] }
  }
  return localContent.value.showcase.ids || []
}

// Handle bedbank showcase hotel select
const handleBedbankShowcaseSelect = loc => {
  if (!loc) return
  if (!localContent.value.showcase) {
    localContent.value.showcase = { title: [], description: [], ids: [] }
  }
  if (!localContent.value.showcase.ids) {
    localContent.value.showcase.ids = []
  }
  // Check if already exists
  const exists = localContent.value.showcase.ids.some(h => h.id === parseInt(loc.id))
  if (!exists) {
    localContent.value.showcase.ids.push({
      id: parseInt(loc.id),
      name: loc.name
    })
  }
}

// Remove bedbank showcase hotel
const removeBedbankShowcaseHotel = index => {
  if (localContent.value.showcase?.ids) {
    localContent.value.showcase.ids.splice(index, 1)
  }
}

// ==================== BEDBANK SECTIONS FUNCTIONS ====================

// Handle bedbank section location select
const handleBedbankSectionLocationSelect = (loc, index) => {
  if (!loc) return
  if (localContent.value.sections && localContent.value.sections[index]) {
    localContent.value.sections[index].locationId = parseInt(loc.id)
    localContent.value.sections[index].locationName = loc.city
      ? `${loc.name}, ${loc.country}`
      : `${loc.name}${loc.country ? ', ' + loc.country : ''}`
  }
}

// Clear bedbank section location
const clearBedbankSectionLocation = index => {
  if (localContent.value.sections && localContent.value.sections[index]) {
    localContent.value.sections[index].locationId = null
    localContent.value.sections[index].locationName = ''
  }
}

const removeLocation = index => {
  const section = getLocationsSection()
  section.items.splice(index, 1)
  // Update indices
  section.items.forEach((item, i) => {
    item.index = i
  })
}

// Handle location image upload
const handleLocationImageUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const uploadType =
      props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel'
        ? 'location'
        : `${props.themeType}-location`
    const response = await websiteService.uploadSectionImage(file, uploadType, index)
    if (response.success) {
      const section = getLocationsSection()
      if (section.items && section.items[index]) {
        section.items[index].photo = normalizeUploadedPhoto(response.data)
      }
    }
  } catch (error) {
    console.error('Location image upload failed:', error)
  }
  event.target.value = ''
}

// Get campaigns based on theme type
const getCampaignsArray = () => {
  if (props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel') {
    if (!localContent.value.campaignSection) {
      localContent.value.campaignSection = []
    }
    return localContent.value.campaignSection
  }
  // For other themes, campaigns are in campaignSection.campaign
  if (!localContent.value.campaignSection) {
    localContent.value.campaignSection = { title: [], description: [], campaign: [] }
  }
  if (Array.isArray(localContent.value.campaignSection.campaign)) {
    return localContent.value.campaignSection.campaign
  }
  return [localContent.value.campaignSection.campaign].filter(Boolean)
}

const addCampaign = () => {
  const newCampaign = {
    photo: {},
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    url: '',
    description: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ]
  }

  if (props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel') {
    if (!localContent.value.campaignSection) {
      localContent.value.campaignSection = []
    }
    localContent.value.campaignSection.push(newCampaign)
  } else {
    if (!localContent.value.campaignSection) {
      localContent.value.campaignSection = { title: [], description: [], campaign: [] }
    }
    if (!Array.isArray(localContent.value.campaignSection.campaign)) {
      localContent.value.campaignSection.campaign = []
    }
    localContent.value.campaignSection.campaign.push(newCampaign)
  }
}

const removeCampaign = index => {
  if (props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel') {
    localContent.value.campaignSection.splice(index, 1)
  } else {
    localContent.value.campaignSection.campaign.splice(index, 1)
  }
}

// Handle campaign image upload
const handleCampaignImageUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const uploadType =
      props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel'
        ? 'campaign'
        : `${props.themeType}-campaign`
    const response = await websiteService.uploadSectionImage(file, uploadType, index)
    if (response.success) {
      const campaigns = getCampaignsArray()
      if (campaigns && campaigns[index]) {
        campaigns[index].photo = normalizeUploadedPhoto(response.data)
      }
    }
  } catch (error) {
    console.error('Campaign image upload failed:', error)
  }
  event.target.value = ''
}

// Get products section based on theme type
const getProductsSection = () => {
  switch (props.themeType) {
    case 'home1':
    case 'home2':
    case 'hotel':
      // Return hotels section (used for section title/desc)
      if (!localContent.value.hotels) {
        localContent.value.hotels = { title: [], description: [], ids: [], items: [] }
      }
      return localContent.value.hotels
    case 'tour':
      if (!localContent.value.tours) {
        localContent.value.tours = { title: [], description: [], ids: [], names: [] }
      }
      return localContent.value.tours
    case 'bedbank':
      if (!localContent.value.showcase) {
        localContent.value.showcase = { title: [], description: [], ids: [] }
      }
      return localContent.value.showcase
    case 'transfer':
      if (!localContent.value.transfers) {
        localContent.value.transfers = { title: [], description: [], ids: [] }
      }
      return localContent.value.transfers
    case 'cruise':
      if (!localContent.value.tours) {
        localContent.value.tours = { title: [], description: [], ids: [] }
      }
      return localContent.value.tours
    default:
      return { title: [], description: [], ids: [] }
  }
}

const getProductIds = () => {
  const section = getProductsSection()
  return section.ids || []
}

const addProductId = () => {
  const id = parseInt(newProductId.value)
  if (!id) return
  const section = getProductsSection()
  if (!section.ids) section.ids = []
  if (!section.ids.includes(id)) {
    section.ids.push(id)
  }
  newProductId.value = ''
}

const removeProductId = index => {
  const section = getProductsSection()
  section.ids.splice(index, 1)
}

// ==================== FLIGHT THEME FUNCTIONS ====================

// Get flight hero photo by index (flight theme has 2 photos)
const getFlightHeroPhoto = index => {
  if (!localContent.value.hero?.photo) return null
  const photos = localContent.value.hero.photo
  if (Array.isArray(photos)) {
    return photos[index] || null
  }
  return index === 0 ? photos : null
}

// Ensure flight hero has array structure
const ensureFlightHeroArray = () => {
  if (!localContent.value.hero) {
    localContent.value.hero = { photo: [], title: [], description: [] }
  }
  if (!Array.isArray(localContent.value.hero.photo)) {
    const existingPhoto = localContent.value.hero.photo
    localContent.value.hero.photo = [
      existingPhoto || { id: '', width: 0, height: 0, link: '' },
      { id: '', width: 0, height: 0, link: '' }
    ]
  }
  // Ensure always 2 slots
  while (localContent.value.hero.photo.length < 2) {
    localContent.value.hero.photo.push({ id: '', width: 0, height: 0, link: '' })
  }
}

// Handle flight hero image upload
const handleFlightHeroUpload = async (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const response = await websiteService.uploadSectionImage(file, 'flight-hero', index)
    if (response.success) {
      ensureFlightHeroArray()
      localContent.value.hero.photo[index] = normalizeUploadedPhoto(response.data)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }
  event.target.value = ''
}

// Remove flight hero photo
const removeFlightHeroPhoto = index => {
  ensureFlightHeroArray()
  localContent.value.hero.photo[index] = { id: '', width: 0, height: 0, link: '' }
}

// ==================== STANDARD HERO FUNCTIONS ====================

// Handle standard hero image upload
const handleHeroImageUpload = async event => {
  const file = event.target.files[0]
  if (!file) return

  try {
    const uploadType =
      props.themeType === 'home1' || props.themeType === 'home2' || props.themeType === 'hotel'
        ? 'hero'
        : `${props.themeType}-hero`
    const response = await websiteService.uploadSectionImage(file, uploadType)
    if (response.success) {
      if (!localContent.value.hero) {
        localContent.value.hero = { photo: {}, title: [], description: [] }
      }
      localContent.value.hero.photo = normalizeUploadedPhoto(response.data)
    }
  } catch (error) {
    console.error('Upload failed:', error)
  }
  event.target.value = ''
}

// Remove hero photo
const removeHeroPhoto = () => {
  if (localContent.value.hero) {
    localContent.value.hero.photo = { id: '', width: 0, height: 0, link: '' }
  }
}

// ==================== ROUTES FUNCTIONS (FLIGHT THEME) ====================

const getRoutesSection = () => {
  if (!localContent.value.routes) {
    localContent.value.routes = { title: [], description: [], items: [] }
  }
  return localContent.value.routes
}

const addRoute = () => {
  const section = getRoutesSection()
  if (!section.items) section.items = []
  if (section.items.length >= 5) return // Max 5 routes
  section.items.push({
    departure: '',
    arrival: '',
    departureDate: new Date().toISOString().split('T')[0],
    arrivalDate: null
  })
}

const removeRoute = index => {
  const section = getRoutesSection()
  section.items.splice(index, 1)
}

// ==================== BEDBANK SECTIONS FUNCTIONS ====================

const addBedbankSection = () => {
  if (!localContent.value.sections) {
    localContent.value.sections = []
  }
  if (localContent.value.sections.length >= 5) return
  localContent.value.sections.push({
    title: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    description: [
      { lang: 'en', value: '' },
      { lang: 'tr', value: '' }
    ],
    locationId: null,
    locationName: ''
  })
}

const removeBedbankSection = index => {
  if (localContent.value.sections) {
    localContent.value.sections.splice(index, 1)
  }
}

// ==================== CRUISE PRESETS FUNCTIONS ====================

const getCruisePresets = () => {
  if (!localContent.value.searchLocationPreset) {
    localContent.value.searchLocationPreset = { departure: [], arrival: [] }
  }
  return localContent.value.searchLocationPreset
}

const addCruisePreset = type => {
  const presets = getCruisePresets()
  const value = type === 'departure' ? newDeparturePreset.value : newArrivalPreset.value
  if (!value?.trim()) return

  if (!presets[type]) presets[type] = []
  if (!presets[type].includes(value.trim())) {
    presets[type].push(value.trim())
  }

  if (type === 'departure') {
    newDeparturePreset.value = ''
  } else {
    newArrivalPreset.value = ''
  }
}

const removeCruisePreset = (type, index) => {
  const presets = getCruisePresets()
  if (presets[type]) {
    presets[type].splice(index, 1)
  }
}
</script>
