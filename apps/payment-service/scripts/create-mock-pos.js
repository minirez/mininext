/**
 * Create Mock POS for Testing
 */
import mongoose from 'mongoose';
import VirtualPos from '../src/models/VirtualPos.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-db';

async function createMockPos() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if mock POS already exists
    const existing = await VirtualPos.findOne({ bankCode: 'mock' });
    if (existing) {
      console.log('Mock POS already exists:', existing.name);
      console.log('ID:', existing._id);
      process.exit(0);
    }

    // Create mock POS
    const mockPos = await VirtualPos.create({
      name: 'Test POS (Mock)',
      bankCode: 'mock',
      provider: 'mock',
      status: true,
      testMode: true,
      currencies: ['try', 'eur', 'usd'],
      defaultForCurrencies: ['try'],
      paymentModel: '3d',
      allowDirectPayment: true,
      partnerId: null,
      sharedWithPartners: true,
      credentials: {
        merchantId: 'TEST',
        terminalId: 'TEST'
      },
      installment: {
        enabled: true,
        minCount: 2,
        maxCount: 12,
        minAmount: 100
      },
      supportedCards: {
        visa: true,
        mastercard: true,
        amex: true,
        troy: true
      },
      limits: {
        minAmount: 1,
        maxAmount: 100000,
        dailyLimit: 500000,
        monthlyLimit: 5000000
      }
    });

    console.log('Mock POS created successfully!');
    console.log('Name:', mockPos.name);
    console.log('ID:', mockPos._id);
    console.log('Bank Code:', mockPos.bankCode);
    console.log('Provider:', mockPos.provider);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createMockPos();
