import { logWarning, logInfo } from './logger.js'

/**
 * Circuit Breaker Pattern
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail immediately (fast-fail)
 * - HALF_OPEN: Testing if service recovered, allow limited requests
 *
 * Usage:
 *   const breaker = new CircuitBreaker('PayTR', { failureThreshold: 5 })
 *   const result = await breaker.execute(() => paytrApi.call())
 */

const STATE = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
}

export class CircuitBreaker {
  /**
   * @param {string} name - Service name (for logging)
   * @param {Object} options
   * @param {number} options.failureThreshold - Failures before opening (default: 5)
   * @param {number} options.resetTimeout - ms before trying half-open (default: 30s)
   * @param {number} options.halfOpenMax - Max requests in half-open (default: 3)
   * @param {number} options.monitorWindow - Time window for failure counting in ms (default: 60s)
   */
  constructor(name, options = {}) {
    this.name = name
    this.state = STATE.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.halfOpenRequests = 0
    this.lastFailureTime = null
    this.stateChangedAt = Date.now()

    this.failureThreshold = options.failureThreshold || 5
    this.resetTimeout = options.resetTimeout || 30000
    this.halfOpenMax = options.halfOpenMax || 3
    this.monitorWindow = options.monitorWindow || 60000
  }

  /**
   * Execute a function through the circuit breaker
   * @param {Function} fn - Async function to execute
   * @param {Function} fallback - Optional fallback when circuit is open
   * @returns {Promise<*>} Result of fn or fallback
   */
  async execute(fn, fallback) {
    if (this.state === STATE.OPEN) {
      // Check if enough time has passed to try half-open
      if (Date.now() - this.stateChangedAt >= this.resetTimeout) {
        this._transition(STATE.HALF_OPEN)
      } else {
        if (fallback) return fallback()
        throw new CircuitBreakerError(
          `Circuit breaker [${this.name}] is OPEN. Service unavailable.`
        )
      }
    }

    if (this.state === STATE.HALF_OPEN && this.halfOpenRequests >= this.halfOpenMax) {
      if (fallback) return fallback()
      throw new CircuitBreakerError(
        `Circuit breaker [${this.name}] is HALF_OPEN. Max test requests reached.`
      )
    }

    try {
      if (this.state === STATE.HALF_OPEN) {
        this.halfOpenRequests++
      }

      const result = await fn()
      this._onSuccess()
      return result
    } catch (error) {
      this._onFailure()
      throw error
    }
  }

  _onSuccess() {
    if (this.state === STATE.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.halfOpenMax) {
        this._transition(STATE.CLOSED)
      }
    } else {
      // Reset failure count on success in closed state
      this.failureCount = 0
    }
  }

  _onFailure() {
    this.lastFailureTime = Date.now()

    if (this.state === STATE.HALF_OPEN) {
      // Any failure in half-open goes back to open
      this._transition(STATE.OPEN)
      return
    }

    // In closed state, increment failures
    this.failureCount++

    if (this.failureCount >= this.failureThreshold) {
      this._transition(STATE.OPEN)
    }
  }

  _transition(newState) {
    const oldState = this.state
    this.state = newState
    this.stateChangedAt = Date.now()

    if (newState === STATE.CLOSED) {
      this.failureCount = 0
      this.successCount = 0
      this.halfOpenRequests = 0
      logInfo(`Circuit breaker [${this.name}]: ${oldState} -> CLOSED (recovered)`)
    } else if (newState === STATE.OPEN) {
      this.halfOpenRequests = 0
      this.successCount = 0
      logWarning(
        `Circuit breaker [${this.name}]: ${oldState} -> OPEN (failures: ${this.failureCount})`,
        {
          service: this.name,
          failureCount: this.failureCount,
          lastFailure: this.lastFailureTime
        }
      )
    } else if (newState === STATE.HALF_OPEN) {
      this.halfOpenRequests = 0
      this.successCount = 0
      logInfo(`Circuit breaker [${this.name}]: ${oldState} -> HALF_OPEN (testing recovery)`)
    }
  }

  /** Get current state info */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      stateChangedAt: this.stateChangedAt
    }
  }

  /** Reset to closed state manually */
  reset() {
    this._transition(STATE.CLOSED)
  }
}

export class CircuitBreakerError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CircuitBreakerError'
    this.statusCode = 503
  }
}

// Pre-configured breakers for external services
const breakers = new Map()

/**
 * Get or create a circuit breaker for a service
 * @param {string} name - Service identifier
 * @param {Object} options - Circuit breaker options
 * @returns {CircuitBreaker}
 */
export function getCircuitBreaker(name, options) {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options))
  }
  return breakers.get(name)
}

/**
 * Get all circuit breaker states (for health check / monitoring)
 * @returns {Object[]}
 */
export function getAllCircuitBreakerStates() {
  const states = {}
  for (const [name, breaker] of breakers) {
    states[name] = breaker.getState()
  }
  return states
}
