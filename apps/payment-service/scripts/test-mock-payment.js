/**
 * Test Mock Payment Flow
 */
import mongoose from 'mongoose';
import VirtualPos from '../src/models/VirtualPos.js';
import Transaction from '../src/models/Transaction.js';
import { getProvider } from '../src/providers/index.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment-db';

async function testMockPayment() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find mock POS
    const mockPos = await VirtualPos.findOne({ bankCode: 'mock' });
    if (!mockPos) {
      console.error('Mock POS not found! Create one first.');
      process.exit(1);
    }
    console.log('Found Mock POS:', mockPos.name, '(ID:', mockPos._id, ')\n');

    // Test cards
    const testCases = [
      { number: '4111111111111111', expected: 'success', description: 'Başarılı kart' },
      { number: '5555555555554444', expected: 'failed', description: 'Reddedilen kart' },
      { number: '4000000000000119', expected: 'failed', description: 'Yetersiz bakiye' },
    ];

    for (const testCase of testCases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${testCase.description}`);
      console.log(`Card: ${testCase.number}`);
      console.log(`Expected: ${testCase.expected}`);
      console.log('='.repeat(60));

      // Create transaction
      const transaction = new Transaction({
        pos: mockPos._id,
        amount: 100,
        currency: 'try',
        installment: 1,
        card: {
          holder: 'TEST USER',
          number: testCase.number,
          expiry: '12/28',
          cvv: '123'
        },
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
          ip: '127.0.0.1'
        },
        status: 'pending'
      });

      await transaction.save();
      console.log('Transaction created:', transaction._id);

      // Get provider
      const provider = getProvider(transaction, mockPos);
      console.log('Provider:', provider.constructor.name);

      // Initialize payment
      console.log('\n1. Initializing payment...');
      const initResult = await provider.initialize();
      console.log('Init result:', initResult);

      if (initResult.success) {
        // Reload transaction to get formData
        const updatedTx = await Transaction.findById(transaction._id);

        console.log('\n2. Getting form HTML...');
        const formHtml = await provider.getFormHtml();
        console.log('Form HTML generated:', formHtml.length, 'bytes');

        // Simulate callback (as if bank returned)
        console.log('\n3. Simulating 3D callback...');
        const callbackData = {
          mdStatus: '1',
          orderId: updatedTx.secure?.formData?.orderId,
          amount: '100.00',
          currency: 'TRY',
          md: 'MOCK_MD_TEST',
          xid: 'MOCK_XID_TEST',
          eci: '05',
          cavv: 'MOCK_CAVV_TEST'
        };

        const callbackResult = await provider.processCallback(callbackData);
        console.log('Callback result:', callbackResult);

        // Check final status
        const finalTx = await Transaction.findById(transaction._id);
        console.log('\nFinal transaction status:', finalTx.status);
        console.log('Result:', JSON.stringify(finalTx.result, null, 2));

        // Verify
        const passed = finalTx.status === testCase.expected;
        console.log(`\n${passed ? '✓ PASSED' : '✗ FAILED'}: Expected ${testCase.expected}, got ${finalTx.status}`);
      }
    }

    // Cleanup test transactions
    console.log('\n\nCleaning up test transactions...');
    await Transaction.deleteMany({ 'customer.email': 'test@example.com' });
    console.log('Done!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testMockPayment();
