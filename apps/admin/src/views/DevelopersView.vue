<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
            {{ $t('developers.title') }}
          </h1>
          <p class="text-gray-600 dark:text-slate-400 mt-1">{{ $t('developers.description') }}</p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
          >
            v1.0
          </span>
          <a
            :href="baseUrl"
            target="_blank"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <span class="material-icons text-lg">open_in_new</span>
            {{ $t('developers.openApi') }}
          </a>
        </div>
      </div>
    </div>

    <!-- Quick Start -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">rocket_launch</span>
        {{ $t('developers.quickStart') }}
      </h2>
      <div class="prose dark:prose-invert max-w-none">
        <p class="text-gray-600 dark:text-slate-400">{{ $t('developers.quickStartDesc') }}</p>
        <div class="bg-slate-900 rounded-lg p-4 mt-4 overflow-x-auto">
          <pre class="text-green-400 text-sm"><code>{{ quickStartCode }}</code></pre>
        </div>
      </div>
    </div>

    <!-- Base URL & Auth -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2
          class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
        >
          <span class="material-icons text-blue-600">link</span>
          {{ $t('developers.baseUrl') }}
        </h2>
        <div class="bg-slate-100 dark:bg-slate-700 rounded-lg p-4">
          <code class="text-purple-600 dark:text-purple-400 text-sm">{{ baseUrl }}</code>
        </div>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-3">
          {{ $t('developers.baseUrlDesc') }}
        </p>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2
          class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2"
        >
          <span class="material-icons text-green-600">lock_open</span>
          {{ $t('developers.authentication') }}
        </h2>
        <div class="flex items-center gap-2 text-green-600 dark:text-green-400">
          <span class="material-icons">check_circle</span>
          <span class="font-medium">{{ $t('developers.noAuthRequired') }}</span>
        </div>
        <p class="text-sm text-gray-500 dark:text-slate-400 mt-3">
          {{ $t('developers.noAuthDesc') }}
        </p>
      </div>
    </div>

    <!-- Rate Limiting -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-orange-600">speed</span>
        {{ $t('developers.rateLimiting') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('developers.globalLimit') }}
          </p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">100 req/min</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('developers.searchLimit') }}
          </p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">30 req/min</p>
        </div>
        <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
          <p class="text-sm text-gray-500 dark:text-slate-400">
            {{ $t('developers.bookingLimit') }}
          </p>
          <p class="text-lg font-semibold text-gray-800 dark:text-white">10 req/min</p>
        </div>
      </div>
    </div>

    <!-- Endpoints Navigation -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex overflow-x-auto">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="[
              'px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
              activeSection === section.id
                ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-slate-400 border-transparent hover:text-gray-700 dark:hover:text-white'
            ]"
            @click="activeSection = section.id"
          >
            {{ section.label }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- Hotel Endpoints -->
        <div v-if="activeSection === 'hotels'" class="space-y-6">
          <EndpointDoc v-for="endpoint in hotelEndpoints" :key="endpoint.path" v-bind="endpoint" />
        </div>

        <!-- Search Endpoints -->
        <div v-if="activeSection === 'search'" class="space-y-6">
          <EndpointDoc v-for="endpoint in searchEndpoints" :key="endpoint.path" v-bind="endpoint" />
        </div>

        <!-- Booking Endpoints -->
        <div v-if="activeSection === 'booking'" class="space-y-6">
          <EndpointDoc
            v-for="endpoint in bookingEndpoints"
            :key="endpoint.path"
            v-bind="endpoint"
          />
        </div>
      </div>
    </div>

    <!-- Response Codes -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-red-600">error_outline</span>
        {{ $t('developers.responseCodes') }}
      </h2>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead>
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                Code
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('developers.status') }}
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase"
              >
                {{ $t('developers.description') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-slate-700">
            <tr v-for="code in responseCodes" :key="code.code">
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    code.code < 300
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : code.code < 400
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : code.code < 500
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  ]"
                  >{{ code.code }}</span
                >
              </td>
              <td class="px-4 py-3 text-sm text-gray-800 dark:text-white font-medium">
                {{ code.status }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                {{ code.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import EndpointDoc from '@/components/developers/EndpointDoc.vue'

const baseUrl = computed(() => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.maxirez.com/api'
  return `${apiUrl}/public`
})

const activeSection = ref('hotels')

const sections = [
  { id: 'hotels', label: 'Hotels' },
  { id: 'search', label: 'Search & Availability' },
  { id: 'booking', label: 'Booking' }
]

const quickStartCode = `// Search for available rooms
const response = await fetch('${baseUrl.value}/hotels/HOTELCODE/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    checkIn: '2025-02-01',
    checkOut: '2025-02-05',
    adults: 2,
    children: [5, 8],
    countryCode: 'TR'
  })
});

const data = await response.json();
console.log(data.data.results);`

const hotelEndpoints = [
  {
    method: 'GET',
    path: '/hotels',
    title: 'List Hotels',
    description: 'Get a list of active hotels with filtering and pagination',
    queryParams: [
      { name: 'city', type: 'string', description: 'Filter by city name' },
      {
        name: 'country',
        type: 'string',
        description: 'Filter by country code (ISO 3166-1 alpha-2)'
      },
      { name: 'stars', type: 'number', description: 'Filter by star rating (1-5)' },
      {
        name: 'type',
        type: 'string',
        description: 'Filter by hotel type (hotel, resort, boutique, etc.)'
      },
      { name: 'amenities', type: 'string', description: 'Comma-separated amenity codes' },
      { name: 'featured', type: 'boolean', description: 'Filter featured hotels only' },
      { name: 'page', type: 'number', description: 'Page number (default: 1)' },
      { name: 'limit', type: 'number', description: 'Items per page (default: 20, max: 50)' },
      { name: 'sort', type: 'string', description: 'Sort by: name, -name, stars, rating' }
    ],
    responseExample: `{
  "success": true,
  "data": {
    "hotels": [
      {
        "name": "Grand Hotel",
        "slug": "grand-hotel",
        "stars": 5,
        "type": "hotel",
        "city": "Antalya",
        "country": "Turkey",
        "countryCode": "TR",
        "image": "https://...",
        "amenities": ["pool", "spa", "wifi"],
        "featured": true,
        "rating": 4.8,
        "reviewCount": 245
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}`
  },
  {
    method: 'GET',
    path: '/hotels/:hotelCode',
    title: 'Get Hotel Info',
    description: 'Get detailed information about a specific hotel',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    responseExample: `{
  "success": true,
  "data": {
    "code": "GRAND01",
    "name": { "en": "Grand Hotel", "tr": "Grand Otel" },
    "description": { "en": "Luxury beachfront hotel...", "tr": "..." },
    "starRating": 5,
    "amenities": ["pool", "spa", "wifi", "restaurant"],
    "images": [
      { "url": "https://...", "isMain": true, "caption": "Exterior" }
    ],
    "location": {
      "address": "Beach Road 123",
      "city": "Antalya",
      "countryCode": "TR",
      "coordinates": { "lat": 36.8969, "lng": 30.7133 }
    },
    "contact": { "phone": "+90...", "email": "info@..." },
    "childAgeGroups": {
      "infant": { "maxAge": 2 },
      "child": { "minAge": 3, "maxAge": 11 }
    }
  }
}`
  },
  {
    method: 'GET',
    path: '/hotels/:hotelCode/room-types',
    title: 'Get Room Types',
    description: 'List all available room types for a hotel',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    responseExample: `{
  "success": true,
  "data": [
    {
      "code": "STD",
      "name": { "en": "Standard Room", "tr": "Standart Oda" },
      "description": { "en": "Comfortable room with...", "tr": "..." },
      "images": [...],
      "amenities": ["wifi", "minibar", "safe"],
      "occupancy": {
        "baseOccupancy": 2,
        "maxAdults": 3,
        "maxChildren": 2,
        "totalMaxGuests": 4
      }
    }
  ]
}`
  },
  {
    method: 'GET',
    path: '/hotels/:hotelCode/meal-plans',
    title: 'Get Meal Plans',
    description: 'List all available meal plans for a hotel',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    responseExample: `{
  "success": true,
  "data": [
    { "code": "RO", "name": { "en": "Room Only", "tr": "Sadece Oda" } },
    { "code": "BB", "name": { "en": "Bed & Breakfast", "tr": "Oda Kahvaltı" } },
    { "code": "HB", "name": { "en": "Half Board", "tr": "Yarım Pansiyon" } },
    { "code": "FB", "name": { "en": "Full Board", "tr": "Tam Pansiyon" } },
    { "code": "AI", "name": { "en": "All Inclusive", "tr": "Her Şey Dahil" } }
  ]
}`
  },
  {
    method: 'GET',
    path: '/hotels/:hotelCode/campaigns',
    title: 'Get Active Campaigns',
    description: 'List currently active campaigns/promotions for a hotel',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    queryParams: [
      { name: 'checkIn', type: 'date', description: 'Filter by stay start date (YYYY-MM-DD)' },
      { name: 'checkOut', type: 'date', description: 'Filter by stay end date (YYYY-MM-DD)' }
    ],
    responseExample: `{
  "success": true,
  "data": [
    {
      "code": "SUMMER24",
      "name": { "en": "Summer Special", "tr": "Yaz Özel" },
      "description": { "en": "20% off for summer stays" },
      "type": "percentage",
      "discount": { "type": "percentage", "value": 20 },
      "conditions": { "minNights": 3 },
      "stayWindow": {
        "startDate": "2025-06-01",
        "endDate": "2025-08-31"
      }
    }
  ]
}`
  }
]

const searchEndpoints = [
  {
    method: 'POST',
    path: '/hotels/:hotelCode/search',
    title: 'Search Availability',
    description: 'Search for available rooms with pricing and campaigns applied',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    bodyParams: [
      { name: 'checkIn', type: 'date', required: true, description: 'Check-in date (YYYY-MM-DD)' },
      {
        name: 'checkOut',
        type: 'date',
        required: true,
        description: 'Check-out date (YYYY-MM-DD)'
      },
      { name: 'adults', type: 'number', description: 'Number of adults (default: 2, max: 10)' },
      { name: 'children', type: 'array', description: 'Array of child ages [5, 8]' },
      {
        name: 'countryCode',
        type: 'string',
        description: 'Guest country code for market detection'
      },
      { name: 'currency', type: 'string', description: 'Preferred currency code' }
    ],
    requestExample: `{
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "adults": 2,
  "children": [5, 8],
  "countryCode": "TR"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "hotel": { "code": "GRAND01", "name": "Grand Hotel" },
    "search": {
      "checkIn": "2025-02-01",
      "checkOut": "2025-02-05",
      "nights": 4,
      "adults": 2,
      "children": [5, 8],
      "market": "TR",
      "currency": "TRY"
    },
    "results": [
      {
        "roomType": {
          "code": "STD",
          "name": { "en": "Standard Room" },
          "occupancy": { "maxAdults": 3, "maxChildren": 2 }
        },
        "options": [
          {
            "mealPlan": { "code": "BB", "name": { "en": "Bed & Breakfast" } },
            "pricing": {
              "currency": "TRY",
              "originalTotal": 12000,
              "totalDiscount": 2400,
              "finalTotal": 9600,
              "avgPerNight": 2400
            },
            "campaigns": [
              { "code": "EB15", "name": "Early Booking", "discountText": "15% off" }
            ],
            "nights": 4
          }
        ]
      }
    ]
  }
}`
  },
  {
    method: 'POST',
    path: '/hotels/:hotelCode/price-quote',
    title: 'Get Price Quote',
    description: 'Get detailed price breakdown for a specific room/meal plan combination',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    bodyParams: [
      { name: 'checkIn', type: 'date', required: true, description: 'Check-in date (YYYY-MM-DD)' },
      {
        name: 'checkOut',
        type: 'date',
        required: true,
        description: 'Check-out date (YYYY-MM-DD)'
      },
      { name: 'roomTypeCode', type: 'string', required: true, description: 'Room type code' },
      { name: 'mealPlanCode', type: 'string', required: true, description: 'Meal plan code' },
      { name: 'adults', type: 'number', description: 'Number of adults' },
      { name: 'children', type: 'array', description: 'Array of child ages' },
      { name: 'countryCode', type: 'string', description: 'Guest country code' }
    ],
    requestExample: `{
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "roomTypeCode": "STD",
  "mealPlanCode": "BB",
  "adults": 2,
  "children": [5],
  "countryCode": "TR"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "hotel": { "code": "GRAND01", "name": "Grand Hotel" },
    "roomType": { "code": "STD", "name": { "en": "Standard Room" } },
    "mealPlan": { "code": "BB", "name": { "en": "Bed & Breakfast" } },
    "market": { "code": "TR", "currency": "TRY" },
    "booking": {
      "checkIn": "2025-02-01",
      "checkOut": "2025-02-05",
      "nights": 4,
      "adults": 2,
      "children": [5]
    },
    "pricing": {
      "originalTotal": 12000,
      "totalDiscount": 2400,
      "finalTotal": 9600,
      "avgPerNight": 2400
    },
    "dailyBreakdown": [
      {
        "date": "2025-02-01",
        "price": 2400,
        "originalPrice": 3000,
        "discountAmount": 600,
        "appliedCampaigns": [{ "code": "EB15", "amount": 600 }]
      }
    ],
    "campaigns": {
      "applied": [
        { "code": "EB15", "name": "Early Booking", "discountText": "15%" }
      ],
      "available": []
    },
    "availability": { "isAvailable": true }
  }
}`
  },
  {
    method: 'GET',
    path: '/hotels/:hotelCode/availability',
    title: 'Check Availability',
    description: 'Quick check if rooms are available for a date range',
    pathParams: [{ name: 'hotelCode', type: 'string', description: 'Hotel code or slug' }],
    queryParams: [
      { name: 'startDate', type: 'date', required: true, description: 'Start date (YYYY-MM-DD)' },
      { name: 'endDate', type: 'date', required: true, description: 'End date (YYYY-MM-DD)' },
      { name: 'roomTypeId', type: 'string', description: 'Filter by room type' },
      { name: 'marketId', type: 'string', description: 'Filter by market' }
    ],
    responseExample: `{
  "success": true,
  "data": {
    "hotel": "GRAND01",
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "market": "TR",
    "availability": [
      {
        "roomType": "STD",
        "mealPlan": "BB",
        "isAvailable": true,
        "unavailableDates": [],
        "totalDaysChecked": 4
      }
    ]
  }
}`
  }
]

const bookingEndpoints = [
  {
    method: 'POST',
    path: '/bookings',
    title: 'Create Booking',
    description: 'Create a new reservation',
    bodyParams: [
      { name: 'hotelCode', type: 'string', required: true, description: 'Hotel code or slug' },
      { name: 'checkIn', type: 'date', required: true, description: 'Check-in date (YYYY-MM-DD)' },
      {
        name: 'checkOut',
        type: 'date',
        required: true,
        description: 'Check-out date (YYYY-MM-DD)'
      },
      { name: 'rooms', type: 'array', required: true, description: 'Array of room bookings' },
      { name: 'contact', type: 'object', required: true, description: 'Contact information' },
      { name: 'billing', type: 'object', description: 'Billing information (optional)' },
      { name: 'specialRequests', type: 'string', description: 'Special requests' },
      { name: 'countryCode', type: 'string', description: 'Guest country code' }
    ],
    requestExample: `{
  "hotelCode": "grand-hotel",
  "checkIn": "2025-02-01",
  "checkOut": "2025-02-05",
  "rooms": [
    {
      "roomTypeCode": "STD",
      "mealPlanCode": "BB",
      "adults": 2,
      "children": [5],
      "guests": [
        {
          "type": "adult",
          "title": "mr",
          "firstName": "John",
          "lastName": "Doe",
          "isLead": true
        },
        {
          "type": "adult",
          "title": "mrs",
          "firstName": "Jane",
          "lastName": "Doe"
        },
        {
          "type": "child",
          "firstName": "Tom",
          "lastName": "Doe",
          "age": 5
        }
      ],
      "specialRequests": "High floor please"
    }
  ],
  "contact": {
    "email": "john.doe@example.com",
    "phone": "+90 555 123 4567",
    "firstName": "John",
    "lastName": "Doe"
  },
  "billing": {
    "companyName": "Acme Inc",
    "taxNumber": "1234567890"
  },
  "specialRequests": "Late check-in"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "bookingNumber": "BK2501001ABC",
    "status": "pending",
    "hotel": {
      "name": "Grand Hotel",
      "slug": "grand-hotel"
    },
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "nights": 4,
    "rooms": 1,
    "guests": { "adults": 2, "children": 1 },
    "pricing": {
      "currency": "TRY",
      "subtotal": 12000,
      "totalDiscount": 2400,
      "tax": 0,
      "grandTotal": 9600
    },
    "contact": { "email": "john.doe@example.com" }
  }
}`
  },
  {
    method: 'GET',
    path: '/bookings/:bookingNumber',
    title: 'Get Booking',
    description: 'Retrieve booking details by reference number',
    pathParams: [
      { name: 'bookingNumber', type: 'string', description: 'Booking reference number' }
    ],
    queryParams: [
      {
        name: 'email',
        type: 'string',
        required: true,
        description: 'Contact email for verification'
      }
    ],
    responseExample: `{
  "success": true,
  "data": {
    "bookingNumber": "BK2501001ABC",
    "status": "confirmed",
    "hotel": {
      "name": "Grand Hotel",
      "slug": "grand-hotel",
      "address": { "city": "Antalya" },
      "image": "https://..."
    },
    "checkIn": "2025-02-01",
    "checkOut": "2025-02-05",
    "nights": 4,
    "rooms": [
      {
        "roomType": { "name": { "en": "Standard Room" }, "code": "STD" },
        "mealPlan": { "name": { "en": "Bed & Breakfast" }, "code": "BB" },
        "guests": [...],
        "pricing": { "currency": "TRY", "finalTotal": 9600 }
      }
    ],
    "guests": { "adults": 2, "children": 1, "lead": { "firstName": "John", "lastName": "Doe" } },
    "contact": { "email": "john.doe@example.com", "phone": "+90..." },
    "pricing": { "currency": "TRY", "grandTotal": 9600 },
    "payment": { "status": "paid", "paidAmount": 9600, "dueAmount": 0 },
    "createdAt": "2025-01-15T10:30:00Z",
    "confirmedAt": "2025-01-15T10:35:00Z"
  }
}`
  },
  {
    method: 'POST',
    path: '/bookings/:bookingNumber/cancel',
    title: 'Cancel Booking',
    description: 'Request cancellation of a booking',
    pathParams: [
      { name: 'bookingNumber', type: 'string', description: 'Booking reference number' }
    ],
    bodyParams: [
      {
        name: 'email',
        type: 'string',
        required: true,
        description: 'Contact email for verification'
      },
      { name: 'reason', type: 'string', description: 'Cancellation reason' }
    ],
    requestExample: `{
  "email": "john.doe@example.com",
  "reason": "Change of plans"
}`,
    responseExample: `{
  "success": true,
  "data": {
    "bookingNumber": "BK2501001ABC",
    "status": "cancelled",
    "cancellation": {
      "cancelledAt": "2025-01-20T14:30:00Z",
      "reason": "Change of plans",
      "refundPercent": 100,
      "refundAmount": 9600,
      "refundStatus": "pending"
    }
  }
}`
  }
]

const responseCodes = [
  { code: 200, status: 'OK', description: 'Request successful' },
  { code: 201, status: 'Created', description: 'Resource created successfully (e.g., booking)' },
  { code: 400, status: 'Bad Request', description: 'Invalid request parameters or body' },
  {
    code: 404,
    status: 'Not Found',
    description: 'Resource not found (hotel, room type, booking, etc.)'
  },
  { code: 429, status: 'Too Many Requests', description: 'Rate limit exceeded' },
  {
    code: 500,
    status: 'Internal Server Error',
    description: 'Server error, please try again later'
  }
]
</script>
