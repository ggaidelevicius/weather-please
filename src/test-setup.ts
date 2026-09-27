import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Vitest's fake clock replaces Date, while native Temporal reads the real clock.
// Keep both APIs on the same controllable clock inside tests.
Object.defineProperty(Temporal.Now, 'instant', {
	configurable: true,
	value: () => Temporal.Instant.fromEpochMilliseconds(Date.now()),
	writable: true,
})

// Mock CSS imports
vi.mock('./styles/tailwind.css', () => ({}))
