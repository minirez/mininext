/**
 * Payment flow composable
 */
export function usePaymentApi() {
  const api = useApi()

  async function queryBin(hotelCode: string, bin: string, amount: number, currency: string) {
    const res = await api.post<{ success: boolean; data: any }>(
      '/api/public/payment/bin',
      { hotelCode, bin, amount, currency },
    )
    return res.data
  }

  async function initiatePayment(bookingNumber: string, payload: {
    email: string
    posId?: string
    installment?: number
    card: {
      holder: string
      number: string
      expiry: string
      cvv: string
    }
  }) {
    const res = await api.post<{ success: boolean; data: any }>(
      `/api/public/bookings/${bookingNumber}/pay`,
      payload,
    )
    return res.data
  }

  async function getPaymentStatus(bookingNumber: string, email: string, paymentId?: string) {
    const res = await api.get<{ success: boolean; data: any }>(
      `/api/public/bookings/${bookingNumber}/payment-status`,
      { email, paymentId },
    )
    return res.data
  }

  async function getPaymentMethods(hotelCode: string) {
    const res = await api.get<{ success: boolean; data: any }>(
      `/api/public/hotels/${hotelCode}/payment-methods`,
    )
    return res.data
  }

  async function getBankAccounts(partnerId?: string) {
    const res = await api.get<{ success: boolean; data: any }>(
      '/api/public/payment/bank-accounts',
      { partnerId },
    )
    return res.data
  }

  return { queryBin, initiatePayment, getPaymentStatus, getPaymentMethods, getBankAccounts }
}
