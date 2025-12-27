import City from './city.model.js'
import District from './district.model.js'
import TourismRegion from './tourismRegion.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'

// Check if user is platform admin
const isPlatformAdmin = (req) => {
	return req.user?.role === 'super_admin' || req.user?.accountType === 'platform'
}

/**
 * Get cities by country code
 */
export const getCities = asyncHandler(async (req, res) => {
	const { country } = req.query

	if (!country) {
		throw new BadRequestError('COUNTRY_CODE_REQUIRED')
	}

	const cities = await City.findByCountry(country)

	res.json({
		success: true,
		data: cities
	})
})

/**
 * Get all cities (admin only)
 */
export const getAllCities = asyncHandler(async (req, res) => {
	const { country, active = 'true' } = req.query

	const filter = {}

	if (active === 'true') {
		filter.isActive = true
	}

	if (country) {
		filter.countryCode = country.toUpperCase()
	}

	const cities = await City.find(filter)
		.sort({ countryCode: 1, name: 1 })
		.collation({ locale: 'tr', strength: 1 })

	res.json({
		success: true,
		data: cities
	})
})

/**
 * Create a city (platform admin only)
 */
export const createCity = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, countryCode } = req.body

	if (!name || !countryCode) {
		throw new BadRequestError('NAME_AND_COUNTRY_REQUIRED')
	}

	// Check for duplicate
	const existingCity = await City.findOne({
		countryCode: countryCode.toUpperCase(),
		name: { $regex: `^${name}$`, $options: 'i' }
	})

	if (existingCity) {
		throw new BadRequestError('CITY_ALREADY_EXISTS')
	}

	const city = new City({
		name,
		countryCode: countryCode.toUpperCase(),
		isActive: true
	})

	await city.save()

	res.status(201).json({
		success: true,
		data: city,
		message: 'CITY_CREATED'
	})
})

/**
 * Update city (platform admin only)
 */
export const updateCity = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, coordinates, zoom, isActive } = req.body

	const city = await City.findById(req.params.id)

	if (!city) {
		throw new NotFoundError('CITY_NOT_FOUND')
	}

	if (name !== undefined) {
		// Ensure name is a string (handle both string and object formats)
		if (typeof name === 'string') {
			city.name = name
		} else if (typeof name === 'object' && name !== null) {
			// Check if it's a character array (keys are numeric indices)
			const keys = Object.keys(name)
			const isCharArray = keys.length > 0 && keys.every(k => /^\d+$/.test(k))

			if (isCharArray) {
				// Join character array back to string
				city.name = keys.sort((a, b) => Number(a) - Number(b)).map(k => name[k]).join('')
			} else {
				// Old multilingual format
				city.name = name.tr || name.en || Object.values(name).find(v => typeof v === 'string' && v) || ''
			}
		}
	}

	if (coordinates !== undefined) {
		city.coordinates = coordinates
	}

	if (zoom !== undefined) {
		city.zoom = zoom
	}

	if (isActive !== undefined) {
		city.isActive = isActive
	}

	await city.save()

	res.json({
		success: true,
		data: city,
		message: 'CITY_UPDATED'
	})
})

/**
 * Delete city (platform admin only)
 */
export const deleteCity = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const city = await City.findById(req.params.id)

	if (!city) {
		throw new NotFoundError('CITY_NOT_FOUND')
	}

	// Check if there are tourism regions using this city
	const regionCount = await TourismRegion.countDocuments({ city: city._id })
	if (regionCount > 0) {
		throw new BadRequestError('CITY_HAS_REGIONS')
	}

	await city.deleteOne()

	res.json({
		success: true,
		message: 'CITY_DELETED'
	})
})

/**
 * Get tourism regions by city
 */
export const getRegions = asyncHandler(async (req, res) => {
	const { city } = req.query

	if (!city) {
		throw new BadRequestError('CITY_ID_REQUIRED')
	}

	const regions = await TourismRegion.findByCity(city)

	res.json({
		success: true,
		data: regions
	})
})

/**
 * Get all tourism regions (admin only)
 */
export const getAllRegions = asyncHandler(async (req, res) => {
	const { city, active = 'true' } = req.query

	const filter = {}

	if (active === 'true') {
		filter.isActive = true
	}

	if (city) {
		filter.city = city
	}

	const regions = await TourismRegion.find(filter)
		.populate('city')
		.sort({ name: 1 })
		.collation({ locale: 'tr', strength: 1 })

	res.json({
		success: true,
		data: regions
	})
})

/**
 * Get single region
 */
export const getRegion = asyncHandler(async (req, res) => {
	const region = await TourismRegion.findById(req.params.id).populate('city')

	if (!region) {
		throw new NotFoundError('REGION_NOT_FOUND')
	}

	res.json({
		success: true,
		data: region
	})
})

/**
 * Create a tourism region (platform admin only)
 */
export const createRegion = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, city, coordinates } = req.body

	if (!name || !city) {
		throw new BadRequestError('NAME_AND_CITY_REQUIRED')
	}

	// Verify city exists
	const cityExists = await City.findById(city)
	if (!cityExists) {
		throw new NotFoundError('CITY_NOT_FOUND')
	}

	// Check for duplicate
	const existingRegion = await TourismRegion.findOne({
		city,
		name: { $regex: `^${name}$`, $options: 'i' }
	})

	if (existingRegion) {
		throw new BadRequestError('REGION_ALREADY_EXISTS')
	}

	const region = new TourismRegion({
		name,
		city,
		coordinates: coordinates || {},
		isActive: true
	})

	await region.save()

	// Populate city before returning
	await region.populate('city')

	res.status(201).json({
		success: true,
		data: region,
		message: 'REGION_CREATED'
	})
})

/**
 * Update tourism region (platform admin only)
 */
export const updateRegion = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, coordinates, isActive } = req.body

	const region = await TourismRegion.findById(req.params.id)

	if (!region) {
		throw new NotFoundError('REGION_NOT_FOUND')
	}

	if (name !== undefined) {
		// Ensure name is a string (handle both string and object formats)
		if (typeof name === 'string') {
			region.name = name
		} else if (typeof name === 'object' && name !== null) {
			const keys = Object.keys(name)
			const isCharArray = keys.length > 0 && keys.every(k => /^\d+$/.test(k))
			if (isCharArray) {
				region.name = keys.sort((a, b) => Number(a) - Number(b)).map(k => name[k]).join('')
			} else {
				region.name = name.tr || name.en || Object.values(name).find(v => typeof v === 'string' && v) || ''
			}
		}
	}

	if (coordinates) {
		region.coordinates = coordinates
	}

	if (isActive !== undefined) {
		region.isActive = isActive
	}

	await region.save()
	await region.populate('city')

	res.json({
		success: true,
		data: region,
		message: 'REGION_UPDATED'
	})
})

/**
 * Delete tourism region (platform admin only)
 */
export const deleteRegion = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const region = await TourismRegion.findById(req.params.id)

	if (!region) {
		throw new NotFoundError('REGION_NOT_FOUND')
	}

	await region.deleteOne()

	res.json({
		success: true,
		message: 'REGION_DELETED'
	})
})

// ============================================
// DISTRICT ENDPOINTS
// ============================================

/**
 * Get districts by city
 */
export const getDistricts = asyncHandler(async (req, res) => {
	const { city } = req.query

	if (!city) {
		throw new BadRequestError('CITY_ID_REQUIRED')
	}

	const districts = await District.findByCity(city)

	res.json({
		success: true,
		data: districts
	})
})

/**
 * Get all districts (admin only)
 */
export const getAllDistricts = asyncHandler(async (req, res) => {
	const { city, active = 'true' } = req.query

	const filter = {}

	if (active === 'true') {
		filter.isActive = true
	}

	if (city) {
		filter.city = city
	}

	const districts = await District.find(filter)
		.populate('city')
		.sort({ name: 1 })
		.collation({ locale: 'tr', strength: 1 })

	res.json({
		success: true,
		data: districts
	})
})

/**
 * Get single district
 */
export const getDistrict = asyncHandler(async (req, res) => {
	const district = await District.findById(req.params.id).populate('city')

	if (!district) {
		throw new NotFoundError('DISTRICT_NOT_FOUND')
	}

	res.json({
		success: true,
		data: district
	})
})

/**
 * Create a district (platform admin only)
 */
export const createDistrict = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, city, coordinates } = req.body

	if (!name || !city) {
		throw new BadRequestError('NAME_AND_CITY_REQUIRED')
	}

	// Verify city exists
	const cityExists = await City.findById(city)
	if (!cityExists) {
		throw new NotFoundError('CITY_NOT_FOUND')
	}

	// Check for duplicate
	const existingDistrict = await District.findOne({
		city,
		name: { $regex: `^${name}$`, $options: 'i' }
	})

	if (existingDistrict) {
		throw new BadRequestError('DISTRICT_ALREADY_EXISTS')
	}

	const district = new District({
		name,
		city,
		coordinates: coordinates || {},
		isActive: true
	})

	await district.save()

	// Populate city before returning
	await district.populate('city')

	res.status(201).json({
		success: true,
		data: district,
		message: 'DISTRICT_CREATED'
	})
})

/**
 * Update district (platform admin only)
 */
export const updateDistrict = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const { name, coordinates, isActive } = req.body

	const district = await District.findById(req.params.id)

	if (!district) {
		throw new NotFoundError('DISTRICT_NOT_FOUND')
	}

	if (name !== undefined) {
		// Ensure name is a string (handle both string and object formats)
		if (typeof name === 'string') {
			district.name = name
		} else if (typeof name === 'object' && name !== null) {
			const keys = Object.keys(name)
			const isCharArray = keys.length > 0 && keys.every(k => /^\d+$/.test(k))
			if (isCharArray) {
				district.name = keys.sort((a, b) => Number(a) - Number(b)).map(k => name[k]).join('')
			} else {
				district.name = name.tr || name.en || Object.values(name).find(v => typeof v === 'string' && v) || ''
			}
		}
	}

	if (coordinates) {
		district.coordinates = coordinates
	}

	if (isActive !== undefined) {
		district.isActive = isActive
	}

	await district.save()
	await district.populate('city')

	res.json({
		success: true,
		data: district,
		message: 'DISTRICT_UPDATED'
	})
})

/**
 * Delete district (platform admin only)
 */
export const deleteDistrict = asyncHandler(async (req, res) => {
	if (!isPlatformAdmin(req)) {
		throw new ForbiddenError('FORBIDDEN')
	}

	const district = await District.findById(req.params.id)

	if (!district) {
		throw new NotFoundError('DISTRICT_NOT_FOUND')
	}

	await district.deleteOne()

	res.json({
		success: true,
		message: 'DISTRICT_DELETED'
	})
})

/**
 * Search locations (for autocomplete)
 * Searches across cities, districts, and regions
 */
export const searchLocations = asyncHandler(async (req, res) => {
	const { q, country, type = 'all' } = req.query

	if (!q || q.length < 2) {
		throw new BadRequestError('SEARCH_QUERY_TOO_SHORT')
	}

	const results = {
		cities: [],
		districts: [],
		regions: []
	}

	if (type === 'all' || type === 'cities') {
		results.cities = await City.search(q, country)
	}

	if (type === 'all' || type === 'districts') {
		results.districts = await District.search(q)
	}

	if (type === 'all' || type === 'regions') {
		const regionQuery = {
			$text: { $search: q },
			isActive: true
		}
		results.regions = await TourismRegion.find(regionQuery, { score: { $meta: 'textScore' } })
			.populate('city')
			.sort({ score: { $meta: 'textScore' } })
			.limit(20)
	}

	res.json({
		success: true,
		data: results
	})
})
