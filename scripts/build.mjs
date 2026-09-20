import fs from 'fs-extra'
import { globSync } from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'

import { rootPath } from './lib/root.mjs'

export const buildExtensionOutput = ({ rootDirectory = rootPath } = {}) => {
	const fromRoot = (...parts) => path.join(rootDirectory, ...parts)

	const sourcePath = fromRoot('out', '_next')
	const destinationPath = fromRoot('out', 'next')
	fs.moveSync(sourcePath, destinationPath, { overwrite: true })
	console.log('Moved _next directory to next.')

	const extensionPath = fromRoot('extension')
	fs.ensureDirSync(extensionPath)

	for (const file of fs.readdirSync(extensionPath)) {
		fs.removeSync(path.join(extensionPath, file))
	}

	for (const file of globSync(fromRoot('out/**/*.{html,js}'), {
		nodir: true,
	})) {
		let content = fs.readFileSync(file, 'utf-8')
		content = content.replace(/\/_next\//g, '/next/')
		fs.writeFileSync(file, content, 'utf-8')
	}

	// The marketing landing page lives at the site root; the extension's new
	// tab page is the app exported from the /demo route.
	fs.moveSync(
		fromRoot('out', 'demo.html'),
		path.join(extensionPath, 'index.html'),
	)
	fs.moveSync(
		fromRoot('out', 'favicon.png'),
		path.join(extensionPath, 'favicon.png'),
	)
	fs.copySync(fromRoot('out', 'next'), path.join(extensionPath, 'next'))
	fs.copySync(fromRoot('_locales'), path.join(extensionPath, '_locales'))
	fs.removeSync(fromRoot('out'))
	fs.copySync(
		fromRoot('manifest.json'),
		path.join(extensionPath, 'manifest.json'),
	)
	fs.copySync(
		fromRoot('openstreetmap-tile-rules.json'),
		path.join(extensionPath, 'openstreetmap-tile-rules.json'),
	)

	console.log('Processing completed.')
}

const isCliInvocation =
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isCliInvocation) {
	try {
		buildExtensionOutput()
	} catch (error) {
		console.error('An error occurred:', error)
		process.exitCode = 1
	}
}
