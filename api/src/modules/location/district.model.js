import mongoose from 'mongoose'

/**
 * District Model (İlçe)
 * Represents cities/districts from locations.json
 * Used for hierarchical location selection: Country > City > District > TourismRegion
 *
 * Note: District names are NOT multilingual - they're the same in all languages
 */

const districtSchema = new mongoose.Schema({
	// External ID from locations.json (for sync)
	externalId: {
		type: Number
	},

	// District name (single language - same in all languages)
	name: {
		type: String,
		required: [true, 'REQUIRED_NAME'],
		trim: true
	},

	// Parent city reference
	city: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'City',
		required: [true, 'REQUIRED_CITY'],
		index: true
	},

	// URL-friendly identifier
	slug: {
		type: String,
		trim: true,
		lowercase: true
	},

	// Map coordinates
	coordinates: {
		lat: { type: Number },
		lng: { type: Number }
	},

	// Status
	isActive: {
		type: Boolean,
		default: true
	},

	// Metadata for Elasticsearch
	meta: {
		hotelCount: { type: Number, default: 0 },
		popularityScore: { type: Number, default: 0 }
	}
}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes for fast queries and Elasticsearch sync
districtSchema.index({ city: 1, isActive: 1 })
districtSchema.index({ city: 1, slug: 1 }, { unique: true, sparse: true })
districtSchema.index({ externalId: 1 }, { sparse: true })
districtSchema.index({ name: 'text' })
districtSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 })
districtSchema.index({ 'meta.popularityScore': -1 })

// Helper to generate slug from text
const generateSlug = (text) => {
	if (!text) return ''

	const charMap = {
		'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
		'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
		'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
		'à': 'a', 'â': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
		'î': 'i', 'ï': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ÿ': 'y',
		'ñ': 'n', 'ā': 'a', 'ē': 'e', 'ī': 'i', 'ō': 'o', 'ū': 'u'
	}

	let slug = text.toLowerCase()

	for (const [from, to] of Object.entries(charMap)) {
		slug = slug.replace(new RegExp(from, 'g'), to)
	}

	return slug
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
}

// Pre-save middleware
districtSchema.pre('save', function(next) {
	// Auto-generate slug from name if not set
	if (!this.slug && this.name) {
		this.slug = generateSlug(this.name)
	}
	next()
})

// Post-save: Update city's district count
districtSchema.post('save', async function() {
	try {
		const City = mongoose.model('City')
		await City.updateDistrictCount(this.city)
	} catch (err) {
		console.error('Failed to update city district count:', err)
	}
})

// Post-remove: Update city's district count
districtSchema.post('remove', async function() {
	try {
		const City = mongoose.model('City')
		await City.updateDistrictCount(this.city)
	} catch (err) {
		console.error('Failed to update city district count:', err)
	}
})

// Statics
districtSchema.statics.findByCity = function(cityId) {
	return this.find({
		city: cityId,
		isActive: true
	})
		.sort({ name: 1 })
		.collation({ locale: 'tr', strength: 1 })
}

districtSchema.statics.findBySlug = function(cityId, slug) {
	return this.findOne({
		city: cityId,
		slug: slug,
		isActive: true
	})
}

districtSchema.statics.findByExternalId = function(externalId) {
	return this.findOne({ externalId })
}

districtSchema.statics.search = function(query, cityId = null) {
	const searchQuery = {
		$text: { $search: query },
		isActive: true
	}

	if (cityId) {
		searchQuery.city = cityId
	}

	return this.find(searchQuery, { score: { $meta: 'textScore' } })
		.sort({ score: { $meta: 'textScore' } })
		.limit(20)
}

districtSchema.statics.findWithCity = function(districtId) {
	return this.findById(districtId).populate('city')
}

export default mongoose.model('District', districtSchema)
