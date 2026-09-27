import { z } from 'zod'

const MAX_EPOCH_MILLISECONDS = 8_640_000_000_000_000

export const epochMillisecondsSchema = z
	.number()
	.int()
	.min(-MAX_EPOCH_MILLISECONDS)
	.max(MAX_EPOCH_MILLISECONDS)

export const epochSecondsSchema = z
	.number()
	.int()
	.min(-MAX_EPOCH_MILLISECONDS / 1000)
	.max(MAX_EPOCH_MILLISECONDS / 1000)
