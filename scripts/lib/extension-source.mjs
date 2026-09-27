import path from 'node:path'

import { rootPath } from './root.mjs'
import { getSourceFiles } from './source-archive.mjs'

export const getExtensionSourceFiles = ({ rootDirectory = rootPath } = {}) =>
	getSourceFiles({ rootDirectory }).filter((file) => {
		const normalized = file.split(path.sep).join('/')
		// MV3 needs Pages Router's external bootstrap scripts, and only the
		// demo route belongs in the extension's client bundles.
		if (normalized.startsWith('src/app/')) return false
		return (
			!normalized.startsWith('src/pages/') || EXTENSION_PAGES.has(normalized)
		)
	})

const EXTENSION_PAGES = new Set([
	'src/pages/_app.tsx',
	'src/pages/_document.tsx',
	'src/pages/demo.tsx',
])
