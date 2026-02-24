/* eslint-disable no-console */
import fs from 'fs-extra'
import { globSync } from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'
import { setCwdToRoot } from './lib/root.mjs'

export const buildExtensionOutput = () => {
	setCwdToRoot()

	const sourcePath = 'out/_next'
	const destinationPath = 'out/next'
	fs.moveSync(sourcePath, destinationPath, { overwrite: true })
	console.log('Moved _next directory to next.')

	const extensionPath = 'extension'
	fs.ensureDirSync(extensionPath)

	for (const file of fs.readdirSync(extensionPath)) {
		fs.removeSync(path.join(extensionPath, file))
	}

	for (const file of globSync('out/**/*.{html,js}', { nodir: true })) {
		let content = fs.readFileSync(file, 'utf-8')
		content = content.replace(/\/_next\//g, '/next/')
		fs.writeFileSync(file, content, 'utf-8')
	}

	fs.moveSync(
		path.join('out', 'index.html'),
		path.join(extensionPath, 'index.html'),
	)
	fs.moveSync(
		path.join('out', 'favicon.png'),
		path.join(extensionPath, 'favicon.png'),
	)
	fs.copySync(path.join('out', 'next'), path.join(extensionPath, 'next'))
	fs.copySync(path.join('_locales'), path.join(extensionPath, '_locales'))
	fs.removeSync('out')
	fs.copySync('manifest.json', path.join(extensionPath, 'manifest.json'))

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
