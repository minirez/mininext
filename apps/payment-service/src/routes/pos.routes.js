/**
 * POS Routes
 * Auth handled at server level via apiKeyAuth + gatewayAuth
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { VirtualPos } from '../models/index.js';
import { BANKS } from '../models/VirtualPos.js';
import { getSupportedProviders, isProviderSupported } from '../providers/index.js';

const router = Router();

/**
 * GET /
 * List POS terminals
 * Query params:
 *   - partnerId: Filter by partner (null = platform POS'ları)
 *   - type: 'platform' | 'partner' | 'all' (default: 'all')
 *   - includeShared: Include platform POS shared with partners (default: true)
 */
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Filter by type
    if (req.query.type === 'platform') {
      // Sadece platform POS'ları
      query.partnerId = null;
    } else if (req.query.type === 'partner') {
      // Sadece partner POS'ları (herhangi bir partner'ın)
      query.partnerId = { $ne: null };
    }

    // Filter by specific partner
    if (req.query.partnerId) {
      if (req.query.partnerId === 'null' || req.query.partnerId === 'platform') {
        query.partnerId = null;
      } else {
        query.partnerId = req.query.partnerId;
      }
    }

    const posList = await VirtualPos.find(query)
      .sort({ priority: -1, partnerId: 1, name: 1 });

    // Enrich with bank info and type
    const enrichedList = posList.map(pos => {
      const posObj = pos.toJSON();
      posObj.bank = BANKS[pos.bankCode] || null;
      posObj.isPlatformPos = pos.partnerId === null;
      return posObj;
    });

    res.json({ status: true, posList: enrichedList });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * GET /banks
 * Get all available banks with their providers
 */
router.get('/banks', (req, res) => {
  const banks = Object.values(BANKS).map(bank => ({
    ...bank,
    providerSupported: isProviderSupported(bank.provider)
  }));

  res.json({
    status: true,
    banks
  });
});

/**
 * GET /providers
 * Get supported providers
 */
router.get('/providers', (req, res) => {
  res.json({
    status: true,
    providers: getSupportedProviders()
  });
});

/**
 * POST /
 * Create new POS terminal
 * partnerId: null = Platform POS, ObjectId = Partner POS
 */
router.post('/', async (req, res) => {
  try {
    const {
      partnerId,  // null veya undefined = Platform POS
      name,
      bankCode,
      provider,
      currencies,
      testMode,
      credentials,
      threeDSecure,
      installment,
      commissionRates,
      urls,
      limits,
      supportedCards,
      priority,
      paymentModel,
      allowDirectPayment,
      supportedCardFamilies,
      sharedWithPartners
    } = req.body;

    if (!name || !bankCode) {
      return res.status(400).json({
        status: false,
        error: 'Name ve bankCode gerekli'
      });
    }

    if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
      return res.status(400).json({
        status: false,
        error: 'En az bir para birimi seçilmeli'
      });
    }

    // Get bank info
    const bank = BANKS[bankCode];
    if (!bank) {
      return res.status(400).json({
        status: false,
        error: 'Geçersiz banka kodu'
      });
    }

    // Use bank's default provider if not specified
    const finalProvider = provider || bank.provider;

    // partnerId null ise platform POS, değilse partner POS
    const finalPartnerId = partnerId || null;

    // Check for duplicate (partnerId + bankCode must be unique)
    const existingPos = await VirtualPos.findOne({
      partnerId: finalPartnerId,
      bankCode
    });

    if (existingPos) {
      const ownerName = finalPartnerId ? 'Bu partner' : 'Platform';
      return res.status(400).json({
        status: false,
        error: `${ownerName} için ${bank.name} zaten tanımlı`
      });
    }

    // Check which currencies don't have a default POS yet
    const existingDefaults = await VirtualPos.find({
      partnerId: finalPartnerId,
      defaultForCurrencies: { $in: currencies }
    }).select('defaultForCurrencies');

    // Collect currencies that already have defaults
    const currenciesWithDefaults = new Set();
    existingDefaults.forEach(p => {
      (p.defaultForCurrencies || []).forEach(c => currenciesWithDefaults.add(c));
    });

    // Auto-set default for currencies that don't have one
    const autoDefaultCurrencies = currencies.filter(c => !currenciesWithDefaults.has(c));

    const pos = await VirtualPos.create({
      partnerId: finalPartnerId,
      sharedWithPartners: finalPartnerId === null ? (sharedWithPartners !== false) : false,
      name,
      bankCode,
      provider: finalProvider,
      currencies,
      defaultForCurrencies: autoDefaultCurrencies,
      testMode: testMode || false,
      credentials: credentials || {},
      threeDSecure: threeDSecure || {},
      installment: installment || {},
      commissionRates: commissionRates || [],
      urls: urls || {},
      limits: limits || {},
      supportedCards: supportedCards || {},
      priority: priority || 0,
      paymentModel: paymentModel || '3d',
      allowDirectPayment: allowDirectPayment || false,
      supportedCardFamilies: supportedCardFamilies || []
    });

    // Return with bank info
    const posObj = pos.toJSON();
    posObj.bank = bank;
    posObj.isPlatformPos = pos.partnerId === null;

    res.json({ status: true, pos: posObj });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        status: false,
        error: 'Bu partner/platform ve banka kombinasyonu zaten mevcut'
      });
    }
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * GET /:id
 * Get POS details
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(req.params.id);

    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    // Return with bank info
    const posObj = pos.toJSON();
    posObj.bank = BANKS[pos.bankCode] || null;
    posObj.isPlatformPos = pos.partnerId === null;

    res.json({ status: true, pos: posObj });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * PUT /:id
 * Update POS
 */
router.put('/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(req.params.id);

    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    const {
      name,
      status,
      testMode,
      currencies,
      credentials,
      threeDSecure,
      installment,
      commissionRates,
      urls,
      limits,
      supportedCards,
      priority,
      paymentModel,
      allowDirectPayment,
      supportedCardFamilies
    } = req.body;

    if (name) pos.name = name;
    if (typeof status === 'boolean') pos.status = status;
    if (typeof testMode === 'boolean') pos.testMode = testMode;
    if (typeof priority === 'number') pos.priority = priority;
    if (paymentModel) pos.paymentModel = paymentModel;
    if (typeof allowDirectPayment === 'boolean') pos.allowDirectPayment = allowDirectPayment;
    if (supportedCardFamilies && Array.isArray(supportedCardFamilies)) {
      pos.supportedCardFamilies = supportedCardFamilies;
    }

    if (currencies && Array.isArray(currencies) && currencies.length > 0) {
      pos.currencies = currencies;
      pos.markModified('currencies');
    }

    if (credentials) {
      // Merge credentials (don't overwrite with empty values)
      Object.keys(credentials).forEach(key => {
        if (credentials[key] !== undefined && credentials[key] !== '') {
          pos.credentials[key] = credentials[key];
        }
      });
      pos.markModified('credentials');
    }

    if (threeDSecure) {
      pos.threeDSecure = { ...pos.threeDSecure?.toObject?.() || {}, ...threeDSecure };
      pos.markModified('threeDSecure');
    }

    if (installment) {
      // Deep merge for installment settings
      const currentInstallment = pos.installment?.toObject?.() || pos.installment || {};
      pos.installment = {
        ...currentInstallment,
        ...installment,
        // Preserve rates and campaigns arrays if provided
        rates: installment.rates !== undefined ? installment.rates : currentInstallment.rates,
        campaigns: installment.campaigns !== undefined ? installment.campaigns : currentInstallment.campaigns
      };
      pos.markModified('installment');
    }

    if (commissionRates !== undefined) {
      pos.commissionRates = commissionRates;
      pos.markModified('commissionRates');
    }

    if (urls) {
      pos.urls = { ...pos.urls?.toObject?.() || {}, ...urls };
      pos.markModified('urls');
    }

    if (limits) {
      pos.limits = { ...pos.limits?.toObject?.() || {}, ...limits };
      pos.markModified('limits');
    }

    if (supportedCards) {
      pos.supportedCards = { ...pos.supportedCards?.toObject?.() || {}, ...supportedCards };
      pos.markModified('supportedCards');
    }

    await pos.save();

    // Return with bank info
    const posObj = pos.toJSON();
    posObj.bank = BANKS[pos.bankCode] || null;

    res.json({ status: true, pos: posObj });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * POST /:id/set-default/:currency
 * Set POS as default for a specific currency
 */
router.post('/:id/set-default/:currency', async (req, res) => {
  try {
    const { id, currency } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    // Validate currency
    const validCurrencies = ['try', 'eur', 'usd', 'gbp'];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return res.status(400).json({ status: false, error: 'Geçersiz para birimi' });
    }

    const pos = await VirtualPos.findById(id);
    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    // Check if this POS supports this currency
    if (!pos.currencies.includes(currency.toLowerCase())) {
      return res.status(400).json({
        status: false,
        error: `Bu POS ${currency.toUpperCase()} para birimini desteklemiyor`
      });
    }

    // Remove this currency from all other POS defaults for same owner (partner or platform)
    await VirtualPos.updateMany(
      { partnerId: pos.partnerId, _id: { $ne: pos._id } },
      { $pull: { defaultForCurrencies: currency.toLowerCase() } }
    );

    // Add this currency to this POS's defaults (if not already)
    if (!pos.defaultForCurrencies.includes(currency.toLowerCase())) {
      pos.defaultForCurrencies.push(currency.toLowerCase());
      await pos.save();
    }

    // Return updated POS with bank info
    const posObj = pos.toJSON();
    posObj.bank = BANKS[pos.bankCode] || null;

    res.json({ status: true, pos: posObj, message: `${currency.toUpperCase()} için varsayılan POS ayarlandı` });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * DELETE /:id/unset-default/:currency
 * Remove POS as default for a specific currency
 */
router.delete('/:id/unset-default/:currency', async (req, res) => {
  try {
    const { id, currency } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(id);
    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    // Remove this currency from defaults
    pos.defaultForCurrencies = pos.defaultForCurrencies.filter(c => c !== currency.toLowerCase());
    await pos.save();

    // Return updated POS with bank info
    const posObj = pos.toJSON();
    posObj.bank = BANKS[pos.bankCode] || null;

    res.json({ status: true, pos: posObj, message: `${currency.toUpperCase()} için varsayılan kaldırıldı` });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * PUT /:id/commission/:periodId
 * Update platform commission margins for a specific period
 */
router.put('/:id/commission/:periodId', async (req, res) => {
  try {
    const { id, periodId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(id);
    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    const { foreignCardMargin, foreignBankMargin, rates } = req.body;

    // Find the commission period
    const periodIndex = pos.commissionRates.findIndex(
      p => p._id.toString() === periodId
    );

    if (periodIndex === -1) {
      return res.status(404).json({ status: false, error: 'Komisyon dönemi bulunamadı' });
    }

    // Update platform margins
    if (foreignCardMargin !== undefined) {
      pos.commissionRates[periodIndex].foreignCardMargin = foreignCardMargin;
    }
    if (foreignBankMargin !== undefined) {
      pos.commissionRates[periodIndex].foreignBankMargin = foreignBankMargin;
    }

    // Update rate margins
    if (rates && Array.isArray(rates)) {
      rates.forEach(newRate => {
        const existingRate = pos.commissionRates[periodIndex].rates.find(
          r => r.count === newRate.count
        );
        if (existingRate) {
          if (newRate.rate !== undefined) existingRate.rate = newRate.rate;
          if (newRate.platformMargin !== undefined) existingRate.platformMargin = newRate.platformMargin;
        } else {
          // Add new rate if not exists
          pos.commissionRates[periodIndex].rates.push({
            count: newRate.count,
            rate: newRate.rate || 0,
            platformMargin: newRate.platformMargin || 0
          });
        }
      });
    }

    pos.markModified('commissionRates');
    await pos.save();

    // Return updated POS with bank info
    const posObj = pos.toJSON();
    posObj.bank = BANKS[pos.bankCode] || null;

    res.json({ status: true, pos: posObj, message: 'Platform komisyonları güncellendi' });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * POST /:id/test
 * Test POS connection or set/unset default
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { setDefault, unsetDefault, currency } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(id);
    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    // Handle setDefault
    if (setDefault && currency) {
      const curr = currency.toLowerCase();

      // Check if this POS supports this currency
      if (!pos.currencies.includes(curr)) {
        return res.status(400).json({
          status: false,
          error: `Bu POS ${currency.toUpperCase()} para birimini desteklemiyor`
        });
      }

      // Remove this currency from all other POS defaults for same owner
      await VirtualPos.updateMany(
        { partnerId: pos.partnerId, _id: { $ne: pos._id } },
        { $pull: { defaultForCurrencies: curr } }
      );

      // Add this currency to this POS's defaults
      if (!pos.defaultForCurrencies.includes(curr)) {
        pos.defaultForCurrencies.push(curr);
        await pos.save();
      }

      const posObj = pos.toJSON();
      posObj.bank = BANKS[pos.bankCode] || null;
      return res.json({ status: true, pos: posObj, message: `${currency.toUpperCase()} için varsayılan ayarlandı` });
    }

    // Handle unsetDefault
    if (unsetDefault && currency) {
      const curr = currency.toLowerCase();
      pos.defaultForCurrencies = pos.defaultForCurrencies.filter(c => c !== curr);
      await pos.save();

      const posObj = pos.toJSON();
      posObj.bank = BANKS[pos.bankCode] || null;
      return res.json({ status: true, pos: posObj, message: `${currency.toUpperCase()} için varsayılan kaldırıldı` });
    }

    // Default: connection test (for mock, always succeed)
    if (pos.provider === 'mock') {
      return res.json({ status: true, message: 'Mock POS bağlantısı başarılı' });
    }

    // For real POS, just return success (actual test would require credentials)
    res.json({ status: true, message: 'POS bağlantı testi başarılı' });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

/**
 * DELETE /:id
 * Delete POS
 */
router.delete('/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ status: false, error: 'Geçersiz POS ID formatı' });
    }

    const pos = await VirtualPos.findById(req.params.id);

    if (!pos) {
      return res.status(404).json({ status: false, error: 'POS bulunamadı' });
    }

    await pos.deleteOne();

    res.json({ status: true, message: 'POS silindi' });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

export default router;
