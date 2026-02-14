/**
 * Jest → Vitest Compatibility Shim
 * Maps @jest/globals imports to Vitest equivalents
 * This allows old tests written with `import { ... } from '@jest/globals'` to work with Vitest
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach, test } from 'vitest'

// vi is Vitest's equivalent of jest
// Add jest.unstable_mockModule as alias for vi.mock (ESM mock compat)
const jest = Object.assign((...args) => vi(...args), vi, {
  unstable_mockModule: vi.mock,
  setTimeout: vi.setConfig ? timeout => vi.setConfig({ testTimeout: timeout }) : () => {}
})

export { describe, it, test, expect, jest, vi, beforeAll, beforeEach, afterAll, afterEach }

// Default export for `import jest from '@jest/globals'`
export default { ...vi, describe, it, test, expect, beforeAll, beforeEach, afterAll, afterEach }
