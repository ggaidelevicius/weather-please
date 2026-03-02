import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS imports
vi.mock('./styles/tailwind.css', () => ({}))
