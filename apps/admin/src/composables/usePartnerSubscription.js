/**
 * Partner Subscription Composable (v2 – package / service based)
 * Extracted from PartnersView.vue – handles subscription management logic
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import partnerService from '@/services/partnerService'
import subscriptionInvoiceService from '@/services/subscriptionInvoiceService'

export function usePartnerSubscription() {
  const { t } = useI18n()

  // State
  const showSubscriptionModal = ref(false)
  const showEditPurchaseModal = ref(false)
  const showMarkPaidModal = ref(false)
  const subscriptionCatalog = ref({ packages: [], services: [] })
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
    customLimits: { pmsMaxHotels: null },
    notes: ''
  })

  const purchaseForm = ref({
    type: 'package_subscription',
    packageId: null,
    serviceId: null,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
    amount: null,
    billingPeriod: 'yearly'
  })

  const editPurchaseForm = ref({
    _id: null,
    startDate: '',
    endDate: '',
    amount: null,
    billingPeriod: 'yearly',
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  })

  const markPaidForm = ref({
    _id: null,
    label: '',
    amount: null,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    paymentReference: '',
    paymentNotes: ''
  })

  // Subscription status map for badges
  const subscriptionStatusMap = {
    trial: { variant: 'info', label: t('mySubscription.status.trial') },
    active: { variant: 'success', label: t('partners.subscription.statusActive') },
    expired: { variant: 'danger', label: t('partners.subscription.statusExpired') },
    grace_period: { variant: 'warning', label: t('partners.subscription.statusGracePeriod') },
    cancelled: { variant: 'secondary', label: t('partners.subscription.statusCancelled') },
    suspended: { variant: 'danger', label: t('partners.subscription.statusSuspended') }
  }

  // Row helpers
  const getRemainingDays = row => {
    if (!row.subscription?.endDate) return null
    const diff = Math.ceil(
      (new Date(row.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, diff)
  }

  const getGracePeriodDays = row => {
    if (!row.subscription?.gracePeriodEndDate) return 0
    const diff = Math.ceil(
      (new Date(row.subscription.gracePeriodEndDate) - new Date()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(0, diff)
  }

  const isPmsEnabledForRow = row => {
    const limit = row.subscription?.customLimits?.pmsMaxHotels ?? 0
    return limit > 0 || limit === -1
  }

  const getProvisionedHotels = () => 0

  const getPmsLimit = row => {
    const limit = row.subscription?.customLimits?.pmsMaxHotels ?? 0
    return limit === -1 ? '∞' : limit
  }

  const getSubscriptionStatusForRow = row => {
    return row.subscription?.status || 'expired'
  }

  const getActivePackageName = (row, locale = 'tr') => {
    const purchases = row.subscription?.purchases
    if (!purchases?.length) return null
    const now = new Date()
    const activePkg = purchases.find(
      p =>
        p.type === 'package_subscription' &&
        p.status === 'active' &&
        new Date(p.period?.startDate) <= now &&
        new Date(p.period?.endDate) >= now
    )
    if (!activePkg) return null
    const label = activePkg.label
    if (!label) return null
    return typeof label === 'object' ? label[locale] || label.tr || label.en : label
  }

  // Load catalog (packages + services)
  const loadSubscriptionPlans = async () => {
    try {
      const response = await partnerService.getSubscriptionCatalog()
      subscriptionCatalog.value = response.data || { packages: [], services: [] }
    } catch {
      subscriptionCatalog.value = { packages: [], services: [] }
    }
  }

  // Load subscription data for a partner
  const loadSubscriptionData = async partnerId => {
    try {
      const response = await partnerService.getSubscription(partnerId)
      subscriptionStatus.value = response.data

      subscriptionForm.value = {
        customLimits: { pmsMaxHotels: response.data?.customLimits?.pmsMaxHotels ?? null },
        notes: response.data?.notes || ''
      }
      useCustomPmsLimit.value = response.data?.customLimits?.pmsMaxHotels != null
      activeSubscriptionTab.value = 'purchases'

      const today = new Date().toISOString().split('T')[0]
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0]
      purchaseForm.value = {
        type: 'package_subscription',
        packageId: null,
        serviceId: null,
        startDate: today,
        endDate: nextYear,
        amount: null,
        billingPeriod: 'yearly'
      }

      try {
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(partnerId)
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }
    } catch {
      subscriptionStatus.value = null
      subscriptionForm.value = { customLimits: { pmsMaxHotels: null }, notes: '' }
      useCustomPmsLimit.value = false
      activeSubscriptionTab.value = 'purchases'
      partnerInvoices.value = []
    }
  }

  const openSubscriptionModal = async (partner, selectedPartnerRef) => {
    selectedPartnerRef.value = partner
    showSubscriptionModal.value = true
    await loadSubscriptionData(partner._id)
  }

  const handleSaveSubscription = async (selectedPartner, onSuccess) => {
    if (!selectedPartner) return
    savingSubscription.value = true
    try {
      const data = { notes: subscriptionForm.value.notes }
      data.customLimits = useCustomPmsLimit.value
        ? { pmsMaxHotels: subscriptionForm.value.customLimits.pmsMaxHotels }
        : { pmsMaxHotels: null }

      const response = await partnerService.updateSubscription(selectedPartner._id, data)
      subscriptionStatus.value = response.data
      showSubscriptionModal.value = false
      onSuccess?.()
    } catch {
      // handled
    } finally {
      savingSubscription.value = false
    }
  }

  const handleAddPurchase = async (selectedPartner, onSuccess) => {
    if (!selectedPartner || !purchaseForm.value.amount) return
    addingPurchase.value = true
    try {
      const response = await partnerService.addPurchase(selectedPartner._id, {
        type: purchaseForm.value.type,
        packageId: purchaseForm.value.packageId,
        serviceId: purchaseForm.value.serviceId,
        startDate: purchaseForm.value.startDate,
        endDate: purchaseForm.value.endDate,
        amount: purchaseForm.value.amount,
        billingPeriod: purchaseForm.value.billingPeriod
      })

      subscriptionStatus.value = response.data.subscription

      const today = new Date().toISOString().split('T')[0]
      const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        .toISOString()
        .split('T')[0]
      purchaseForm.value = {
        type: 'package_subscription',
        packageId: null,
        serviceId: null,
        startDate: today,
        endDate: nextYear,
        amount: null,
        billingPeriod: 'yearly'
      }

      try {
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(
          selectedPartner._id
        )
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }

      onSuccess?.()
    } catch {
      // handled
    } finally {
      addingPurchase.value = false
    }
  }

  const openEditPurchaseModal = purchase => {
    const formatDateForInput = date => {
      if (!date) return ''
      return new Date(date).toISOString().split('T')[0]
    }

    editPurchaseForm.value = {
      _id: purchase._id,
      startDate: formatDateForInput(purchase.period?.startDate),
      endDate: formatDateForInput(purchase.period?.endDate),
      amount: purchase.price?.amount,
      billingPeriod: purchase.billingPeriod || 'yearly',
      paymentMethod: purchase.payment?.method || 'bank_transfer',
      paymentReference: purchase.payment?.reference || '',
      paymentNotes: purchase.payment?.notes || ''
    }
    showEditPurchaseModal.value = true
  }

  const handleUpdatePurchase = async (selectedPartner, onSuccess) => {
    if (!selectedPartner || !editPurchaseForm.value._id) return
    updatingPurchase.value = true
    try {
      const response = await partnerService.updatePurchase(
        selectedPartner._id,
        editPurchaseForm.value._id,
        {
          startDate: editPurchaseForm.value.startDate,
          endDate: editPurchaseForm.value.endDate,
          amount: editPurchaseForm.value.amount,
          billingPeriod: editPurchaseForm.value.billingPeriod,
          paymentMethod: editPurchaseForm.value.paymentMethod,
          paymentReference: editPurchaseForm.value.paymentReference,
          paymentNotes: editPurchaseForm.value.paymentNotes
        }
      )
      subscriptionStatus.value = response.data.subscription
      showEditPurchaseModal.value = false
      onSuccess?.()
    } catch {
      // handled
    } finally {
      updatingPurchase.value = false
    }
  }

  const openMarkPaidModal = purchase => {
    markPaidForm.value = {
      _id: purchase._id,
      label: purchase.label?.tr || purchase.label?.en || '-',
      amount: purchase.price?.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      paymentReference: '',
      paymentNotes: ''
    }
    showMarkPaidModal.value = true
  }

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
        const invoicesResponse = await subscriptionInvoiceService.getPartnerInvoices(
          selectedPartner._id
        )
        partnerInvoices.value = invoicesResponse.data?.invoices || []
      } catch {
        partnerInvoices.value = []
      }

      onSuccess?.()
    } catch {
      // handled
    } finally {
      markingPaid.value = false
    }
  }

  const confirmCancelPurchase = async (purchaseId, selectedPartner, onSuccess) => {
    const reason = prompt(t('partners.subscription.cancelReason'))
    if (reason === null || !selectedPartner) return
    try {
      const response = await partnerService.cancelPurchase(selectedPartner._id, purchaseId, reason)
      subscriptionStatus.value = response.data.subscription
      onSuccess?.()
    } catch {
      // handled
    }
  }

  const getInvoiceForPurchase = purchaseId => {
    return partnerInvoices.value.find(inv => inv.purchase?.toString() === purchaseId?.toString())
  }

  const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      await subscriptionInvoiceService.downloadPDF(invoiceId, invoiceNumber)
    } catch {
      // handled
    }
  }

  const onCatalogItemChange = kind => {
    const cat = subscriptionCatalog.value
    if (!cat) return
    if (kind === 'package') {
      const pkg = cat.packages?.find(p => p._id === purchaseForm.value.packageId)
      if (pkg) {
        purchaseForm.value.amount = pkg.price ?? pkg.calculatedPrice ?? 0
        purchaseForm.value.billingPeriod = pkg.billingPeriod || 'yearly'
      }
    } else {
      const svc = cat.services?.find(s => s._id === purchaseForm.value.serviceId)
      if (svc) {
        purchaseForm.value.amount = svc.price ?? 0
        purchaseForm.value.billingPeriod = svc.billingPeriod || 'yearly'
      }
    }
  }

  return {
    showSubscriptionModal,
    showEditPurchaseModal,
    showMarkPaidModal,
    subscriptionCatalog,
    subscriptionPlans: subscriptionCatalog,
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
    getRemainingDays,
    getGracePeriodDays,
    isPmsEnabledForRow,
    getProvisionedHotels,
    getPmsLimit,
    getSubscriptionStatusForRow,
    getActivePackageName,
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
    downloadInvoice,
    onCatalogItemChange
  }
}
