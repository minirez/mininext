/**
 * Contract Import Service
 * Handles contract parsing and importing
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

export const parseContract = async (hotelId, fileContent, mimeType, fileName) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/contract/parse`,
      {
        fileContent,
        mimeType,
        fileName
      },
      {
        timeout: 0 // no timeout — multi-pass AI analysis can take 10+ min for large contracts
      }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Parse contract failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const importContractPricing = async (hotelId, contractData, mappings, options = {}) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/contract/import`,
      { contractData, mappings, options },
      { timeout: 0 }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Import contract failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  parseContract,
  importContractPricing
}
