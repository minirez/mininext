import mongoose from 'mongoose'

/**
 * Agency Model - B2B Sub-Agency
 * Agencies that sell Partner's hotels and earn commission
 */

// Document schema for agency documents (license, contracts, etc.)
const documentSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['license', 'tax_certificate', 'contract', 'other'],
		default: 'license'
	},
	name: { type: String, trim: true },
	url: { type: String, trim: true },
	uploadedAt: { type: Date, default: Date.now }
}, { _id: true })

const agencySchema = new mongoose.Schema({
	// Partner Bağlantısı (Multi-tenant)
	partner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Partner',
		required: [true, 'REQUIRED_PARTNER'],
		index: true
	},

	// ============= TEMEL BİLGİLER =============
	// Durum
	status: {
		type: String,
		enum: {
			values: ['active', 'inactive', 'pending', 'suspended'],
			message: 'INVALID_STATUS'
		},
		default: 'pending'
	},

	// Kurumsal Bilgiler
	companyName: {
		type: String,
		required: [true, 'REQUIRED_COMPANY_NAME'],
		trim: true,
		minlength: [2, 'COMPANY_NAME_MIN_LENGTH'],
		maxlength: [200, 'COMPANY_NAME_MAX_LENGTH']
	},

	// Ticari İsim (müşterilere görünen)
	tradeName: {
		type: String,
		trim: true,
		maxlength: [200, 'TRADE_NAME_MAX_LENGTH']
	},

	// Legacy field - alias for companyName
	name: {
		type: String,
		trim: true
	},

	// Vergi Bilgileri
	taxOffice: {
		type: String,
		trim: true
	},

	taxNumber: {
		type: String,
		trim: true
	},

	// ============= YETKİLİ KİŞİ =============
	contactPerson: {
		name: { type: String, trim: true },
		phone: { type: String, trim: true },
		email: {
			type: String,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
		}
	},

	// Ana İletişim (legacy + primary)
	email: {
		type: String,
		required: [true, 'REQUIRED_EMAIL'],
		lowercase: true,
		trim: true,
		match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
	},

	phone: {
		type: String,
		trim: true
	},

	// ============= ADRES =============
	address: {
		street: { type: String, trim: true },
		city: { type: String, trim: true },
		country: { type: String, trim: true },
		postalCode: { type: String, trim: true }
	},

	// ============= BELGELER =============
	documents: [documentSchema],

	// ============= KOMİSYON AYARLARI =============
	commissionSettings: {
		// Komisyon tipi
		type: {
			type: String,
			enum: ['percentage', 'fixed'],
			default: 'percentage'
		},
		// Komisyon oranı (% veya sabit tutar)
		rate: {
			type: Number,
			min: 0,
			max: 100,
			default: 10
		},
		// Ekstra markup koyabilir mi?
		extraMarkupAllowed: {
			type: Boolean,
			default: true
		},
		// Max ekstra markup %
		maxExtraMarkup: {
			type: Number,
			min: 0,
			max: 50,
			default: 10
		}
	},

	// Legacy markup field (for backward compatibility)
	markup: {
		hotel: {
			type: Number,
			default: 0,
			min: [0, 'MARKUP_MIN_ZERO'],
			max: [100, 'MARKUP_MAX_HUNDRED']
		},
		tour: {
			type: Number,
			default: 0,
			min: [0, 'MARKUP_MIN_ZERO'],
			max: [100, 'MARKUP_MAX_HUNDRED']
		},
		transfer: {
			type: Number,
			default: 0,
			min: [0, 'MARKUP_MIN_ZERO'],
			max: [100, 'MARKUP_MAX_HUNDRED']
		}
	},

	// ============= SATIŞ KISITLAMALARI =============
	salesRestrictions: {
		// İzin verilen ülkeler (boş = tüm ülkeler)
		allowedCountries: [{
			type: String,
			uppercase: true,
			trim: true
		}],
		// İzin verilen oteller (boş = tüm oteller)
		allowedHotels: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel'
		}],
		// Yasaklı oteller
		blockedHotels: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Hotel'
		}]
	},

	// ============= ÖDEME AYARLARI =============
	paymentSettings: {
		// İzin verilen ödeme yöntemleri
		allowedMethods: [{
			type: String,
			enum: ['bank_transfer', 'credit_card', 'virtual_pos', 'cash']
		}],
		// Kredi kartı ayarları
		creditCard: {
			enabled: { type: Boolean, default: true },
			installmentsAllowed: { type: Boolean, default: false },
			maxInstallments: {
				type: Number,
				min: 1,
				max: 12,
				default: 6
			}
		},
		// Havale ayarları
		bankTransfer: {
			enabled: { type: Boolean, default: true }
		}
	},

	// ============= KREDİ LİMİTİ =============
	creditLimit: {
		enabled: { type: Boolean, default: false },
		amount: {
			type: Number,
			min: 0,
			default: 0
		},
		currency: {
			type: String,
			enum: ['TRY', 'USD', 'EUR', 'GBP'],
			default: 'EUR'
		},
		used: {
			type: Number,
			min: 0,
			default: 0
		}
	},

	// ============= FATURA BİLGİLERİ =============
	billing: {
		invoiceAddress: { type: String, trim: true },
		invoiceEmail: {
			type: String,
			trim: true,
			lowercase: true
		},
		paymentTermDays: {
			type: Number,
			min: 0,
			max: 90,
			default: 30
		}
	},

	// ============= EK AYARLAR =============
	settings: {
		// Min. geceleme
		minNights: {
			type: Number,
			min: 1,
			default: 1
		},
		// Max. gün önceden rezervasyon
		maxAdvanceDays: {
			type: Number,
			min: 1,
			max: 365,
			default: 365
		},
		// API erişimi
		apiAccess: {
			enabled: { type: Boolean, default: false },
			apiKey: { type: String, trim: true }
		},
		// Özel notlar
		notes: { type: String, trim: true }
	},

	// ============= İSTATİSTİKLER =============
	stats: {
		totalBookings: { type: Number, default: 0 },
		totalRevenue: { type: Number, default: 0 },
		lastBookingDate: { type: Date }
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
agencySchema.index({ partner: 1, email: 1 }, { unique: true })
agencySchema.index({ partner: 1, status: 1 })
agencySchema.index({ partner: 1, companyName: 1 })
agencySchema.index({ 'salesRestrictions.allowedCountries': 1 })
agencySchema.index({ 'salesRestrictions.allowedHotels': 1 })

// Pre-save middleware
agencySchema.pre('save', function(next) {
	// Lowercase email
	if (this.email) {
		this.email = this.email.toLowerCase()
	}

	// Sync name with companyName for backward compatibility
	if (this.companyName && !this.name) {
		this.name = this.companyName
	}

	// Set default payment methods if empty
	if (!this.paymentSettings.allowedMethods || this.paymentSettings.allowedMethods.length === 0) {
		this.paymentSettings.allowedMethods = ['credit_card', 'bank_transfer']
	}

	next()
})

// Virtuals
agencySchema.virtual('availableCredit').get(function() {
	if (!this.creditLimit.enabled) return 0
	return Math.max(0, this.creditLimit.amount - this.creditLimit.used)
})

// Methods
agencySchema.methods.isActive = function() {
	return this.status === 'active'
}

agencySchema.methods.activate = async function() {
	this.status = 'active'
	return await this.save()
}

agencySchema.methods.deactivate = async function() {
	this.status = 'inactive'
	return await this.save()
}

agencySchema.methods.suspend = async function() {
	this.status = 'suspended'
	return await this.save()
}

// Check if agency can sell a specific hotel
agencySchema.methods.canSellHotel = function(hotelId) {
	const hotelIdStr = hotelId.toString()

	// Check if blocked
	if (this.salesRestrictions.blockedHotels?.some(h => h.toString() === hotelIdStr)) {
		return false
	}

	// If allowedHotels is empty, can sell all hotels
	if (!this.salesRestrictions.allowedHotels || this.salesRestrictions.allowedHotels.length === 0) {
		return true
	}

	// Check if in allowed list
	return this.salesRestrictions.allowedHotels.some(h => h.toString() === hotelIdStr)
}

// Check if agency can sell to a specific country
agencySchema.methods.canSellToCountry = function(countryCode) {
	// If allowedCountries is empty, can sell to all countries
	if (!this.salesRestrictions.allowedCountries || this.salesRestrictions.allowedCountries.length === 0) {
		return true
	}

	return this.salesRestrictions.allowedCountries.includes(countryCode.toUpperCase())
}

// Check if payment method is allowed
agencySchema.methods.isPaymentMethodAllowed = function(method) {
	return this.paymentSettings.allowedMethods?.includes(method) || false
}

// Use credit
agencySchema.methods.useCredit = async function(amount) {
	if (!this.creditLimit.enabled) {
		throw new Error('Credit limit is not enabled')
	}

	if (amount > this.availableCredit) {
		throw new Error('Insufficient credit')
	}

	this.creditLimit.used += amount
	return await this.save()
}

// Release credit (after payment)
agencySchema.methods.releaseCredit = async function(amount) {
	this.creditLimit.used = Math.max(0, this.creditLimit.used - amount)
	return await this.save()
}

agencySchema.methods.getTotalMarkup = function(productType) {
	// Partner + Agency markup toplamı
	if (!this.populated('partner')) {
		throw new Error('Partner must be populated')
	}

	const partnerMarkup = this.partner.markup?.[productType] || 0
	const agencyMarkup = this.markup?.[productType] || 0

	return partnerMarkup + agencyMarkup
}

// Statics
agencySchema.statics.findByPartner = function(partnerId) {
	return this.find({ partner: partnerId })
}

agencySchema.statics.findByPartnerAndEmail = function(partnerId, email) {
	return this.findOne({
		partner: partnerId,
		email: email.toLowerCase()
	})
}

agencySchema.statics.findActiveByPartner = function(partnerId) {
	return this.find({
		partner: partnerId,
		status: 'active'
	})
}

// Find agencies that can sell a specific hotel
agencySchema.statics.findCanSellHotel = function(partnerId, hotelId) {
	return this.find({
		partner: partnerId,
		status: 'active',
		$or: [
			{ 'salesRestrictions.allowedHotels': { $size: 0 } },
			{ 'salesRestrictions.allowedHotels': { $exists: false } },
			{ 'salesRestrictions.allowedHotels': hotelId }
		],
		'salesRestrictions.blockedHotels': { $ne: hotelId }
	})
}

export default mongoose.model('Agency', agencySchema)
