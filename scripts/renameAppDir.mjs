import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { rootPath } from './lib/root.mjs'

const srcAppPath = path.join(rootPath, 'src', 'app')
const destAppPath = path.join(rootPath, 'src', '_app')

const validateAction = (action) => {
	if (action !== 'rename' && action !== 'restore') {
		throw new Error(`Invalid action: ${action}`)
	}
}

export async function renameAppDir(action) {
	validateAction(action)

	if (action === 'rename') {
		if (!(await fs.pathExists(srcAppPath))) {
			throw new Error(`'src/app' does not exist`)
		}
		if (await fs.pathExists(destAppPath)) {
			throw new Error(`'src/_app' already exists`)
		}

		await fs.rename(srcAppPath, destAppPath)
		console.log(`Renamed 'src/app' to 'src/_app'`)
		return
	}

	if (!(await fs.pathExists(destAppPath))) {
		throw new Error(`'src/_app' does not exist`)
	}
	if (await fs.pathExists(srcAppPath)) {
		throw new Error(`'src/app' already exists`)
	}

	await fs.rename(destAppPath, srcAppPath)
	console.log(`Renamed 'src/_app' back to 'src/app'`)
}

const isCliInvocation =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCliInvocation) {
	const action = process.argv[2]
	renameAppDir(action).catch((error) => {
		console.error(`Error during renaming:`, error)
		process.exitCode = 1
	})
}
