/**
 * Business Metrics
 * Custom Prometheus counters for business-level events.
 * Exported separately so other modules can import and increment them.
 *
 * Usage in other modules:
 *   import { bookingCreatedTotal, paymentProcessedTotal, searchPerformedTotal } from '#middleware/businessMetrics.js'
 *   bookingCreatedTotal.inc()
 *   paymentProcessedTotal.inc({ status: 'success' })
 *   searchPerformedTotal.inc()
 */

import client from 'prom-client'

export const bookingCreatedTotal = new client.Counter({
  name: 'booking_created_total',
  help: 'Total number of bookings created',
  labelNames: []
})

export const paymentProcessedTotal = new client.Counter({
  name: 'payment_processed_total',
  help: 'Total number of payments processed',
  labelNames: ['status']
})

export const searchPerformedTotal = new client.Counter({
  name: 'search_performed_total',
  help: 'Total number of hotel/room searches performed',
  labelNames: []
})
