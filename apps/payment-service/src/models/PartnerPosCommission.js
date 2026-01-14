/**
 * Partner POS Commission Model
 * Defines extra commission rates for partners using platform POS terminals
 *
 * Partners can either:
 * 1. Use their own POS (no platform commission)
 * 2. Use platform POS with extra commission (defined here)
 */

import mongoose from 'mongoose';

const commissionRateSchema = new mongoose.Schema({
  cardType: {
    type: String,
    enum: ['credit', 'debit', 'prepaid', 'all'],
    default: 'all'
  },
  cardFamily: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'troy', 'all'],
    default: 'all'
  },
  installment: {
    type: Number,
    default: 1  // 1 = pesin, 2-12 = taksit
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fixedAmount: {
    type: Number,
    default: 0  // Fixed amount per transaction (optional)
  }
}, { _id: false });

const partnerPosCommissionSchema = new mongoose.Schema({
  // Partner reference (from main booking-engine API)
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  // Partner name for display (denormalized)
  partnerName: {
    type: String,
    required: true
  },

  // Optional: Specific POS terminal (null = applies to all platform POS)
  posId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualPos',
    default: null
  },

  // Currency this commission applies to
  currency: {
    type: String,
    enum: ['try', 'eur', 'usd', 'gbp'],
    required: true
  },

  // Default commission rate (used if no specific rate matches)
  defaultRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 1.5  // 1.5% default platform commission
  },

  // Specific rates by card type, family, installment
  rates: [commissionRateSchema],

  // Minimum commission amount per transaction
  minCommission: {
    type: Number,
    default: 0
  },

  // Maximum commission amount per transaction (0 = no limit)
  maxCommission: {
    type: Number,
    default: 0
  },

  // Active status
  status: {
    type: Boolean,
    default: true
  },

  // Notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for unique partner+currency+pos combination
partnerPosCommissionSchema.index(
  { partnerId: 1, currency: 1, posId: 1 },
  { unique: true }
);

/**
 * Calculate commission for a transaction
 * @param {number} amount - Transaction amount
 * @param {object} options - Card and transaction details
 * @returns {object} Commission details
 */
partnerPosCommissionSchema.methods.calculateCommission = function(amount, options = {}) {
  const { cardType = 'all', cardFamily = 'all', installment = 1 } = options;

  // Find matching rate (most specific first)
  let matchedRate = null;

  // Try to find exact match
  for (const rate of this.rates) {
    const typeMatch = rate.cardType === cardType || rate.cardType === 'all';
    const familyMatch = rate.cardFamily === cardFamily || rate.cardFamily === 'all';
    const installmentMatch = rate.installment === installment || rate.installment === 1;

    if (typeMatch && familyMatch && installmentMatch) {
      // Prefer more specific matches
      if (!matchedRate ||
          (rate.cardType !== 'all' && matchedRate.cardType === 'all') ||
          (rate.cardFamily !== 'all' && matchedRate.cardFamily === 'all') ||
          (rate.installment !== 1 && matchedRate.installment === 1)) {
        matchedRate = rate;
      }
    }
  }

  // Use default rate if no specific rate found
  const commissionRate = matchedRate ? matchedRate.rate : this.defaultRate;
  const fixedAmount = matchedRate ? (matchedRate.fixedAmount || 0) : 0;

  // Calculate commission
  let commissionAmount = (amount * commissionRate / 100) + fixedAmount;

  // Apply min/max limits
  if (this.minCommission > 0 && commissionAmount < this.minCommission) {
    commissionAmount = this.minCommission;
  }
  if (this.maxCommission > 0 && commissionAmount > this.maxCommission) {
    commissionAmount = this.maxCommission;
  }

  return {
    rate: commissionRate,
    fixedAmount,
    amount: Math.round(commissionAmount * 100) / 100,  // Round to 2 decimal places
    matchedRule: matchedRate ? {
      cardType: matchedRate.cardType,
      cardFamily: matchedRate.cardFamily,
      installment: matchedRate.installment
    } : null
  };
};

/**
 * Find commission config for a partner
 * @param {string} partnerId - Partner ID
 * @param {string} currency - Currency code
 * @param {string} posId - Optional specific POS ID
 */
partnerPosCommissionSchema.statics.findForPartner = async function(partnerId, currency, posId = null) {
  // First try to find POS-specific commission
  if (posId) {
    const specific = await this.findOne({
      partnerId,
      currency: currency.toLowerCase(),
      posId,
      status: true
    });
    if (specific) return specific;
  }

  // Fall back to general commission for partner
  return this.findOne({
    partnerId,
    currency: currency.toLowerCase(),
    posId: null,
    status: true
  });
};

export const PartnerPosCommission = mongoose.model('PartnerPosCommission', partnerPosCommissionSchema);
export default PartnerPosCommission;
