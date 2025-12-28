import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error(
		'DATABASE_URL environment variable is not set. Please configure your database connection.',
	)
}

const adapter = new PrismaPg({ connectionString })

const prisma = new PrismaClient({
	adapter,
	log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

export { prisma }
