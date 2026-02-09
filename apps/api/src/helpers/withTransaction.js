/**
 * MongoDB Transaction Helper
 * Provides transactional support with graceful fallback for standalone deployments.
 *
 * Usage:
 *   import { withTransaction } from '#helpers'
 *
 *   const result = await withTransaction(async (session) => {
 *     const opts = session ? { session } : {}
 *     await booking.save(opts)
 *     await payment.save(opts)
 *     const [link] = await PaymentLink.create([data], opts)
 *     return { booking, payment, link }
 *   })
 */

import mongoose from 'mongoose'
import logger from '#core/logger.js'

let _supportsTransactions = null

/**
 * Check if current MongoDB deployment supports transactions.
 * Uses topology check - transactions require replica set or sharded cluster.
 */
function checkTransactionSupport() {
  if (_supportsTransactions !== null) return _supportsTransactions

  try {
    const topology = mongoose.connection?.client?.topology
    const description = topology?.s?.description || topology?.description
    const type = description?.type

    if (type === 'ReplicaSetWithPrimary' || type === 'Sharded') {
      _supportsTransactions = true
      logger.info(`[Transaction] Transactions supported (topology: ${type})`)
    } else {
      _supportsTransactions = false
      logger.info(
        `[Transaction] Transactions not supported (topology: ${type || 'standalone'}). Using graceful fallback.`
      )
    }
  } catch {
    _supportsTransactions = false
    logger.info(
      '[Transaction] Transactions not supported (could not determine topology). Using graceful fallback.'
    )
  }

  return _supportsTransactions
}

/**
 * Execute a function within a MongoDB transaction.
 * Falls back to non-transactional execution on standalone deployments.
 *
 * @param {Function} fn - async (session) => result
 *   When transactions are available, `session` is a ClientSession.
 *   When not available (standalone), `session` is null.
 *   Pass `session ? { session } : {}` to .save(), .create(), .findOneAndUpdate() etc.
 * @returns {*} The return value of fn
 */
export async function withTransaction(fn) {
  const supportsTransactions = checkTransactionSupport()

  if (!supportsTransactions) {
    return fn(null)
  }

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await fn(session)
    })
    return result
  } finally {
    session.endSession()
  }
}
