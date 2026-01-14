<script setup>
import { ref } from 'vue';

const expandedSection = ref('payment');
const copySuccess = ref('');

function toggleSection(section) {
  expandedSection.value = expandedSection.value === section ? '' : section;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  copySuccess.value = text.slice(0, 20);
  setTimeout(() => copySuccess.value = '', 2000);
}

const baseUrl = import.meta.env.VITE_API_URL || 'https://lab.orsmodule.com/api';

// API Sections
const sections = [
  {
    id: 'auth',
    title: 'Authentication',
    icon: 'key',
    description: 'API erişimi için kimlik doğrulama',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/login',
        description: 'JWT token almak için giriş yapın',
        auth: false,
        request: {
          email: 'user@example.com',
          password: 'password123'
        },
        response: {
          status: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '...',
            email: 'user@example.com',
            name: 'User Name',
            role: 'admin'
          }
        }
      },
      {
        method: 'GET',
        path: '/auth/me',
        description: 'Mevcut kullanıcı bilgilerini getir',
        auth: 'JWT',
        response: {
          status: true,
          user: {
            id: '...',
            email: 'user@example.com',
            name: 'User Name',
            role: 'admin',
            company: { id: '...', name: 'Company', code: 'comp' }
          }
        }
      }
    ]
  },
  {
    id: 'payment',
    title: 'Payment Operations',
    icon: 'payment',
    description: 'Ödeme işlemleri: tahsilat, iade, iptal',
    endpoints: [
      {
        method: 'POST',
        path: '/payment/bin',
        description: 'BIN sorgula ve taksit seçeneklerini al',
        auth: 'API Key',
        request: {
          bin: '54066700',
          amount: 150.00,
          currency: 'try',
          company: '...'
        },
        response: {
          success: true,
          card: {
            brand: 'mastercard',
            type: 'credit',
            bank: 'Akbank',
            family: 'axess'
          },
          pos: {
            id: '...',
            name: 'Akbank POS',
            provider: 'akbank'
          },
          installments: [
            { count: 1, amount: 150.00, totalAmount: 150.00, commission: 0 },
            { count: 3, amount: 51.50, totalAmount: 154.50, commission: 3 },
            { count: 6, amount: 26.50, totalAmount: 159.00, commission: 6 }
          ]
        }
      },
      {
        method: 'POST',
        path: '/payment/pay',
        description: '3D Secure ödeme başlat',
        auth: 'API Key',
        request: {
          posId: '...',
          amount: 150.00,
          currency: 'try',
          installment: 1,
          card: {
            holder: 'JOHN DOE',
            number: '5406670000000009',
            expiry: '12/25',
            cvv: '123'
          },
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+905551234567',
            ip: '192.168.1.1',
            address: 'Istanbul, Turkey'
          },
          externalId: 'booking-12345'
        },
        response: {
          success: true,
          transactionId: '...',
          formUrl: 'https://payment.example.com/payment/{id}/form'
        },
        notes: [
          'formUrl\'e kullanıcıyı iframe veya yeni sayfa ile yönlendirin',
          'Banka 3D doğrulama sayfasını gösterecektir',
          'Callback sonrası result postMessage ile iletilir'
        ]
      },
      {
        method: 'GET',
        path: '/payment/:id',
        description: 'Ödeme durumunu sorgula',
        auth: 'API Key',
        response: {
          status: true,
          transaction: {
            _id: '...',
            status: 'success',
            amount: 150.00,
            currency: 'try',
            result: {
              success: true,
              authCode: 'ABC123',
              refNumber: '123456789'
            },
            createdAt: '2025-01-15T10:30:00Z',
            completedAt: '2025-01-15T10:31:00Z'
          }
        }
      },
      {
        method: 'POST',
        path: '/payment/refund',
        description: 'Tamamlanmış ödemeyi iade et',
        auth: 'API Key',
        request: {
          transactionId: '...'
        },
        response: {
          status: true,
          success: true,
          message: 'Iade basarili',
          refNumber: '987654321'
        },
        notes: [
          'Sadece status=success olan işlemler iade edilebilir',
          'Tam iade yapılır (kısmi iade desteklenmiyor)'
        ]
      },
      {
        method: 'POST',
        path: '/payment/cancel',
        description: 'Aynı gün ödemeyi iptal et',
        auth: 'API Key',
        request: {
          transactionId: '...'
        },
        response: {
          status: true,
          success: true,
          message: 'Iptal basarili'
        },
        notes: [
          'Sadece aynı gün içindeki işlemler iptal edilebilir',
          'Gün sonu sonrası iade kullanın'
        ]
      },
      {
        method: 'GET',
        path: '/payment/status/:id',
        description: 'Bankadan işlem durumu sorgula',
        auth: 'API Key',
        response: {
          status: true,
          success: true,
          orderId: 'ORS12345',
          amount: '150.00',
          authCode: 'ABC123',
          rawResponse: {}
        }
      },
      {
        method: 'POST',
        path: '/payment/pre-auth',
        description: 'Ön provizyon (tutar bloke)',
        auth: 'API Key',
        request: {
          posId: '...',
          amount: 150.00,
          currency: 'try',
          card: { holder: '...', number: '...', expiry: '...', cvv: '...' },
          customer: {}
        },
        response: {
          status: true,
          success: true,
          message: 'On provizyon basarili',
          authCode: 'ABC123',
          refNumber: '123456789'
        }
      },
      {
        method: 'POST',
        path: '/payment/post-auth',
        description: 'Ön provizyonu kapat (tutarı çek)',
        auth: 'API Key',
        request: {
          transactionId: '...'
        },
        response: {
          status: true,
          success: true,
          message: 'Provizyon kapama basarili'
        }
      },
      {
        method: 'GET',
        path: '/payment/capabilities/:posId',
        description: 'POS özelliklerini sorgula',
        auth: 'API Key',
        response: {
          status: true,
          capabilities: {
            payment3D: true,
            paymentDirect: true,
            refund: true,
            cancel: true,
            status: true,
            preAuth: true,
            postAuth: true,
            paymentModels: ['3d', '3d_pay', 'regular']
          }
        }
      }
    ]
  },
  {
    id: 'pos',
    title: 'POS Management',
    icon: 'point_of_sale',
    description: 'Sanal POS yönetimi',
    endpoints: [
      {
        method: 'GET',
        path: '/pos',
        description: 'POS listesi',
        auth: 'API Key',
        params: [
          { name: 'company', type: 'string', desc: 'Firma ID (opsiyonel)' }
        ],
        response: {
          status: true,
          posList: [
            {
              _id: '...',
              name: 'Garanti POS',
              bankCode: 'garanti',
              provider: 'garanti',
              currencies: ['try', 'eur', 'usd'],
              status: true,
              testMode: false,
              bank: { name: 'Garanti BBVA', code: 'garanti' }
            }
          ]
        }
      },
      {
        method: 'GET',
        path: '/pos/banks',
        description: 'Desteklenen banka listesi',
        auth: 'API Key',
        response: {
          status: true,
          banks: [
            { code: 'garanti', name: 'Garanti BBVA', provider: 'garanti', providerSupported: true },
            { code: 'akbank', name: 'Akbank', provider: 'akbank', providerSupported: true },
            { code: 'ykb', name: 'Yapı Kredi', provider: 'ykb', providerSupported: true }
          ]
        }
      },
      {
        method: 'POST',
        path: '/pos',
        description: 'Yeni POS oluştur',
        auth: 'API Key',
        request: {
          company: '...',
          name: 'My POS',
          bankCode: 'garanti',
          currencies: ['try'],
          testMode: true,
          credentials: {
            merchantId: '...',
            terminalId: '...',
            username: '...',
            password: '...',
            secretKey: '...'
          },
          urls: {
            gate: 'https://...',
            api: 'https://...'
          }
        },
        response: {
          status: true,
          pos: {}
        }
      },
      {
        method: 'PUT',
        path: '/pos/:id',
        description: 'POS güncelle',
        auth: 'API Key',
        request: {
          name: 'Updated Name',
          status: true,
          testMode: false,
          credentials: {},
          installment: {
            enabled: true,
            maxCount: 12
          }
        }
      },
      {
        method: 'POST',
        path: '/pos/:id/set-default/:currency',
        description: 'Para birimi için varsayılan POS ayarla',
        auth: 'API Key'
      },
      {
        method: 'DELETE',
        path: '/pos/:id',
        description: 'POS sil',
        auth: 'API Key'
      }
    ]
  },
  {
    id: 'transactions',
    title: 'Transactions',
    icon: 'receipt_long',
    description: 'İşlem geçmişi ve istatistikler',
    endpoints: [
      {
        method: 'GET',
        path: '/transactions',
        description: 'İşlem listesi',
        auth: 'API Key',
        params: [
          { name: 'page', type: 'number', desc: 'Sayfa (default: 1)' },
          { name: 'limit', type: 'number', desc: 'Sayfa başına kayıt (default: 20)' },
          { name: 'status', type: 'string', desc: 'pending, success, failed, refunded, cancelled' },
          { name: 'currency', type: 'string', desc: 'try, eur, usd, gbp' },
          { name: 'company', type: 'string', desc: 'Firma ID' },
          { name: 'pos', type: 'string', desc: 'POS ID' },
          { name: 'startDate', type: 'date', desc: 'Başlangıç tarihi (YYYY-MM-DD)' },
          { name: 'endDate', type: 'date', desc: 'Bitiş tarihi (YYYY-MM-DD)' },
          { name: 'minAmount', type: 'number', desc: 'Minimum tutar' },
          { name: 'maxAmount', type: 'number', desc: 'Maximum tutar' },
          { name: 'orderId', type: 'string', desc: 'Order ID arama' }
        ],
        response: {
          status: true,
          transactions: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 100,
            pages: 5
          }
        }
      },
      {
        method: 'GET',
        path: '/transactions/stats',
        description: 'İşlem istatistikleri',
        auth: 'API Key',
        params: [
          { name: 'company', type: 'string', desc: 'Firma ID (opsiyonel)' }
        ],
        response: {
          status: true,
          stats: {
            byCurrency: [
              {
                _id: 'try',
                statuses: [
                  { status: 'success', count: 150, total: 45000 },
                  { status: 'failed', count: 12, total: 3500 }
                ],
                totalCount: 162,
                totalAmount: 48500
              }
            ],
            today: [
              { _id: 'success', count: 25, total: 7500 },
              { _id: 'failed', count: 3, total: 900 }
            ]
          }
        }
      },
      {
        method: 'GET',
        path: '/transactions/:id',
        description: 'İşlem detayı',
        auth: 'API Key',
        response: {
          status: true,
          transaction: {
            _id: '...',
            status: 'success',
            amount: 150.00,
            currency: 'try',
            installment: 1,
            pos: { _id: '...', name: 'Garanti POS' },
            result: {},
            logs: [],
            createdAt: '...',
            completedAt: '...'
          }
        }
      }
    ]
  },
  {
    id: 'bins',
    title: 'BIN Database',
    icon: 'credit_score',
    description: 'Kart BIN veritabanı yönetimi',
    endpoints: [
      {
        method: 'GET',
        path: '/bins',
        description: 'BIN listesi',
        auth: 'API Key',
        params: [
          { name: 'page', type: 'number', desc: 'Sayfa' },
          { name: 'limit', type: 'number', desc: 'Sayfa başına kayıt' },
          { name: 'search', type: 'string', desc: 'BIN, banka veya aile ara' },
          { name: 'brand', type: 'string', desc: 'visa, mastercard, amex, troy' },
          { name: 'type', type: 'string', desc: 'credit, debit, prepaid' },
          { name: 'bank', type: 'string', desc: 'Banka adı' },
          { name: 'bankCode', type: 'string', desc: 'Banka kodu' },
          { name: 'family', type: 'string', desc: 'Kart ailesi (axess, world, bonus)' }
        ]
      },
      {
        method: 'GET',
        path: '/bins/lookup/:bin',
        description: 'BIN detayı sorgula (otomatik fetch)',
        auth: 'API Key',
        response: {
          status: true,
          bin: {
            bin: '54066700',
            brand: 'mastercard',
            type: 'credit',
            family: 'axess',
            bank: 'Akbank',
            bankCode: 'akbank',
            country: 'TR'
          }
        },
        notes: ['Veritabanında yoksa harici kaynaklardan otomatik çeker']
      },
      {
        method: 'GET',
        path: '/bins/stats',
        description: 'BIN istatistikleri',
        auth: 'API Key'
      },
      {
        method: 'POST',
        path: '/bins',
        description: 'Yeni BIN ekle',
        auth: 'API Key',
        request: {
          bin: '54066700',
          brand: 'mastercard',
          type: 'credit',
          family: 'axess',
          bank: 'Akbank',
          bankCode: 'akbank',
          country: 'TR'
        }
      },
      {
        method: 'POST',
        path: '/bins/bulk',
        description: 'Toplu BIN import',
        auth: 'API Key',
        request: {
          bins: [
            { bin: '54066700', brand: 'mastercard', bank: 'Akbank' }
          ]
        }
      }
    ]
  },
  {
    id: 'companies',
    title: 'Companies',
    icon: 'business',
    description: 'Firma ve API key yönetimi',
    endpoints: [
      {
        method: 'GET',
        path: '/companies',
        description: 'Firma listesi',
        auth: 'API Key'
      },
      {
        method: 'POST',
        path: '/companies',
        description: 'Yeni firma oluştur',
        auth: 'API Key',
        request: {
          name: 'My Company',
          code: 'mycompany',
          settings: {}
        },
        response: {
          status: true,
          company: {},
          apiKey: {
            key: 'pk_...',
            secret: 'sk_...'
          }
        },
        notes: ['API Key secret sadece bir kez gösterilir!']
      },
      {
        method: 'GET',
        path: '/companies/:id/api-keys',
        description: 'Firma API key listesi',
        auth: 'API Key'
      },
      {
        method: 'POST',
        path: '/companies/:id/api-keys',
        description: 'Yeni API key oluştur',
        auth: 'API Key',
        request: {
          name: 'Production Key'
        }
      }
    ]
  },
  {
    id: 'public',
    title: 'Public Routes',
    icon: 'public',
    description: '3D Secure callback için public endpoint\'ler',
    endpoints: [
      {
        method: 'GET',
        path: '/payment/:id/form',
        description: '3D form HTML sayfası',
        auth: false,
        notes: [
          'Tarayıcı bu URL\'e yönlendirilir',
          'Otomatik olarak bankaya form POST eder',
          'iframe veya yeni pencerede açılabilir'
        ]
      },
      {
        method: 'POST',
        path: '/payment/:id/callback',
        description: 'Banka 3D callback',
        auth: false,
        notes: [
          'Banka tarafından çağrılır',
          'postMessage ile sonuç iletilir',
          'HTML sonuç sayfası döner'
        ]
      }
    ]
  }
];

const methodColors = {
  GET: 'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
  PUT: 'bg-yellow-100 text-yellow-700',
  PATCH: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700'
};
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">ORS Payment API Documentation</h1>
      <p class="text-gray-600 mb-4">Sanal POS ödeme işlemleri için REST API</p>

      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <span class="material-icons text-gray-400">link</span>
          <code class="bg-gray-100 px-2 py-1 rounded">{{ baseUrl }}/payment</code>
        </div>
        <div class="flex items-center gap-2">
          <span class="material-icons text-gray-400">lock</span>
          <span>API Key: <code class="bg-gray-100 px-2 py-1 rounded">X-API-Key: pk_xxx</code></span>
        </div>
      </div>
    </div>

    <!-- Quick Reference -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Quick Reference</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">Authentication</h3>
          <p class="text-sm text-gray-600">Header'da API Key gönderin:</p>
          <code class="text-xs bg-gray-100 px-2 py-1 rounded block mt-2">X-API-Key: pk_your_api_key</code>
        </div>
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">Response Format</h3>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{
  "status": true,
  "data": { ... }
}</pre>
        </div>
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">Error Response</h3>
          <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{
  "status": false,
  "error": "Error message"
}</pre>
        </div>
      </div>
    </div>

    <!-- Supported Banks -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-lg font-semibold mb-4">Desteklenen Bankalar</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Garanti BBVA</div>
          <div class="text-xs text-gray-500">garanti</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Akbank</div>
          <div class="text-xs text-gray-500">akbank</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Yapı Kredi</div>
          <div class="text-xs text-gray-500">ykb</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Payten (NestPay)</div>
          <div class="text-xs text-gray-500">payten</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">QNB Finansbank</div>
          <div class="text-xs text-gray-500">qnb</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">VakıfBank</div>
          <div class="text-xs text-gray-500">vakifbank</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Denizbank</div>
          <div class="text-xs text-gray-500">denizbank</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">iyzico</div>
          <div class="text-xs text-gray-500">iyzico</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">PayTR</div>
          <div class="text-xs text-gray-500">paytr</div>
        </div>
        <div class="border rounded-lg p-3 text-center">
          <div class="font-medium">Sigmapay</div>
          <div class="text-xs text-gray-500">sigmapay</div>
        </div>
      </div>
    </div>

    <!-- API Sections -->
    <div class="space-y-4">
      <div
        v-for="section in sections"
        :key="section.id"
        class="bg-white rounded-lg shadow overflow-hidden"
      >
        <!-- Section Header -->
        <button
          @click="toggleSection(section.id)"
          class="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="material-icons text-primary-500">{{ section.icon }}</span>
            <div class="text-left">
              <h2 class="text-lg font-semibold text-gray-900">{{ section.title }}</h2>
              <p class="text-sm text-gray-500">{{ section.description }}</p>
            </div>
          </div>
          <span class="material-icons text-gray-400 transition-transform" :class="{ 'rotate-180': expandedSection === section.id }">
            expand_more
          </span>
        </button>

        <!-- Section Content -->
        <div v-if="expandedSection === section.id" class="border-t">
          <div
            v-for="(endpoint, idx) in section.endpoints"
            :key="idx"
            class="border-b last:border-b-0 p-6"
          >
            <!-- Endpoint Header -->
            <div class="flex items-center gap-3 mb-4">
              <span :class="['px-2 py-1 rounded text-xs font-bold', methodColors[endpoint.method]]">
                {{ endpoint.method }}
              </span>
              <code class="text-sm font-mono bg-gray-100 px-2 py-1 rounded flex-1">
                {{ endpoint.path }}
              </code>
              <span v-if="endpoint.auth" class="text-xs text-gray-500 flex items-center gap-1">
                <span class="material-icons text-sm">lock</span>
                {{ endpoint.auth }}
              </span>
              <span v-else class="text-xs text-green-600 flex items-center gap-1">
                <span class="material-icons text-sm">lock_open</span>
                Public
              </span>
            </div>

            <p class="text-gray-600 mb-4">{{ endpoint.description }}</p>

            <!-- Parameters -->
            <div v-if="endpoint.params" class="mb-4">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Query Parameters</h4>
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left border-b">
                    <th class="pb-2 font-medium">Parameter</th>
                    <th class="pb-2 font-medium">Type</th>
                    <th class="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="param in endpoint.params" :key="param.name" class="border-b last:border-b-0">
                    <td class="py-2"><code class="text-xs bg-gray-100 px-1 rounded">{{ param.name }}</code></td>
                    <td class="py-2 text-gray-500">{{ param.type }}</td>
                    <td class="py-2 text-gray-600">{{ param.desc }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Request Body -->
            <div v-if="endpoint.request" class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">Request Body</h4>
                <button
                  @click="copyToClipboard(JSON.stringify(endpoint.request, null, 2))"
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  Copy
                </button>
              </div>
              <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(endpoint.request, null, 2) }}</pre>
            </div>

            <!-- Response -->
            <div v-if="endpoint.response" class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-700">Response</h4>
                <button
                  @click="copyToClipboard(JSON.stringify(endpoint.response, null, 2))"
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  Copy
                </button>
              </div>
              <pre class="bg-gray-800 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(endpoint.response, null, 2) }}</pre>
            </div>

            <!-- Notes -->
            <div v-if="endpoint.notes" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 class="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                <span class="material-icons text-sm">info</span>
                Notes
              </h4>
              <ul class="text-sm text-yellow-700 space-y-1">
                <li v-for="(note, i) in endpoint.notes" :key="i" class="flex items-start gap-2">
                  <span class="text-yellow-500">•</span>
                  {{ note }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Flow -->
    <div class="bg-white rounded-lg shadow p-6 mt-6">
      <h2 class="text-lg font-semibold mb-4">3D Secure Payment Flow</h2>
      <div class="flex items-center justify-between overflow-x-auto pb-4">
        <div class="flex items-center gap-4 min-w-max">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <span class="material-icons text-blue-600">credit_card</span>
            </div>
            <div class="text-xs font-medium">1. POST /pay</div>
            <div class="text-xs text-gray-500">Ödeme başlat</div>
          </div>
          <span class="material-icons text-gray-300">arrow_forward</span>
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <span class="material-icons text-purple-600">open_in_browser</span>
            </div>
            <div class="text-xs font-medium">2. formUrl</div>
            <div class="text-xs text-gray-500">iframe/redirect</div>
          </div>
          <span class="material-icons text-gray-300">arrow_forward</span>
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <span class="material-icons text-orange-600">security</span>
            </div>
            <div class="text-xs font-medium">3. 3D Secure</div>
            <div class="text-xs text-gray-500">Banka doğrulama</div>
          </div>
          <span class="material-icons text-gray-300">arrow_forward</span>
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <span class="material-icons text-green-600">check_circle</span>
            </div>
            <div class="text-xs font-medium">4. Callback</div>
            <div class="text-xs text-gray-500">postMessage</div>
          </div>
          <span class="material-icons text-gray-300">arrow_forward</span>
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <span class="material-icons text-gray-600">search</span>
            </div>
            <div class="text-xs font-medium">5. GET /:id</div>
            <div class="text-xs text-gray-500">Durum sorgula</div>
          </div>
        </div>
      </div>

      <div class="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 class="font-medium mb-2">postMessage Handler Example</h4>
        <pre class="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">window.addEventListener('message', (event) => {
  if (event.data?.type === 'payment_result') {
    const result = event.data.data;
    if (result.success) {
      console.log('Payment successful:', result);
    } else {
      console.log('Payment failed:', result.message);
    }
    // Close iframe or redirect
  }
});</pre>
      </div>
    </div>

    <!-- Copy Success Toast -->
    <div
      v-if="copySuccess"
      class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
    >
      <span class="material-icons text-green-400">check</span>
      Copied!
    </div>
  </div>
</template>
