import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS imports
vi.mock('@/styles/tailwind.css', () => ({}))

// Mock queryClient from _app.tsx
vi.mock('../pages/_app', () => ({
	queryClient: {
		invalidateQueries: vi.fn(),
	},
}))
