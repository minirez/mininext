import api from './api'

const BASE_URL = '/tursab-agencies'

const getTursabAgencies = async (params = {}) => {
  const response = await api.get(BASE_URL, { params })
  return response.data
}

const getTursabAgencyStats = async () => {
  const response = await api.get(`${BASE_URL}/stats`)
  return response.data
}

const getTursabCities = async () => {
  const response = await api.get(`${BASE_URL}/cities`)
  return response.data
}

const getTursabDistricts = async city => {
  const response = await api.get(`${BASE_URL}/cities/${encodeURIComponent(city)}/districts`)
  return response.data
}

const getTursabAgency = async id => {
  const response = await api.get(`${BASE_URL}/${id}`)
  return response.data
}

export default {
  getTursabAgencies,
  getTursabAgencyStats,
  getTursabCities,
  getTursabDistricts,
  getTursabAgency
}
