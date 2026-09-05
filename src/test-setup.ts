import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock CSS imports
vi.mock('./styles/tailwind.css', () => ({}))
