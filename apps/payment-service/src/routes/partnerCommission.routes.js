/**
 * Partner POS Commission Routes
 * Manage commission rates for partners using platform POS terminals
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { PartnerPosCommission } from '../models/index.js';

const router = Router();

/**
 * GET /
 * List all partner commissions
 * Query params:
 *   - partnerId: Filter by partner
 *   - currency: Filter by currency
 *   - status: Filter by status (true/false)
 */
router.get('/', async (req, res) => {
  try {
    const query = {};

    if (req.query.partnerId) {
      query.partnerId = req.query.partnerId;
    }
    if (req.query.currency) {
      query.currency = req.query.currency.toLowerCase();
    }
    if (req.query.status !== undefined) {
      query.status = req.query.status === 'true';
    }

    const commissions = await PartnerPosCommission.find(query)
      .populate('posId', 'name bankCode')
      .sort({ partnerName: 1, currency: 1 });

    res.json({
      status: true,
      commissions
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * GET /:id
 * Get commission details
 */
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz ID formatı' });
    }

    const commission = await PartnerPosCommission.findById(req.params.id)
      .populate('posId', 'name bankCode');

    if (!commission) {
      return res.status(404).json({ status: false, error: 'Komisyon kaydı bulunamadı' });
    }

    res.json({ status: true, commission });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * POST /
 * Create new partner commission
 */
router.post('/', async (req, res) => {
  try {
    const {
      partnerId,
      partnerName,
      posId,
      currency,
      defaultRate,
      rates,
      minCommission,
      maxCommission,
      notes
    } = req.body;

    if (!partnerId || !partnerName || !currency) {
      return res.status(400).json({
        status: false,
        error: 'partnerId, partnerName ve currency gerekli'
      });
    }

    // Check for duplicate
    const existing = await PartnerPosCommission.findOne({
      partnerId,
      currency: currency.toLowerCase(),
      posId: posId || null
    });

    if (existing) {
      return res.status(400).json({
        status: false,
        error: 'Bu partner, para birimi ve POS kombinasyonu için zaten bir komisyon tanımlı'
      });
    }

    const commission = await PartnerPosCommission.create({
      partnerId,
      partnerName,
      posId: posId || null,
      currency: currency.toLowerCase(),
      defaultRate: defaultRate ?? 1.5,
      rates: rates || [],
      minCommission: minCommission || 0,
      maxCommission: maxCommission || 0,
      notes
    });

    res.json({ status: true, commission });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: false,
        error: 'Bu partner, para birimi ve POS kombinasyonu için zaten bir komisyon tanımlı'
      });
    }
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * PUT /:id
 * Update partner commission
 */
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz ID formatı' });
    }

    const commission = await PartnerPosCommission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ status: false, error: 'Komisyon kaydı bulunamadı' });
    }

    const {
      partnerName,
      defaultRate,
      rates,
      minCommission,
      maxCommission,
      status,
      notes
    } = req.body;

    // Update fields
    if (partnerName) commission.partnerName = partnerName;
    if (typeof defaultRate === 'number') commission.defaultRate = defaultRate;
    if (rates !== undefined) commission.rates = rates;
    if (typeof minCommission === 'number') commission.minCommission = minCommission;
    if (typeof maxCommission === 'number') commission.maxCommission = maxCommission;
    if (typeof status === 'boolean') commission.status = status;
    if (notes !== undefined) commission.notes = notes;

    await commission.save();

    res.json({ status: true, commission });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * DELETE /:id
 * Delete partner commission
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz ID formatı' });
    }

    const commission = await PartnerPosCommission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ status: false, error: 'Komisyon kaydı bulunamadı' });
    }

    await commission.deleteOne();

    res.json({ status: true, message: 'Komisyon kaydı silindi' });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * POST /calculate
 * Calculate commission for a transaction (preview)
 */
router.post('/calculate', async (req, res) => {
  try {
    const { partnerId, currency, posId, amount, cardType, cardFamily, installment } = req.body;

    if (!partnerId || !currency || !amount) {
      return res.status(400).json({
        status: false,
        error: 'partnerId, currency ve amount gerekli'
      });
    }

    const commission = await PartnerPosCommission.findForPartner(partnerId, currency, posId);

    if (!commission) {
      return res.json({
        status: true,
        commission: null,
        message: 'Bu partner için komisyon tanımı bulunamadı'
      });
    }

    const calculation = commission.calculateCommission(amount, {
      cardType,
      cardFamily,
      installment
    });

    res.json({
      status: true,
      calculation,
      commissionConfig: {
        _id: commission._id,
        partnerId: commission.partnerId,
        partnerName: commission.partnerName,
        currency: commission.currency,
        defaultRate: commission.defaultRate
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
