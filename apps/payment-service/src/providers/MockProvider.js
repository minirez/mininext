/**
 * Mock POS Provider
 * Test ortamı için sahte ödeme simülasyonu
 *
 * Test Kartları:
 * - 4111111111111111 → Başarılı ödeme
 * - 5555555555554444 → Başarısız ödeme (kart reddi)
 * - 4000000000000119 → Başarısız ödeme (yetersiz bakiye)
 * - 4000000000000069 → Başarısız ödeme (kart bloke)
 * - Sonu 0000 ile biten kartlar → Başarısız
 * - Diğer tüm kartlar → Başarılı
 */

import BaseProvider from './BaseProvider.js';

// Test kart numaraları ve sonuçları
const TEST_CARDS = {
  '4111111111111111': { success: true, message: 'İşlem başarılı' },
  '5555555555554444': { success: false, code: '05', message: 'Kart reddedildi' },
  '4000000000000119': { success: false, code: '51', message: 'Yetersiz bakiye' },
  '4000000000000069': { success: false, code: '62', message: 'Kart blokeli' },
  '4000000000003220': { success: true, message: '3D doğrulama başarılı' },
  '4000000000003238': { success: false, code: '99', message: '3D doğrulama başarısız' }
};

export default class MockProvider extends BaseProvider {
  constructor(transaction, virtualPos) {
    super(transaction, virtualPos);
    this.providerName = 'mock';
  }

  /**
   * Generate mock order ID
   */
  getOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `MOCK_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Determine payment result based on card number
   */
  getCardResult(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Check test cards
    if (TEST_CARDS[cleanNumber]) {
      return TEST_CARDS[cleanNumber];
    }

    // Cards ending with 0000 fail
    if (cleanNumber.endsWith('0000')) {
      return { success: false, code: '99', message: 'Test kartı - sonu 0000' };
    }

    // All other cards succeed
    return { success: true, message: 'İşlem başarılı' };
  }

  /**
   * Generate mock auth code
   */
  generateAuthCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Generate mock reference number
   */
  generateRefNumber() {
    return Date.now().toString().slice(-12);
  }

  /**
   * Initialize 3D Secure payment
   */
  async initialize() {
    const card = this.getCard();
    const orderId = this.getOrderId();
    const paymentModel = this.pos.paymentModel || '3d';

    // Non-3D ödeme için direkt payment kullan
    if (paymentModel === 'regular') {
      return this.directPayment();
    }

    const callbackUrl = this.getCallbackUrl();

    // Mock form data
    const formData = {
      orderId,
      amount: this.formatAmount(true),
      currency: this.transaction.currency.toUpperCase(),
      installment: this.transaction.installment,
      callbackUrl,
      cardLast4: card.number.replace(/\s/g, '').slice(-4),
      cardBrand: this.detectCardBrand(card.number)
    };

    // Store form data
    this.transaction.secure = this.transaction.secure || {};
    this.transaction.secure.formData = formData;
    this.transaction.secure.paymentModel = paymentModel;
    this.transaction.orderId = orderId;

    await this.saveSecure();
    await this.log('init', {
      orderId,
      amount: this.formatAmount(true),
      currency: this.transaction.currency,
      paymentModel,
      mock: true
    });

    return { success: true };
  }

  /**
   * Detect card brand from number
   */
  detectCardBrand(number) {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'VISA';
    if (cleanNumber.startsWith('5')) return 'MASTERCARD';
    if (cleanNumber.startsWith('9')) return 'TROY';
    if (cleanNumber.startsWith('3')) return 'AMEX';
    return 'UNKNOWN';
  }

  /**
   * Get 3D form HTML - simulates bank redirect
   */
  async getFormHtml() {
    const formData = this.transaction.secure?.formData;
    if (!formData) {
      throw new Error('Form verisi bulunamadı');
    }

    const callbackUrl = formData.callbackUrl;

    // Simulate 3D verification page
    // Auto-submits after 2 seconds to callback URL
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>3D Secure Doğrulama (Test)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    .bank-logo {
      width: 80px;
      height: 80px;
      background: #f0f0f0;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    h1 { color: #333; font-size: 20px; margin-bottom: 10px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #2ecc71;
      margin-bottom: 20px;
    }
    .details {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      text-align: left;
    }
    .details p {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      color: #555;
      font-size: 14px;
    }
    .details p span:last-child { font-weight: 500; color: #333; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status { color: #667eea; font-weight: 500; }
    .test-badge {
      background: #ff6b6b;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 20px;
    }
    .countdown { color: #999; font-size: 12px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="test-badge">TEST MODU</div>
    <div class="bank-logo">🏦</div>
    <h1>3D Secure Doğrulama</h1>
    <p class="subtitle">Mock Bank - Test Ortamı</p>

    <div class="amount">${formData.amount} ${formData.currency}</div>

    <div class="details">
      <p><span>Sipariş No:</span> <span>${formData.orderId}</span></p>
      <p><span>Kart:</span> <span>**** **** **** ${formData.cardLast4}</span></p>
      <p><span>Taksit:</span> <span>${formData.installment > 1 ? formData.installment + ' Taksit' : 'Peşin'}</span></p>
    </div>

    <div class="spinner"></div>
    <p class="status">3D doğrulama simüle ediliyor...</p>
    <p class="countdown">Otomatik yönlendirme: <span id="timer">3</span> saniye</p>
  </div>

  <form id="callbackForm" method="POST" action="${callbackUrl}" style="display:none;">
    <input type="hidden" name="mdStatus" value="1">
    <input type="hidden" name="orderId" value="${formData.orderId}">
    <input type="hidden" name="amount" value="${formData.amount}">
    <input type="hidden" name="currency" value="${formData.currency}">
    <input type="hidden" name="md" value="MOCK_MD_${Date.now()}">
    <input type="hidden" name="xid" value="MOCK_XID_${Date.now()}">
    <input type="hidden" name="eci" value="05">
    <input type="hidden" name="cavv" value="MOCK_CAVV_${Date.now()}">
    <input type="hidden" name="mockProvider" value="true">
  </form>

  <script>
    let seconds = 3;
    const timer = document.getElementById('timer');
    const interval = setInterval(() => {
      seconds--;
      timer.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(interval);
        document.getElementById('callbackForm').submit();
      }
    }, 1000);
  </script>
</body>
</html>`;

    await this.log('3d_redirect', { url: 'mock://3d-secure-page' }, formData);
    return html;
  }

  /**
   * Process 3D callback from mock bank
   */
  async processCallback(postData) {
    await this.log('3d_callback', postData, {});

    const paymentModel = this.transaction.secure?.paymentModel || '3d';

    // Check 3D status (mdStatus should be '1' for success)
    const mdStatus = postData.mdStatus || postData.mdstatus;
    if (mdStatus !== '1') {
      this.transaction.status = 'failed';
      this.transaction.result = {
        success: false,
        code: mdStatus,
        message: postData.mderrormessage || '3D doğrulama başarısız'
      };
      await this.saveSecure();
      return { success: false, message: this.transaction.result.message };
    }

    // Get card and check test result
    const card = this.getCard();
    const cardResult = this.getCardResult(card.number);

    // Simulate bank response
    const mockResponse = {
      orderId: postData.orderId,
      amount: postData.amount,
      currency: postData.currency,
      authCode: cardResult.success ? this.generateAuthCode() : null,
      refNumber: cardResult.success ? this.generateRefNumber() : null,
      responseCode: cardResult.success ? '00' : cardResult.code,
      responseMessage: cardResult.message,
      transactionId: `MOCK_TXN_${Date.now()}`
    };

    await this.log('provision', { orderId: postData.orderId }, mockResponse);

    if (cardResult.success) {
      this.transaction.status = 'success';
      this.transaction.result = {
        success: true,
        authCode: mockResponse.authCode,
        refNumber: mockResponse.refNumber,
        message: cardResult.message
      };
      this.transaction.completedAt = new Date();
      await this.transaction.clearCvv();

      return { success: true, message: cardResult.message };
    } else {
      this.transaction.status = 'failed';
      this.transaction.result = {
        success: false,
        code: cardResult.code,
        message: cardResult.message
      };
      await this.saveSecure();

      return { success: false, message: cardResult.message };
    }
  }

  /**
   * Direct payment (Non-3D Secure)
   */
  async directPayment() {
    const card = this.getCard();
    const orderId = this.getOrderId();

    // Store orderId
    this.transaction.orderId = orderId;

    // Get result based on card number
    const cardResult = this.getCardResult(card.number);

    // Mock request/response
    const mockRequest = {
      orderId,
      amount: this.formatAmount(true),
      currency: this.transaction.currency,
      installment: this.transaction.installment,
      cardLast4: card.number.replace(/\s/g, '').slice(-4),
      type: 'direct_payment'
    };

    const mockResponse = {
      orderId,
      responseCode: cardResult.success ? '00' : cardResult.code,
      responseMessage: cardResult.message,
      authCode: cardResult.success ? this.generateAuthCode() : null,
      refNumber: cardResult.success ? this.generateRefNumber() : null,
      transactionId: `MOCK_TXN_${Date.now()}`
    };

    await this.log('provision', mockRequest, mockResponse);

    if (cardResult.success) {
      this.transaction.status = 'success';
      this.transaction.result = {
        success: true,
        authCode: mockResponse.authCode,
        refNumber: mockResponse.refNumber,
        message: cardResult.message
      };
      this.transaction.completedAt = new Date();
      await this.transaction.clearCvv();

      return { success: true, message: cardResult.message };
    } else {
      this.transaction.status = 'failed';
      this.transaction.result = {
        success: false,
        code: cardResult.code,
        message: cardResult.message
      };
      await this.saveSecure();

      return { success: false, message: cardResult.message };
    }
  }

  /**
   * Refund a completed payment
   */
  async refund(originalTransaction) {
    const orderId = originalTransaction.orderId;

    const mockRequest = {
      type: 'refund',
      originalOrderId: orderId,
      amount: this.formatAmount(true),
      currency: this.transaction.currency
    };

    const mockResponse = {
      responseCode: '00',
      responseMessage: 'İade başarılı',
      authCode: this.generateAuthCode(),
      refNumber: this.generateRefNumber(),
      transactionId: `MOCK_RFN_${Date.now()}`
    };

    await this.log('refund', mockRequest, mockResponse);

    this.transaction.status = 'success';
    this.transaction.result = {
      success: true,
      authCode: mockResponse.authCode,
      refNumber: mockResponse.refNumber,
      message: 'İade başarılı'
    };
    this.transaction.completedAt = new Date();
    await this.transaction.save();

    // Mark original as refunded
    originalTransaction.refundedAt = new Date();
    await originalTransaction.save();

    return this.successResponse({
      message: 'İade başarılı',
      authCode: mockResponse.authCode,
      refNumber: mockResponse.refNumber
    });
  }

  /**
   * Cancel a payment
   */
  async cancel(originalTransaction) {
    const orderId = originalTransaction.orderId;

    const mockRequest = {
      type: 'cancel',
      originalOrderId: orderId,
      amount: originalTransaction.amount
    };

    const mockResponse = {
      responseCode: '00',
      responseMessage: 'İptal başarılı',
      transactionId: `MOCK_CNC_${Date.now()}`
    };

    await this.log('cancel', mockRequest, mockResponse);

    this.transaction.status = 'success';
    this.transaction.result = {
      success: true,
      message: 'İptal başarılı'
    };
    this.transaction.completedAt = new Date();
    await this.transaction.save();

    // Mark original as cancelled
    originalTransaction.cancelledAt = new Date();
    originalTransaction.status = 'cancelled';
    await originalTransaction.save();

    return this.successResponse({ message: 'İptal başarılı' });
  }

  /**
   * Query payment status
   */
  async status(orderId) {
    const mockResponse = {
      orderId,
      status: this.transaction.status,
      amount: this.transaction.amount,
      currency: this.transaction.currency,
      authCode: this.transaction.result?.authCode,
      refNumber: this.transaction.result?.refNumber
    };

    await this.log('status', { orderId }, mockResponse);

    return {
      success: true,
      orderId,
      status: this.transaction.status,
      amount: this.transaction.amount,
      authCode: this.transaction.result?.authCode,
      refNumber: this.transaction.result?.refNumber
    };
  }

  /**
   * Provider capabilities
   */
  getCapabilities() {
    return {
      payment3D: true,
      paymentDirect: true,
      refund: true,
      cancel: true,
      status: true,
      history: false,
      preAuth: false,
      postAuth: false,
      paymentModels: ['3d', '3d_pay', 'regular']
    };
  }
}
