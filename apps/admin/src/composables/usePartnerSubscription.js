/**
 * Partner Subscription Composable
 * Extracted from PartnersView.vue - handles subscription management logic
 */
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import partnerService from '@/services/partnerService'
import subscriptionInvoiceService from '@/services/subscriptionInvoiceService'

export function usePartnerSubscription() {
  const { t } = useI18n()

  // State
  const showSubscriptionModal = ref(false)
  const showEditPurchaseModal = ref(false)
  const showMarkPaidModal = ref(false)
  const subscriptionPlans = ref([])
  const subscriptionStatus = ref(null)
  const partnerInvoices = ref([])
  const useCustomPmsLimit = ref(false)
  const activeSubscriptionTab = ref('purchases')
  const savingSubscription = ref(false)
  const addingPurchase = ref(false)
  const updatingPurchase = ref(false)
  const markingPaid = ref(false)

  const subscriptionTabs = [
    { id: 'purchases', label: t('partners.subscription.purchasesTab') },
    { id: 'settings', label: t('partners.subscription.settingsTab') },
    { id: 'notes', label: t('partners.subscription.notesTab') }
  ]

  const subscriptionForm = ref({
    customLimits: {
      pmsMaxHotels: null
    },
    notes: ''
  })

  const purchaseForm = ref({
    plan: 'business',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    amount: null,
    currency: 'USD'
  })

  const editPurchaseForm = ref({
    _id: null,
    plan: 'business',
    startDate: '',
    endDate: '',
    amount: null,
    currency: 'USD',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  })

  const markPaidForm = ref({
    _id: null,
    plan: '',
    amount: null,
    currency: 'USD',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  })

  // Subscription status map for badges
  const subscriptionStatusMap = {
    active: { variant: 'success', label: t('partners.subscription.statusActive') },
    expired: { variant: 'danger', label: t('partners.subscription.statusExpired') },
    grace_period: { variant: 'warning', label: t('partners.subscription.statusGracePeriod') },
    cancelled: { variant: 'secondary', label: t('partners.subscription.statusCancelled') },
    suspended: { variant: 'danger', label: t('partners.subscription.statusSuspended') }
  }

  // Helper functions for list display
  const getRemainingDays = row => {
    if (!row.subscription?.endDate) return null
    const endDate = new Date(row.subscription.endDate)
    const now = new Date()
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const getGracePeriodDays = row => {
    if (!row.subscription?.gracePeriodEndDate) return 0
    const gracePeriodEnd = new Date(row.subscription.gracePeriodEndDate)
    const now = new Date()
    const diff = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }

  const isPmsEnabledForRow = row => {
    const limit =
      row.subscription?.customLimits?.pmsMaxHotels ?? row.subscription?.features?.pms?.maxHotels ?? 0
    return limit > 0 || limit === -1
  }

  const getProvisionedHotels = row => {
    return row.pmsIntegration?.provisionedHotels?.filter(h => h.status === 'active').length || 0
  }

  const getPmsLimit = row => {
    const limit =
      row.subscription?.customLimits?.pmsMaxHotels ?? row.subscription?.features?.pms?.maxHotels ?? 0
    return limit === -1 ? '∞' : limit
  }

  const getSubscriptionStatusForRow = row => {
    if (!row.subscription?.startDate) return 'active'
    if (row.subscription?.status === 'cancelled') return 'cancelled'
    if (row.subscription?.status === 'suspended') return 'suspended'

    const now = new Date()
    const endDate = row.subscription?.endDate ? new Date(row.subscription.endDate) : null
    const gracePeriodEnd = row.subscription?.gracePeriodEndDate
      ? new Date(row.subscription.gracePeriodEndDate)
      : null

    if (endDate && now > endDate) {
      if (gracePeriodEnd && now <= gracePeriodEnd) {
        return 'grace_period'
      }
      return 'expired'
    }

    return 'active'
  }

  // Load subscription plans
  const loadSubscriptionPlans = async () => {
    try {
      const response = await partnerService.getSubscriptionPlans()
      subscriptionPlans.value = response.data || []
    } catch {
      subscriptionPlans.value = [
        {
          id: 'webdesign',
          name: 'Web Design',
          description: t('partners.subscription.planDescriptions.webdesign'),
          price: { yearly: 29 },
          features: { pms: { enabled: false, maxHotels: 0 }, webDesign: { enabled: true, maxSites: 1, ssl: true, customDomain: true } }
        },
        {
          id: 'business',
          name: 'Business',
          description: t('partners.subscription.planDescriptions.business'),
          price: { yearly: 118.9 },
          features: { pms: { enabled: false, maxHotels: 0 } }
        },
        {
          id: 'professional',
          name: 'Professional',
          description: t('partners.subscription.planDescriptions.professional'),
          price: { yearly: 178.8 },
          features: { pms: { enabled: true, maxHotels: 5 } }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          description: t('partners.subscription.planDescriptions.enterprise'),
          price: { yearly: 298.8 },
          features: { pms: { enabled: true, maxHotels: -1 } }
        }
      ]
    }
  }

  // Load subscription data for a partner
  const loadSubscriptionData = async partnerId => {
    try {
      const response = await partnerService.getSubscription(partnerId)
      subscriptionStatus.value = response.data

      subscriptionForm.value = {
        customLimits: {
          pmsMaxHotels: response.data?.customLimits?.pmsMaxHotels ?? null
        },
        notes: response.data?.notes || ''
      }

      useCustomPmsLimit.value = response.data?.customLimits?.pmsMaxHotels != null
      activeSubscriptionTab.value = 'purchases'

      const today = new Date().toISOString().split('T')[0]
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      purchaseForm.value = {
        plan: response.data?.plan || 'business',
        startDate: today,
        endDate: nextYear,
        amount: subscriptionPlans.value.find(p => p.id === (response.data?.plan || 'business'))?.price?.yearly || null,
        currency: 'USD'
      }

      try {
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(partnerId)
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }
    } catch {
      subscriptionStatus.value = null
      subscriptionForm.value = {
        customLimits: { pmsMaxHotels: null },
        notes: ''
      }
      useCustomPmsLimit.value = false
      activeSubscriptionTab.value = 'purchases'
      partnerInvoices.value = []
    }
  }

  // Open subscription modal for a partner
  const openSubscriptionModal = async (partner, selectedPartnerRef) => {
    selectedPartnerRef.value = partner
    showSubscriptionModal.value = true
    await loadSubscriptionData(partner._id)
  }

  // Save subscription settings
  const handleSaveSubscription = async (selectedPartner, onSuccess) => {
    if (!selectedPartner) return

    savingSubscription.value = true
    try {
      const data = {
        notes: subscriptionForm.value.notes
      }

      if (useCustomPmsLimit.value) {
        data.customLimits = {
          pmsMaxHotels: subscriptionForm.value.customLimits.pmsMaxHotels
        }
      } else {
        data.customLimits = {
          pmsMaxHotels: null
        }
      }

      const response = await partnerService.updateSubscription(selectedPartner._id, data)
      subscriptionStatus.value = response.data
      showSubscriptionModal.value = false
      onSuccess?.()
    } catch {
      // Error handled by API client
    } finally {
      savingSubscription.value = false
    }
  }

  // Add purchase
  const handleAddPurchase = async (selectedPartner, onSuccess) => {
    if (!selectedPartner || !purchaseForm.value.amount) return

    addingPurchase.value = true
    try {
      const response = await partnerService.addPurchase(selectedPartner._id, {
        plan: purchaseForm.value.plan,
        startDate: purchaseForm.value.startDate,
        endDate: purchaseForm.value.endDate,
        amount: purchaseForm.value.amount,
        currency: purchaseForm.value.currency
      })

      subscriptionStatus.value = response.data.subscription

      const today = new Date().toISOString().split('T')[0]
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      purchaseForm.value = {
        plan: response.data.subscription?.plan || 'business',
        startDate: today,
        endDate: nextYear,
        amount: null,
        currency: 'USD'
      }

      try {
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(selectedPartner._id)
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }

      onSuccess?.()
    } catch {
      // Error handled by API client
    } finally {
      addingPurchase.value = false
    }
  }

  // Open edit purchase modal
  const openEditPurchaseModal = (purchase) => {
    const formatDateForInput = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return d.toISOString().split('T')[0]
    }

    editPurchaseForm.value = {
      _id: purchase._id,
      plan: purchase.plan,
      startDate: formatDateForInput(purchase.period?.startDate),
      endDate: formatDateForInput(purchase.period?.endDate),
      amount: purchase.price?.amount,
      currency: purchase.price?.currency || 'USD',
      paymentMethod: purchase.payment?.method || 'bank_transfer',
      paymentReference: purchase.payment?.reference || '',
      paymentNotes: purchase.payment?.notes || ''
    }
    showEditPurchaseModal.value = true
  }

  // Handle update purchase
  const handleUpdatePurchase = async (selectedPartner, onSuccess) => {
    if (!selectedPartner || !editPurchaseForm.value._id) return

    updatingPurchase.value = true
    try {
      const response = await partnerService.updatePurchase(
        selectedPartner._id,
        editPurchaseForm.value._id,
        {
          plan: editPurchaseForm.value.plan,
          startDate: editPurchaseForm.value.startDate,
          endDate: editPurchaseForm.value.endDate,
          amount: editPurchaseForm.value.amount,
          currency: editPurchaseForm.value.currency,
          paymentMethod: editPurchaseForm.value.paymentMethod,
          paymentReference: editPurchaseForm.value.paymentReference,
          paymentNotes: editPurchaseForm.value.paymentNotes
        }
      )

      subscriptionStatus.value = response.data.subscription
      showEditPurchaseModal.value = false
      onSuccess?.()
    } catch {
      // Error handled by API client
    } finally {
      updatingPurchase.value = false
    }
  }

  // Open mark paid modal
  const openMarkPaidModal = (purchase) => {
    markPaidForm.value = {
      _id: purchase._id,
      plan: purchase.plan,
      amount: purchase.price?.amount,
      currency: purchase.price?.currency || 'USD',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentNotes: ''
    }
    showMarkPaidModal.value = true
  }

  // Handle mark as paid
  const handleMarkAsPaid = async (selectedPartner, onSuccess) => {
    if (!selectedPartner || !markPaidForm.value._id || !markPaidForm.value.paymentDate) return

    markingPaid.value = true
    try {
      const response = await partnerService.markPurchaseAsPaid(
        selectedPartner._id,
        markPaidForm.value._id,
        {
          paymentDate: markPaidForm.value.paymentDate,
          paymentMethod: markPaidForm.value.paymentMethod,
          paymentReference: markPaidForm.value.paymentReference,
          paymentNotes: markPaidForm.value.paymentNotes
        }
      )

      subscriptionStatus.value = response.data.subscription
      showMarkPaidModal.value = false

      try {
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(selectedPartner._id)
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }

      onSuccess?.()
    } catch {
      // Error handled by API client
    } finally {
      markingPaid.value = false
    }
  }

  // Cancel purchase
  const confirmCancelPurchase = async (purchaseId, selectedPartner, onSuccess) => {
    const reason = prompt(t('partners.subscription.cancelReason'))
    if (reason === null) return
    if (!selectedPartner) return

    try {
      const response = await partnerService.cancelPurchase(selectedPartner._id, purchaseId, reason)
      subscriptionStatus.value = response.data.subscription
      onSuccess?.()
    } catch {
      // Error handled by API client
    }
  }

  // Get invoice for a specific purchase
  const getInvoiceForPurchase = purchaseId => {
    return partnerInvoices.value.find(inv => inv.purchase?.toString() === purchaseId?.toString())
  }

  // Download invoice PDF
  const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      await subscriptionInvoiceService.downloadPDF(invoiceId, invoiceNumber)
    } catch {
      // Error handled by service
    }
  }

  return {
    // State
    showSubscriptionModal,
    showEditPurchaseModal,
    showMarkPaidModal,
    subscriptionPlans,
    subscriptionStatus,
    partnerInvoices,
    useCustomPmsLimit,
    activeSubscriptionTab,
    subscriptionTabs,
    subscriptionForm,
    purchaseForm,
    editPurchaseForm,
    markPaidForm,
    savingSubscription,
    addingPurchase,
    updatingPurchase,
    markingPaid,
    subscriptionStatusMap,

    // Row helpers
    getRemainingDays,
    getGracePeriodDays,
    isPmsEnabledForRow,
    getProvisionedHotels,
    getPmsLimit,
    getSubscriptionStatusForRow,

    // Actions
    loadSubscriptionPlans,
    loadSubscriptionData,
    openSubscriptionModal,
    handleSaveSubscription,
    handleAddPurchase,
    openEditPurchaseModal,
    handleUpdatePurchase,
    openMarkPaidModal,
    handleMarkAsPaid,
    confirmCancelPurchase,
    getInvoiceForPurchase,
    downloadInvoice
  }
}
