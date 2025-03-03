const fs = require('fs-extra')
const path = require('path')

const srcAppPath = path.join(__dirname, 'src', 'app')
const destAppPath = path.join(__dirname, 'src', '_app')

async function renameAppDir(action) {
	try {
		if (action === 'rename') {
			if (await fs.pathExists(srcAppPath)) {
				await fs.rename(srcAppPath, destAppPath)
				console.log(`Renamed 'src/app' to 'src/_app'`)
			} else {
				console.log(`'src/app' does not exist`)
			}
		} else if (action === 'restore') {
			if (await fs.pathExists(destAppPath)) {
				await fs.rename(destAppPath, srcAppPath)
				console.log(`Renamed 'src/_app' back to 'src/app'`)
			} else {
				console.log(`'src/_app' does not exist`)
			}
		} else {
			console.log(`Invalid action: ${action}`)
		}
	} catch (error) {
		console.error(`Error during renaming:`, error)
	}
}

const action = process.argv[2]
renameAppDir(action)
