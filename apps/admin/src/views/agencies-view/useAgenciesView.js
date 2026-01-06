/**
 * Agencies View Composable
 * Extracts all logic from AgenciesView.vue for better maintainability
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { usePartnerContext } from '@/composables/usePartnerContext'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import agencyService from '@/services/agencyService'
import hotelService from '@/services/hotelService'
import { CREDIT_LOW_THRESHOLD, DEFAULT_COMMISSION_RATES } from '@/constants'

export function useAgenciesView() {
  const { t, locale } = useI18n()
  const toast = useToast()
  const router = useRouter()

  // Status helpers from centralized composable
  const statusHelpers = useStatusHelpers()

  // Async action composables
  const { isLoading: loading, execute: executeFetch } = useAsyncAction({ showSuccessToast: false })
  const { isLoading: submitting, execute: executeSubmit } = useAsyncAction()
  const { isLoading: deleting, execute: executeDelete } = useAsyncAction()
  const { isLoading: approving, execute: executeApprove } = useAsyncAction()
  const { isLoading: uploading, execute: executeUpload } = useAsyncAction()
  const { execute: executeFetchHotels } = useAsyncAction({ showSuccessToast: false, showErrorToast: false })

  // State
  const agencies = ref([])
  const hotels = ref([])
  const showModal = ref(false)
  const showDeleteModal = ref(false)
  const showApproveModal = ref(false)
  const isEditing = ref(false)
  const selectedAgency = ref(null)
  const activeTab = ref('basic')

  // Filters
  const searchQuery = ref('')
  const statusFilter = ref('')
  const creditFilter = ref('')
  let searchTimeout = null

  // Form
  const getDefaultForm = () => ({
    companyName: '',
    tradeName: '',
    email: '',
    phone: '',
    taxOffice: '',
    taxNumber: '',
    status: 'active',
    address: { street: '', city: '', country: '', postalCode: '' },
    commission: {
      mode: 'net',
      hotel: DEFAULT_COMMISSION_RATES.hotel,
      tour: DEFAULT_COMMISSION_RATES.tour,
      transfer: DEFAULT_COMMISSION_RATES.transfer
    },
    creditLimit: { enabled: false, amount: 0, currency: 'TRY', used: 0 },
    salesRestrictions: { allowedCountries: [], allowedHotels: [], blockedHotels: [] },
    paymentSettings: {
      allowedMethods: ['creditCard', 'bankTransfer'],
      defaultMethod: 'creditCard',
      maxInstallments: 12
    }
  })

  const form = ref(getDefaultForm())
  const errors = ref({})
  const selectedCountryToAdd = ref('')

  // Stats
  const stats = computed(() => {
    const total = agencies.value.length
    const active = agencies.value.filter(a => a.status === 'active').length
    const pending = agencies.value.filter(a => a.status === 'pending').length
    const totalCredit = agencies.value.reduce((sum, a) => {
      if (a.creditLimit?.enabled) {
        return sum + (a.creditLimit.amount - (a.creditLimit.used || 0))
      }
      return sum
    }, 0)
    return { total, active, pending, totalCredit }
  })

  // Filtered agencies
  const filteredAgencies = computed(() => {
    let result = [...agencies.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        a =>
          (a.companyName || a.name || '').toLowerCase().includes(query) ||
          (a.email || '').toLowerCase().includes(query) ||
          (a.phone || '').includes(query) ||
          (a.taxNumber || '').includes(query)
      )
    }

    if (statusFilter.value) {
      result = result.filter(a => a.status === statusFilter.value)
    }

    if (creditFilter.value) {
      if (creditFilter.value === 'enabled') {
        result = result.filter(a => a.creditLimit?.enabled)
      } else if (creditFilter.value === 'disabled') {
        result = result.filter(a => !a.creditLimit?.enabled)
      } else if (creditFilter.value === 'low') {
        result = result.filter(a => {
          if (!a.creditLimit?.enabled) return false
          const available = a.creditLimit.amount - (a.creditLimit.used || 0)
          return available < a.creditLimit.amount * CREDIT_LOW_THRESHOLD
        })
      }
    }

    return result
  })

  const hasActiveFilters = computed(
    () => searchQuery.value || statusFilter.value || creditFilter.value
  )

  const hasBasicErrors = computed(() => !!errors.value.companyName || !!errors.value.email)

  // DataTable columns
  const columns = computed(() => [
    { key: 'companyName', label: t('agencies.agency'), sortable: true },
    { key: 'email', label: t('agencies.contact'), sortable: false },
    { key: 'status', label: t('common.status.label'), sortable: true },
    { key: 'creditLimit', label: t('agencies.creditLimit'), sortable: false },
    { key: 'commission', label: t('agencies.commission'), sortable: false }
  ])

  // Tabs
  const tabs = computed(() => [
    { id: 'basic', label: t('agencies.infoTab'), icon: 'business' },
    { id: 'finance', label: t('agencies.commissionTab'), icon: 'account_balance' },
    { id: 'sales', label: t('agencies.salesRestrictionsTab'), icon: 'public' },
    { id: 'payment', label: t('agencies.paymentSettingsTab'), icon: 'payment' },
    { id: 'documents', label: t('agencies.documentsTab'), icon: 'folder' }
  ])

  // Validation
  const validateForm = () => {
    errors.value = {}
    if (!form.value.companyName?.trim()) errors.value.companyName = t('validation.required')
    if (!form.value.email?.trim()) {
      errors.value.email = t('validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
      errors.value.email = t('validation.email')
    }
    return Object.keys(errors.value).length === 0
  }

  // Filter functions
  const debouncedSearch = () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {}, 300)
  }

  const clearAllFilters = () => {
    searchQuery.value = ''
    statusFilter.value = ''
    creditFilter.value = ''
  }

  // Country/Hotel selection
  const addCountry = (code) => {
    if (code && !form.value.salesRestrictions.allowedCountries.includes(code)) {
      form.value.salesRestrictions.allowedCountries.push(code)
    }
    selectedCountryToAdd.value = ''
  }

  const removeCountry = (code) => {
    form.value.salesRestrictions.allowedCountries =
      form.value.salesRestrictions.allowedCountries.filter(c => c !== code)
  }

  // Payment method toggle
  const togglePaymentMethod = (method) => {
    const index = form.value.paymentSettings.allowedMethods.indexOf(method)
    if (index === -1) {
      form.value.paymentSettings.allowedMethods.push(method)
    } else {
      form.value.paymentSettings.allowedMethods.splice(index, 1)
    }
  }

  // API calls
  const fetchAgencies = async () => {
    await executeFetch(
      () => agencyService.getAgencies(),
      {
        errorMessage: 'common.loadFailed',
        onSuccess: response => {
          agencies.value = Array.isArray(response.data)
            ? response.data
            : response.data.agencies || response.data.items || []
        }
      }
    )
  }

  const fetchHotels = async () => {
    await executeFetchHotels(
      () => hotelService.getHotels({ limit: 1000 }),
      {
        onSuccess: response => {
          if (response.success) {
            hotels.value = response.data.items || response.data.hotels || []
          }
        },
        onError: error => {
          console.error('Failed to fetch hotels', error)
        }
      }
    )
  }

  const openCreateModal = () => {
    isEditing.value = false
    selectedAgency.value = null
    form.value = getDefaultForm()
    errors.value = {}
    activeTab.value = 'basic'
    showModal.value = true
  }

  const openEditModal = (agency) => {
    isEditing.value = true
    selectedAgency.value = agency
    activeTab.value = 'basic'
    errors.value = {}
    form.value = {
      companyName: agency.companyName || '',
      tradeName: agency.tradeName || '',
      email: agency.email || '',
      phone: agency.phone || '',
      taxOffice: agency.taxOffice || '',
      taxNumber: agency.taxNumber || '',
      status: agency.status || 'active',
      address: {
        street: agency.address?.street || '',
        city: agency.address?.city || '',
        country: agency.address?.country || '',
        postalCode: agency.address?.postalCode || ''
      },
      commission: {
        mode: agency.commission?.mode || 'net',
        hotel: agency.commission?.hotel ?? DEFAULT_COMMISSION_RATES.hotel,
        tour: agency.commission?.tour ?? DEFAULT_COMMISSION_RATES.tour,
        transfer: agency.commission?.transfer ?? DEFAULT_COMMISSION_RATES.transfer
      },
      creditLimit: {
        enabled: agency.creditLimit?.enabled || false,
        amount: agency.creditLimit?.amount || 0,
        currency: agency.creditLimit?.currency || 'TRY',
        used: agency.creditLimit?.used || 0
      },
      salesRestrictions: {
        allowedCountries: agency.salesRestrictions?.allowedCountries || [],
        allowedHotels: agency.salesRestrictions?.allowedHotels || [],
        blockedHotels: agency.salesRestrictions?.blockedHotels || []
      },
      paymentSettings: {
        allowedMethods: agency.paymentSettings?.allowedMethods || ['creditCard', 'bankTransfer'],
        defaultMethod: agency.paymentSettings?.defaultMethod || 'creditCard',
        maxInstallments: agency.paymentSettings?.maxInstallments || 12
      }
    }
    showModal.value = true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      activeTab.value = 'basic'
      toast.error(t('validation.fixErrors'))
      return
    }

    const actionFn = isEditing.value
      ? () => agencyService.updateAgency(selectedAgency.value._id, form.value)
      : () => agencyService.createAgency(form.value)

    await executeSubmit(actionFn, {
      successMessage: isEditing.value ? 'agencies.updateSuccess' : 'agencies.createSuccess',
      errorMessage: 'common.operationFailed',
      onSuccess: () => {
        showModal.value = false
        fetchAgencies()
      }
    })
  }

  const confirmDelete = (agency) => {
    selectedAgency.value = agency
    showDeleteModal.value = true
  }

  const deleteAgency = async () => {
    await executeDelete(
      () => agencyService.deleteAgency(selectedAgency.value._id),
      {
        successMessage: 'agencies.deleteSuccess',
        errorMessage: 'common.deleteFailed',
        onSuccess: () => {
          showDeleteModal.value = false
          fetchAgencies()
        }
      }
    )
  }

  const confirmApprove = (agency) => {
    selectedAgency.value = agency
    showApproveModal.value = true
  }

  const approveAgency = async () => {
    await executeApprove(
      () => agencyService.approveAgency(selectedAgency.value._id),
      {
        successMessage: 'agencies.approveSuccess',
        errorMessage: 'common.operationFailed',
        onSuccess: () => {
          showApproveModal.value = false
          fetchAgencies()
        }
      }
    )
  }

  const goToUsers = (agency) => {
    router.push({ name: 'agency-users', params: { agencyId: agency._id } })
  }

  const uploadDocument = async (file) => {
    if (!selectedAgency.value) return

    const formData = new FormData()
    formData.append('document', file)
    formData.append('documentType', 'license')

    await executeUpload(
      () => agencyService.uploadDocument(selectedAgency.value._id, formData),
      {
        successMessage: 'common.uploadSuccess',
        errorMessage: 'common.uploadFailed',
        onSuccess: async () => {
          const response = await agencyService.getAgency(selectedAgency.value._id)
          if (response.success) selectedAgency.value = response.data
        }
      }
    )
  }

  const confirmDeleteDocument = async (documentId) => {
    if (!selectedAgency.value) return

    await executeDelete(
      () => agencyService.deleteDocument(selectedAgency.value._id, documentId),
      {
        successMessage: 'common.deleteSuccess',
        errorMessage: 'common.deleteFailed',
        onSuccess: async () => {
          const response = await agencyService.getAgency(selectedAgency.value._id)
          if (response.success) selectedAgency.value = response.data
        }
      }
    )
  }

  // Setup partner context
  const setupPartnerContext = () => {
    usePartnerContext({
      onPartnerChange: partner => {
        if (partner) {
          fetchAgencies()
          fetchHotels()
        }
      },
      immediate: true
    })
  }

  return {
    // State
    agencies,
    hotels,
    showModal,
    showDeleteModal,
    showApproveModal,
    isEditing,
    selectedAgency,
    activeTab,
    form,
    errors,
    selectedCountryToAdd,

    // Filters
    searchQuery,
    statusFilter,
    creditFilter,

    // Loading states
    loading,
    submitting,
    deleting,
    approving,
    uploading,

    // Computed
    stats,
    filteredAgencies,
    hasActiveFilters,
    hasBasicErrors,
    columns,
    tabs,

    // Status helpers
    ...statusHelpers,

    // Methods
    fetchAgencies,
    fetchHotels,
    openCreateModal,
    openEditModal,
    handleSubmit,
    confirmDelete,
    deleteAgency,
    confirmApprove,
    approveAgency,
    goToUsers,
    uploadDocument,
    confirmDeleteDocument,
    debouncedSearch,
    clearAllFilters,
    addCountry,
    removeCountry,
    togglePaymentMethod,
    setupPartnerContext,

    // i18n
    locale
  }
}
