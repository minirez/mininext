import mongoose from 'mongoose'

/**
 * Tag Model
 * Multi-language tags for hotels
 * Auto-translated to 20 languages using Gemini AI
 */

// All supported languages (same as hotel model)
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Multilingual text schema helper
const multiLangString = () => {
	const schema = {}
	SUPPORTED_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

const tagSchema = new mongoose.Schema({
	// Multilingual name
	name: multiLangString(),

	// URL-friendly identifier
	slug: {
		type: String,
		unique: true,
		trim: true,
		lowercase: true
	},

	// Display color (hex)
	color: {
		type: String,
		default: '#6366f1',
		trim: true
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

// Indexes (slug is already indexed via unique: true in schema)
tagSchema.index({ isActive: 1 })
tagSchema.index({ 'name.tr': 'text', 'name.en': 'text' })

// Helper to generate slug from text
const generateSlug = (text) => {
	if (!text) return ''

	// Turkish character replacements
	const turkishMap = {
		'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
		'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
	}

	let slug = text.toLowerCase()

	// Replace Turkish characters
	for (const [from, to] of Object.entries(turkishMap)) {
		slug = slug.replace(new RegExp(from, 'g'), to)
	}

	return slug
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
}

// Pre-save middleware
tagSchema.pre('save', function(next) {
	// Auto-generate slug from Turkish name if not set
	if (!this.slug && this.name.tr) {
		this.slug = generateSlug(this.name.tr)
	}
	next()
})

// Statics
tagSchema.statics.findBySlug = function(slug) {
	return this.findOne({ slug: slug, isActive: true })
}

tagSchema.statics.findActive = function() {
	return this.find({ isActive: true }).sort({ 'name.tr': 1 })
}

tagSchema.statics.search = function(query, lang = 'tr') {
	const searchField = `name.${lang}`
	return this.find({
		isActive: true,
		[searchField]: { $regex: query, $options: 'i' }
	}).sort({ [searchField]: 1 })
}

export const TAG_LANGUAGES = SUPPORTED_LANGUAGES
export default mongoose.model('Tag', tagSchema)
