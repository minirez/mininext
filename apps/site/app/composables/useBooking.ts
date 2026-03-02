/**
 * Booking creation & query composable
 */
export function useBookingApi() {
  const api = useApi()

  async function createBooking(payload: any) {
    const res = await api.post<{ success: boolean; data: any }>(
      '/api/public/bookings',
      payload,
    )
    return res.data
  }

  async function getBooking(bookingNumber: string, email: string) {
    const res = await api.get<{ success: boolean; data: any }>(
      `/api/public/bookings/${bookingNumber}`,
      { email },
    )
    return res.data
  }

  async function cancelBooking(bookingNumber: string, email: string, reason?: string) {
    const res = await api.post<{ success: boolean; data: any }>(
      `/api/public/bookings/${bookingNumber}/cancel`,
      { email, reason },
    )
    return res.data
  }

  return { createBooking, getBooking, cancelBooking }
}
