import mongoose from 'mongoose'

/**
 * City Model (State/Province/İl)
 * Represents states/provinces from locations.json
 * Used for hierarchical location selection: Country > City > District > TourismRegion
 *
 * Note: City names are NOT multilingual - they're the same in all languages
 * Only country names are multilingual (handled in frontend via countries.js)
 */

const citySchema = new mongoose.Schema({
	// External ID from locations.json (for sync)
	externalId: {
		type: Number
	},

	// City/State name (single language - same in all languages)
	name: {
		type: String,
		required: [true, 'REQUIRED_NAME'],
		trim: true
	},

	// ISO 3166-1 alpha-2 country code (e.g., "TR", "DE", "US")
	countryCode: {
		type: String,
		required: [true, 'REQUIRED_COUNTRY_CODE'],
		uppercase: true,
		trim: true,
		minlength: 2,
		maxlength: 2
	},

	// State/Province code (e.g., "07" for Antalya)
	stateCode: {
		type: String,
		trim: true,
		index: true
	},

	// URL-friendly identifier
	slug: {
		type: String,
		trim: true,
		lowercase: true
	},

	// Map coordinates and zoom level
	coordinates: {
		lat: { type: Number },
		lng: { type: Number }
	},
	zoom: {
		type: Number,
		default: 10,
		min: 1,
		max: 20
	},

	// Status
	isActive: {
		type: Boolean,
		default: true
	},

	// Metadata for Elasticsearch
	meta: {
		districtCount: { type: Number, default: 0 },
		hotelCount: { type: Number, default: 0 },
		popularityScore: { type: Number, default: 0 }
	}
}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes for fast queries and Elasticsearch sync
citySchema.index({ countryCode: 1, isActive: 1 })
citySchema.index({ countryCode: 1, slug: 1 }, { unique: true, sparse: true })
citySchema.index({ countryCode: 1, stateCode: 1 })
citySchema.index({ externalId: 1 }, { sparse: true })
citySchema.index({ name: 'text' })
citySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 })
citySchema.index({ 'meta.popularityScore': -1 })

// Virtual for districts
citySchema.virtual('districts', {
	ref: 'District',
	localField: '_id',
	foreignField: 'city'
})

// Virtual for tourism regions
citySchema.virtual('tourismRegions', {
	ref: 'TourismRegion',
	localField: '_id',
	foreignField: 'city'
})

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
citySchema.pre('save', function(next) {
	// Auto-generate slug from name if not set
	if (!this.slug && this.name) {
		this.slug = generateSlug(this.name)
	}
	next()
})

// Statics
citySchema.statics.findByCountry = function(countryCode, options = {}) {
	const query = {
		countryCode: countryCode.toUpperCase(),
		isActive: true
	}

	let cursor = this.find(query)

	if (options.withDistricts) {
		cursor = cursor.populate('districts')
	}

	// Sort alphabetically with Turkish collation
	return cursor
		.sort({ name: 1 })
		.collation({ locale: 'tr', strength: 1 })
}

citySchema.statics.findBySlug = function(countryCode, slug) {
	return this.findOne({
		countryCode: countryCode.toUpperCase(),
		slug: slug,
		isActive: true
	})
}

citySchema.statics.findByExternalId = function(externalId) {
	return this.findOne({ externalId })
}

citySchema.statics.search = function(query, countryCode = null) {
	const searchQuery = {
		$text: { $search: query },
		isActive: true
	}

	if (countryCode) {
		searchQuery.countryCode = countryCode.toUpperCase()
	}

	return this.find(searchQuery, { score: { $meta: 'textScore' } })
		.sort({ score: { $meta: 'textScore' } })
		.limit(20)
}

// Update district count
citySchema.statics.updateDistrictCount = async function(cityId) {
	const District = mongoose.model('District')
	const count = await District.countDocuments({ city: cityId, isActive: true })
	return this.findByIdAndUpdate(cityId, { 'meta.districtCount': count })
}

export default mongoose.model('City', citySchema)
