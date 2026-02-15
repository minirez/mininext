/**
 * Environment Variable Validation
 * Runs at startup before any other initialization.
 * Ensures all required variables are present and valid.
 */
export function validateEnv() {
  const errors = []
  const warnings = []

  // Required variables
  const required = [{ key: 'JWT_SECRET', minLength: 32 }, { key: 'MONGODB_URI' }]

  for (const { key, minLength } of required) {
    const value = process.env[key]
    if (!value) {
      errors.push(`${key} is required but not set`)
    } else if (minLength && value.length < minLength) {
      if (process.env.NODE_ENV === 'production') {
        errors.push(`${key} must be at least ${minLength} characters (currently ${value.length})`)
      } else {
        warnings.push(`${key} should be at least ${minLength} characters for security`)
      }
    }
  }

  // Production-only requirements
  if (process.env.NODE_ENV === 'production') {
    const productionRequired = ['ENCRYPTION_KEY', 'FRONTEND_URL']

    for (const key of productionRequired) {
      if (!process.env[key]) {
        warnings.push(`${key} is recommended in production but not set`)
      }
    }

    // JWT_SECRET entropy check in production
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
      warnings.push('JWT_SECRET should be at least 64 characters in production')
    }
  }

  // Optional but recommended
  const recommended = [
    { key: 'SENTRY_DSN', desc: 'Error tracking' },
    { key: 'REDIS_ENABLED', desc: 'Distributed caching and rate limiting' }
  ]

  for (const { key, desc } of recommended) {
    if (!process.env[key]) {
      warnings.push(`${key} not set (${desc})`)
    }
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn('\n--- Environment Warnings ---')
    warnings.forEach(w => console.warn(`  WARNING: ${w}`))
    console.warn('----------------------------\n')
  }

  // Fail on errors
  if (errors.length > 0) {
    console.error('\n=== Environment Validation Failed ===')
    errors.forEach(e => console.error(`  ERROR: ${e}`))
    console.error('=====================================\n')
    process.exit(1)
  }
}
