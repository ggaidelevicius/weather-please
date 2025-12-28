import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS imports
vi.mock('./styles/tailwind.css', () => ({}))

// Mock queryClient from lib/query-client
vi.mock('./lib/query-client', () => ({
	queryClient: {
		invalidateQueries: vi.fn(),
	},
}))
