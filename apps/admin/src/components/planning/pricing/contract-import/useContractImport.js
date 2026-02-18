/**
 * Contract Import Composable
 * Shared logic for contract import wizard
 */

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import planningService from '@/services/planningService'

export function useContractImport(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const { formatDisplayDate } = useDate()

  // Steps configuration
  const steps = [
    { id: 'upload', label: t('planning.pricing.contractImport.stepUpload'), icon: 'upload_file' },
    { id: 'parse', label: t('planning.pricing.contractImport.stepParse'), icon: 'auto_awesome' },
    { id: 'map', label: t('planning.pricing.contractImport.stepMap'), icon: 'compare_arrows' },
    { id: 'import', label: t('planning.pricing.contractImport.stepImport'), icon: 'download' }
  ]

  // State
  const currentStep = ref(0)
  const selectedFile = ref(null)
  const isDragging = ref(false)
  const isLoading = ref(false)
  const isImporting = ref(false)
  const parseError = ref(null)
  const parsedData = ref(null)
  const importResult = ref(null)
  const selectedRoomTab = ref(0)

  // Mappings
  const roomMappings = ref({})
  const mealPlanMappings = ref({})
  const importOptions = ref({
    overwriteExisting: false,
    createMissingRooms: true,
    createMissingMealPlans: true,
    updateRoomCapacity: true,
    defaultAllotment: 10,
    defaultMinStay: 1
  })

  // Helper to get localized name from multilingual object
  const getLocalizedName = nameObj => {
    if (!nameObj) return ''
    if (typeof nameObj === 'string') return nameObj
    return nameObj[locale.value] || nameObj.tr || nameObj.en || Object.values(nameObj)[0] || ''
  }

  // Computed
  const existingRoomTypes = computed(() => parsedData.value?.existingRoomTypes || [])
  const existingMealPlans = computed(() => parsedData.value?.existingMealPlans || [])

  const mappedRoomCount = computed(() => Object.values(roomMappings.value).filter(v => v).length)
  const mappedMealPlanCount = computed(
    () => Object.values(mealPlanMappings.value).filter(v => v).length
  )

  // New/existing room and meal plan counts
  const newRoomCount = computed(
    () => parsedData.value?.roomTypes?.filter(r => r.isNewRoom).length || 0
  )
  const existingRoomCount = computed(
    () => parsedData.value?.roomTypes?.filter(r => !r.isNewRoom).length || 0
  )
  const newMealPlanCount = computed(
    () => parsedData.value?.mealPlans?.filter(m => m.isNewMealPlan).length || 0
  )
  const existingMealPlanCount = computed(
    () => parsedData.value?.mealPlans?.filter(m => !m.isNewMealPlan).length || 0
  )

  // Season date range (calculated from all periods)
  const seasonStartDate = computed(() => {
    if (!parsedData.value?.periods?.length) return null
    const dates = parsedData.value.periods.map(p => new Date(p.startDate))
    return new Date(Math.min(...dates))
  })

  const seasonEndDate = computed(() => {
    if (!parsedData.value?.periods?.length) return null
    const dates = parsedData.value.periods.map(p => new Date(p.endDate))
    return new Date(Math.max(...dates))
  })

  const seasonYear = computed(() => {
    return seasonStartDate.value ? seasonStartDate.value.getFullYear() : new Date().getFullYear()
  })

  const seasonDays = computed(() => {
    if (!seasonStartDate.value || !seasonEndDate.value) return 0
    const diffTime = Math.abs(seasonEndDate.value - seasonStartDate.value)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  })

  const validPricingCount = computed(() => {
    if (!parsedData.value?.pricing) return 0
    return parsedData.value.pricing.filter(p => {
      const room = parsedData.value.roomTypes?.find(r => {
        const roomCodes = [r.matchedCode, r.contractCode, r.suggestedCode, r.contractName].filter(
          Boolean
        )
        return roomCodes.some(
          code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase()
        )
      })
      const mealPlan = parsedData.value.mealPlans?.find(mp => {
        const mealCodes = [
          mp.matchedCode,
          mp.contractCode,
          mp.suggestedCode,
          mp.contractName
        ].filter(Boolean)
        return mealCodes.some(
          code => p.mealPlanCode === code || p.mealPlanCode?.toLowerCase() === code?.toLowerCase()
        )
      })
      const roomMapped = room && roomMappings.value[room.contractName]
      const mealMapped = mealPlan && mealPlanMappings.value[mealPlan.contractName]
      return roomMapped && mealMapped
    }).length
  })

  // Mapping percentages
  const roomMappingPercentage = computed(() => {
    const total = parsedData.value?.roomTypes?.length || 0
    if (total === 0) return 0
    const matched = parsedData.value.roomTypes.filter(
      r => roomMappings.value[r.contractName]
    ).length
    return Math.round((matched / total) * 100)
  })

  const mealPlanMappingPercentage = computed(() => {
    const total = parsedData.value?.mealPlans?.length || 0
    if (total === 0) return 0
    const matched = parsedData.value.mealPlans.filter(
      m => mealPlanMappings.value[m.contractName]
    ).length
    return Math.round((matched / total) * 100)
  })

  // Mapped rooms and meal plans
  const mappedRooms = computed(() => {
    if (!parsedData.value?.roomTypes) return []
    return parsedData.value.roomTypes.filter(room => roomMappings.value[room.contractName])
  })

  const mappedMealPlans = computed(() => {
    if (!parsedData.value?.mealPlans) return []
    return parsedData.value.mealPlans.filter(mp => mealPlanMappings.value[mp.contractName])
  })

  // Missing prices count
  const missingPricesCount = computed(() => {
    if (!parsedData.value?.periods || !mappedRooms.value.length || !mappedMealPlans.value.length)
      return 0

    const periodsCount = parsedData.value.periods.length
    const roomsCount = mappedRooms.value.length
    const mealPlansCount = mappedMealPlans.value.length

    const expectedCombinations = periodsCount * roomsCount * mealPlansCount
    return expectedCombinations - validPricingCount.value
  })

  // Check if contract has OBP pricing
  const hasOBPPricing = computed(() => {
    if (!parsedData.value?.pricing) return false
    return (
      parsedData.value.pricing.some(
        p =>
          p.pricingType === 'per_person' ||
          p.pricingType === 'per_person_multiplier' ||
          p.occupancyPricing
      ) ||
      parsedData.value.contractInfo?.pricingType === 'per_person' ||
      parsedData.value.contractInfo?.pricingType === 'per_person_multiplier'
    )
  })

  // Check if contract uses multiplier-based OBP
  const hasMultiplierPricing = computed(() => {
    return (
      parsedData.value?.contractInfo?.pricingType === 'per_person_multiplier' ||
      parsedData.value?.multiplierData != null
    )
  })

  // Pricing completeness from validation
  const pricingCompleteness = computed(() => {
    return parsedData.value?.validation?.completeness ?? null
  })

  // OBP occupancy range
  const obpOccupancyRange = computed(() => {
    if (!hasOBPPricing.value || !parsedData.value?.pricing) return ''

    let minPax = 10
    let maxPax = 1

    for (const price of parsedData.value.pricing) {
      if (price.occupancyPricing) {
        for (let pax = 1; pax <= 10; pax++) {
          if (price.occupancyPricing[pax] !== null && price.occupancyPricing[pax] !== undefined) {
            minPax = Math.min(minPax, pax)
            maxPax = Math.max(maxPax, pax)
          }
        }
      }
    }

    if (minPax > maxPax) return ''
    return `${minPax}-${maxPax} Yetişkin`
  })

  // Methods
  const resetWizard = () => {
    currentStep.value = 0
    selectedFile.value = null
    isDragging.value = false
    isLoading.value = false
    isImporting.value = false
    parseError.value = null
    parsedData.value = null
    importResult.value = null
    roomMappings.value = {}
    mealPlanMappings.value = {}
    selectedRoomTab.value = 0
    importOptions.value = {
      overwriteExisting: false,
      createMissingRooms: true,
      createMissingMealPlans: true,
      updateRoomCapacity: true,
      defaultAllotment: 10,
      defaultMinStay: 1
    }
  }

  const handleFileSelect = event => {
    const file = event.target.files[0]
    if (file) {
      selectedFile.value = file
    }
  }

  const handleFileDrop = event => {
    isDragging.value = false
    const file = event.dataTransfer.files[0]
    if (file) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
      if (validTypes.includes(file.type) || file.name.endsWith('.pdf')) {
        selectedFile.value = file
      } else {
        toast.error(t('planning.pricing.contractImport.invalidFileType'))
      }
    }
  }

  const formatFileSize = bytes => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = formatDisplayDate

  const getConfidenceColor = confidence => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getConfidenceBadgeClass = confidence => {
    if (confidence >= 80)
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (confidence >= 60)
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const getRoomPricingCount = room => {
    if (!parsedData.value?.pricing || !room) return 0
    return parsedData.value.pricing.filter(p => {
      const roomCodes = [
        room.matchedCode,
        room.contractCode,
        room.suggestedCode,
        room.contractName
      ].filter(Boolean)
      return roomCodes.some(
        code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase()
      )
    }).length
  }

  const getPriceForCell = (room, mealPlan, period) => {
    if (!parsedData.value?.pricing || !room || !mealPlan || !period) return null

    const price = parsedData.value.pricing.find(p => {
      const roomCodes = [
        room.matchedCode,
        room.contractCode,
        room.suggestedCode,
        room.contractName
      ].filter(Boolean)
      const roomMatch = roomCodes.some(
        code => p.roomCode === code || p.roomCode?.toLowerCase() === code?.toLowerCase()
      )

      const mealCodes = [
        mealPlan.matchedCode,
        mealPlan.contractCode,
        mealPlan.suggestedCode,
        mealPlan.contractName
      ].filter(Boolean)
      const mealMatch = mealCodes.some(
        code => p.mealPlanCode === code || p.mealPlanCode?.toLowerCase() === code?.toLowerCase()
      )

      const periodMatch =
        p.periodCode === period.code || p.periodCode?.toLowerCase() === period.code?.toLowerCase()

      return roomMatch && mealMatch && periodMatch
    })

    if (!price) return null

    if (price.pricingType === 'per_person' || price.occupancyPricing) {
      return {
        isOBP: true,
        occupancyPricing: price.occupancyPricing,
        price: null
      }
    }

    return {
      isOBP: false,
      price: price.pricePerNight,
      occupancyPricing: null
    }
  }

  const formatPrice = value => {
    if (!value && value !== 0) return '-'
    const currency = parsedData.value?.contractInfo?.currency || 'TRY'
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const startParsing = async () => {
    if (!selectedFile.value) return

    currentStep.value = 1
    isLoading.value = true
    parseError.value = null

    try {
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile.value)
      })

      const response = await planningService.parseContract(
        props.hotelId,
        fileContent,
        selectedFile.value.type,
        selectedFile.value.name
      )

      if (response.success) {
        parsedData.value = response.data

        // Auto-fill mappings based on AI matches
        if (response.data.roomTypes) {
          response.data.roomTypes.forEach(room => {
            if (room.isNewRoom) {
              if (room.suggestedCode) {
                roomMappings.value[room.contractName] = room.suggestedCode
              }
            } else if (room.matchedCode) {
              roomMappings.value[room.contractName] = room.matchedCode
            }
          })
        }

        if (response.data.mealPlans) {
          response.data.mealPlans.forEach(mp => {
            if (mp.isNewMealPlan) {
              if (mp.suggestedCode) {
                mealPlanMappings.value[mp.contractName] = mp.suggestedCode
              }
            } else if (mp.matchedCode) {
              mealPlanMappings.value[mp.contractName] = mp.matchedCode
            }
          })
        }

        toast.success(t('planning.pricing.contractImport.parseSuccess'))
      } else {
        parseError.value = response.error || t('planning.pricing.contractImport.parseFailed')
      }
    } catch (error) {
      console.error('Contract parsing error:', error)
      parseError.value =
        error.response?.data?.message ||
        error.message ||
        t('planning.pricing.contractImport.parseFailed')
    } finally {
      isLoading.value = false
    }
  }

  const executeImport = async () => {
    isImporting.value = true

    try {
      const roomCodeMappings = {}
      parsedData.value.roomTypes?.forEach(room => {
        const mappedCode = roomMappings.value[room.contractName]
        if (mappedCode) {
          roomCodeMappings[room.contractName] = mappedCode
          if (room.contractCode) {
            roomCodeMappings[room.contractCode] = mappedCode
          }
          if (room.matchedCode) {
            roomCodeMappings[room.matchedCode] = mappedCode
          }
          if (room.suggestedCode) {
            roomCodeMappings[room.suggestedCode] = mappedCode
          }
        }
      })

      const mealCodeMappings = {}
      parsedData.value.mealPlans?.forEach(mp => {
        const mappedCode = mealPlanMappings.value[mp.contractName]
        if (mappedCode) {
          mealCodeMappings[mp.contractName] = mappedCode
          if (mp.contractCode) {
            mealCodeMappings[mp.contractCode] = mappedCode
          }
          if (mp.matchedCode) {
            mealCodeMappings[mp.matchedCode] = mappedCode
          }
          if (mp.suggestedCode) {
            mealCodeMappings[mp.suggestedCode] = mappedCode
          }
        }
      })

      const response = await planningService.importContractPricing(
        props.hotelId,
        parsedData.value,
        {
          roomMappings: roomCodeMappings,
          mealPlanMappings: mealCodeMappings
        },
        importOptions.value
      )

      if (response.success) {
        importResult.value = response.data
        toast.success(t('planning.pricing.contractImport.importSuccess'))
        emit('imported', response.data)
      } else {
        toast.error(response.message || t('planning.pricing.contractImport.importFailed'))
      }
    } catch (error) {
      console.error('Contract import error:', error)
      toast.error(
        error.response?.data?.message ||
          error.message ||
          t('planning.pricing.contractImport.importFailed')
      )
    } finally {
      isImporting.value = false
    }
  }

  // Watch for modal show/hide
  watch(
    () => props.show,
    newVal => {
      if (newVal) {
        resetWizard()
      }
    }
  )

  return {
    // Config
    steps,

    // State
    currentStep,
    selectedFile,
    isDragging,
    isLoading,
    isImporting,
    parseError,
    parsedData,
    importResult,
    selectedRoomTab,
    roomMappings,
    mealPlanMappings,
    importOptions,

    // Computed
    existingRoomTypes,
    existingMealPlans,
    mappedRoomCount,
    mappedMealPlanCount,
    newRoomCount,
    existingRoomCount,
    newMealPlanCount,
    existingMealPlanCount,
    seasonStartDate,
    seasonEndDate,
    seasonYear,
    seasonDays,
    validPricingCount,
    roomMappingPercentage,
    mealPlanMappingPercentage,
    mappedRooms,
    mappedMealPlans,
    missingPricesCount,
    hasOBPPricing,
    hasMultiplierPricing,
    pricingCompleteness,
    obpOccupancyRange,

    // Methods
    getLocalizedName,
    resetWizard,
    handleFileSelect,
    handleFileDrop,
    formatFileSize,
    formatDate,
    getConfidenceColor,
    getConfidenceBadgeClass,
    getRoomPricingCount,
    getPriceForCell,
    formatPrice,
    startParsing,
    executeImport
  }
}

export default useContractImport
