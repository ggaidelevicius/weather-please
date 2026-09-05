import AdmZip from 'adm-zip'
import fs from 'node:fs'
import path from 'node:path'

import { rootPath } from './root.mjs'

export const getSourceFiles = ({ rootDirectory = rootPath } = {}) => {
	const files = []
	const visit = (relativePath) => {
		const fullPath = path.join(rootDirectory, relativePath)
		if (!fs.existsSync(fullPath) || isExcluded(relativePath)) return
		const stat = fs.lstatSync(fullPath)
		if (stat.isSymbolicLink()) return
		if (stat.isDirectory()) {
			for (const child of fs.readdirSync(fullPath).sort()) {
				visit(path.join(relativePath, child))
			}
		} else if (stat.isFile()) {
			files.push(relativePath)
		}
	}
	for (const entry of SOURCE_ENTRIES) visit(entry)
	return files.sort()
}

export const createSourceArchive = ({
	rootDirectory = rootPath,
	destination = path.join(rootDirectory, 'extension', 'src.zip'),
} = {}) => {
	const zip = new AdmZip()
	for (const file of getSourceFiles({ rootDirectory })) {
		zip.addFile(
			file.split(path.sep).join('/'),
			fs.readFileSync(path.join(rootDirectory, file)),
		)
	}
	fs.mkdirSync(path.dirname(destination), { recursive: true })
	zip.writeZip(destination)
	return destination
}

const SOURCE_ENTRIES = [
	'.env.example',
	'.gitignore',
	'.prettierrc',
	'.prettierignore',
	'.ncurc.json',
	'.github',
	'.husky',
	'AGENTS.md',
	'CLAUDE.md',
	'README.md',
	'LICENSE.md',
	'PRIVACY.md',
	'package.json',
	'pnpm-lock.yaml',
	'pnpm-workspace.yaml',
	'manifest.json',
	'openstreetmap-tile-rules.json',
	'next.config.ts',
	'babel.config.js',
	'postcss.config.mjs',
	'lingui.config.ts',
	'eslint.config.mjs',
	'tsconfig.json',
	'vercel.json',
	'.node-version',
	'vitest.config.ts',
	'playwright.config.ts',
	'prisma.config.ts',
	'global.d.ts',
	'scripts',
	'src',
	'public',
	'_locales',
	'prisma',
	'docs',
	'e2e',
]

const isExcluded = (file) => {
	const normalized = file.split(path.sep).join('/')
	const name = path.basename(file)
	return (
		normalized.startsWith('src/generated/') ||
		normalized === 'src/generated' ||
		normalized.startsWith('.husky/_') ||
		(name.startsWith('.env') && name !== '.env.example') ||
		name === '.npmrc' ||
		name === '.DS_Store' ||
		/\.(pem|key|zip|tsbuildinfo)$/i.test(name)
	)
}
