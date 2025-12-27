import mongoose from 'mongoose'

/**
 * TourismRegion Model
 * Tourism regions are linked to cities
 * Used for hierarchical location selection: Country > City > District > TourismRegion
 * Contains coordinates for map display
 *
 * Note: Tourism region names are NOT multilingual - they're the same in all languages
 */

const tourismRegionSchema = new mongoose.Schema({
	// External ID for sync (optional, from districts)
	externalId: {
		type: Number
	},

	// Region name (single language - same in all languages)
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

	// Map coordinates and zoom level
	coordinates: {
		lat: { type: Number },
		lng: { type: Number }
	},
	zoom: {
		type: Number,
		default: 14,
		min: 1,
		max: 20
	},

	// Status
	isActive: {
		type: Boolean,
		default: true
	}
}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes for fast queries and Elasticsearch sync
tourismRegionSchema.index({ city: 1, isActive: 1 })
tourismRegionSchema.index({ city: 1, slug: 1 }, { unique: true, sparse: true })
tourismRegionSchema.index({ name: 'text' })
tourismRegionSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 })
tourismRegionSchema.index({ externalId: 1 }, { sparse: true })

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
tourismRegionSchema.pre('save', function(next) {
	// Auto-generate slug from name if not set
	if (!this.slug && this.name) {
		this.slug = generateSlug(this.name)
	}
	next()
})

// Statics
tourismRegionSchema.statics.findByCity = function(cityId) {
	return this.find({
		city: cityId,
		isActive: true
	})
		.sort({ name: 1 })
		.collation({ locale: 'tr', strength: 1 })
}

tourismRegionSchema.statics.findByExternalId = function(externalId) {
	return this.findOne({ externalId })
}

tourismRegionSchema.statics.search = function(query, cityId = null) {
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

tourismRegionSchema.statics.findBySlug = function(cityId, slug) {
	return this.findOne({
		city: cityId,
		slug: slug,
		isActive: true
	})
}

tourismRegionSchema.statics.findWithCity = function(regionId) {
	return this.findById(regionId).populate('city')
}

export default mongoose.model('TourismRegion', tourismRegionSchema)
